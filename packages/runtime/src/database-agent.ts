import { Agent, AgentOptions, StreamingCallbacks } from './agent.js';
import type { DatabaseClient, Session, Message } from '@eitherway/database';
import {
  SessionsRepository,
  MessagesRepository,
  SessionMemoryRepository,
  WorkingSetRepository,
  EventsRepository,
} from '@eitherway/database';

export interface DatabaseAgentOptions extends Omit<AgentOptions, 'workingDir'> {
  db: DatabaseClient;
  sessionId: string;
  userId?: string;
  appId?: string;
  workingDir?: string;
}

export class DatabaseAgent {
  private agent: Agent;
  private db: DatabaseClient;
  private sessionsRepo: SessionsRepository;
  private messagesRepo: MessagesRepository;
  private memoryRepo: SessionMemoryRepository;
  private workingSetRepo: WorkingSetRepository;
  private eventsRepo: EventsRepository;
  private sessionId: string;
  private appId?: string;

  constructor(options: DatabaseAgentOptions) {
    this.db = options.db;
    this.sessionId = options.sessionId;
    this.appId = options.appId;

    this.sessionsRepo = new SessionsRepository(this.db);
    this.messagesRepo = new MessagesRepository(this.db);
    this.memoryRepo = new SessionMemoryRepository(this.db);
    this.workingSetRepo = new WorkingSetRepository(this.db);
    this.eventsRepo = new EventsRepository(this.db);

    this.agent = new Agent({
      workingDir: options.workingDir || process.cwd(),
      claudeConfig: options.claudeConfig,
      agentConfig: options.agentConfig,
      executors: options.executors,
      dryRun: options.dryRun,
      webSearch: options.webSearch,
    });
  }

  async processRequest(prompt: string, callbacks?: StreamingCallbacks): Promise<string> {
    await this.eventsRepo.log(
      'request.started',
      { prompt },
      {
        sessionId: this.sessionId,
        actor: 'user',
      },
    );

    // Load previous conversation history from database
    const previousMessages = await this.messagesRepo.findRecentBySession(this.sessionId, 50);

    // Convert database messages to Agent message format (filter out system/tool messages)
    const conversationHistory = previousMessages
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg) => {
        let content = msg.content;

        // Ensure content is always an array (Claude API requirement)
        if (typeof content === 'string') {
          // Plain string - wrap in text block
          content = [{ type: 'text', text: content }];
        } else if (typeof content === 'object' && content !== null) {
          if (Array.isArray(content)) {
            // Already an array - clean up any invalid redacted_thinking blocks from old data
            content = this.cleanupInvalidRedactedThinkingBlocks(content);
          } else if ('text' in content && content.text) {
            // Object with text property - wrap in array
            content = [{ type: 'text', text: content.text }];
          } else {
            // Other object - stringify and wrap
            content = [{ type: 'text', text: JSON.stringify(content) }];
          }
        } else {
          // Fallback for any other type
          content = [{ type: 'text', text: String(content) }];
        }

        return {
          role: msg.role as 'user' | 'assistant',
          content,
        };
      });

    // Load conversation history into agent
    this.agent.loadConversationHistory(conversationHistory);

    const userMessage = await this.messagesRepo.create(
      this.sessionId,
      'user' as const,
      { text: prompt },
      undefined,
      undefined,
    );

    // Create assistant message BEFORE streaming starts (with empty content)
    // This ensures we have a database ID to send in stream_start
    const assistantMessage = await this.messagesRepo.create(
      this.sessionId,
      'assistant' as const,
      { text: '' }, // Placeholder - will be updated after streaming
      'claude-sonnet-4-5',
      undefined, // Token count will be set after completion
    );

    // Notify that the message was created (so server can send stream_start with real DB ID)
    if (callbacks?.onMessageCreated) {
      callbacks.onMessageCreated(assistantMessage.id.toString());
    }

    await this.sessionsRepo.touchLastMessage(this.sessionId);

    let response: string;
    let tokenCount = 0;

    try {
      response = await this.agent.processRequest(prompt, callbacks);

      const estimatedTokens = Math.ceil(response.length / 4);
      tokenCount = estimatedTokens;

      // Get the full conversation history to update the assistant message properly
      const history = this.agent.getHistory();
      const lastAssistantMessage = history[history.length - 1];

      // Save the full content (could be text or array of content blocks)
      const contentToSave =
        lastAssistantMessage?.role === 'assistant' ? lastAssistantMessage.content : { text: response };

      // UPDATE the existing message instead of creating a new one
      await this.messagesRepo.updateContent(assistantMessage.id, contentToSave as any, tokenCount);

      await this.sessionsRepo.touchLastMessage(this.sessionId);

      await this.eventsRepo.log(
        'request.completed',
        {
          userMessageId: userMessage.id,
          assistantMessageId: assistantMessage.id,
          tokenCount,
        },
        {
          sessionId: this.sessionId,
          actor: 'assistant',
        },
      );

      await this.updateMemoryIfNeeded();
    } catch (error: any) {
      await this.eventsRepo.log(
        'request.failed',
        {
          error: error.message,
          stack: error.stack,
        },
        {
          sessionId: this.sessionId,
          actor: 'system',
        },
      );
      throw error;
    }

    return response;
  }

  private async updateMemoryIfNeeded(): Promise<void> {
    const messageCount = await this.messagesRepo.countBySession(this.sessionId);

    if (messageCount % 10 === 0) {
      const recentMessages = await this.messagesRepo.findRecentBySession(this.sessionId, 20);

      const summary = this.generateSummary(recentMessages);

      await this.memoryRepo.upsert(this.sessionId, {
        rollingSummary: summary,
        lastCompactedMessageId: recentMessages[recentMessages.length - 1]?.id.toString(),
      });
    }
  }

  /**
   * Clean up invalid redacted_thinking blocks from old database data
   * These were created by buggy code that manually converted thinking blocks to fake redacted_thinking
   * Valid redacted_thinking blocks have encrypted base64 data, invalid ones have plain text like '[redacted]'
   */
  private cleanupInvalidRedactedThinkingBlocks(contentBlocks: any[]): any[] {
    return contentBlocks.map((block) => {
      if (block.type === 'redacted_thinking' && block.data) {
        // Check if this is an invalid fake redacted_thinking block
        // Valid encrypted data is base64 encoded and much longer (100+ chars)
        // Invalid data is plain text like '[redacted]' (< 50 chars)
        const dataStr = String(block.data);

        if (dataStr.length < 50 || !this.isBase64Encrypted(dataStr)) {
          // This is invalid - convert back to thinking block or remove
          console.log('[DatabaseAgent] Removing invalid redacted_thinking block with data:', dataStr);

          // If there's thinking content, convert to proper thinking block, otherwise filter out
          if (block.text || block.thinking) {
            return {
              type: 'thinking',
              thinking: block.thinking || block.text, // Use 'thinking' field, fallback to 'text' for old data
            };
          } else {
            // No thinking content - return null to filter out later
            return null;
          }
        }
      }

      return block;
    }).filter(Boolean); // Remove null entries
  }

  /**
   * Check if a string looks like valid base64-encoded encrypted data
   */
  private isBase64Encrypted(str: string): boolean {
    // Valid encrypted data should be base64 with mixed case and special chars
    // and be reasonably long (> 100 chars)
    if (str.length < 100) return false;

    // Base64 regex pattern
    const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
    return base64Pattern.test(str);
  }

  private generateSummary(messages: Message[]): string {
    const userMessages = messages.filter((m) => m.role === 'user');
    const topics = userMessages
      .map((m) => {
        if (typeof m.content === 'object' && m.content.text) {
          return m.content.text.substring(0, 50);
        }
        return '';
      })
      .filter(Boolean);

    return `Recent topics: ${topics.join(', ')}`;
  }

  async saveTranscript(): Promise<void> {
    await this.agent.saveTranscript();
  }

  async addToWorkingSet(fileId: string, reason?: string): Promise<void> {
    if (!this.appId) {
      throw new Error('Cannot add to working set: no appId');
    }

    await this.workingSetRepo.add(this.sessionId, this.appId, fileId, reason, 'agent');
  }

  async getWorkingSet(): Promise<any[]> {
    return this.workingSetRepo.findBySessionWithFiles(this.sessionId);
  }

  async getSessionContext(): Promise<{
    session: Session | null;
    recentMessages: Message[];
    memory: any;
    workingSet: any[];
  }> {
    const session = await this.sessionsRepo.findById(this.sessionId);
    const recentMessages = await this.messagesRepo.findRecentBySession(this.sessionId, 10);
    const memory = await this.memoryRepo.findBySession(this.sessionId);
    const workingSet = await this.workingSetRepo.findBySessionWithFiles(this.sessionId);

    return { session, recentMessages, memory, workingSet };
  }

  /**
   * Set database context for file operations
   */
  setDatabaseContext(fileStore: any, appId: string, sessionId?: string): void {
    this.agent.setDatabaseContext(fileStore, appId, sessionId);
  }
}
