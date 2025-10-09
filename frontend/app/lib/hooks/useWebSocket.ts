import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';

/**
 * Phase 1 Agent Event Protocol
 */
type AgentEvent =
  | { type: 'status'; message: string }
  | { type: 'assistant_started'; content: string }
  | { type: 'assistant_delta'; content: string }
  | { type: 'assistant_complete' }
  | {
      type: 'file_op';
      op: 'write' | 'rename' | 'delete';
      path: string;
      status: 'start' | 'complete' | 'error';
      error?: string;
    }
  | { type: 'files_updated'; files: any[]; sessionId?: string }
  | { type: 'response'; content: string }
  | { type: 'error'; message: string };

export interface FileOperation {
  id: string;
  op: 'write' | 'rename' | 'delete';
  path: string;
  status: 'start' | 'complete' | 'error';
  error?: string;
  timestamp: number;
}

interface UseWebSocketOptions {
  url: string;
  sessionId: string | null;
  onFilesUpdated?: (files: any[]) => void;
}

export function useWebSocket({ url, sessionId, onFilesUpdated }: UseWebSocketOptions) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [fileOperations, setFileOperations] = useState<FileOperation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const currentAssistantMessageId = useRef<string | null>(null);
  const onFilesUpdatedRef = useRef(onFilesUpdated);

  // Keep the callback ref up to date
  useEffect(() => {
    onFilesUpdatedRef.current = onFilesUpdated;
  }, [onFilesUpdated]);

  const clearMessages = useCallback((newMessages: Message[] = []) => {
    setMessages(newMessages);
    currentAssistantMessageId.current = null;
  }, []);

  // Fetch initial files when session changes
  useEffect(() => {
    setFiles([]);

    const fetchFiles = async () => {
      if (!sessionId) {
        return;
      }

      try {
        console.log('[useWebSocket] Fetching files for session:', sessionId);
        const response = await fetch(`/api/sessions/${sessionId}/files/tree`);
        const data = await response.json();
        if (data.files) {
          console.log('[useWebSocket] Received', data.files.length, 'files for session:', sessionId);
          setFiles(data.files);
          onFilesUpdatedRef.current?.(data.files);
        }
      } catch (error) {
        console.error('Failed to fetch initial files:', error);
      }
    };

    fetchFiles();
  }, [sessionId]); // Removed onFilesUpdated from deps

  // WebSocket connection
  useEffect(() => {
    if (!sessionId) {
      setConnected(false);
      return;
    }

    let isCleanup = false;
    const wsUrl = `${url}?sessionId=${sessionId}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('✅ WebSocket connected successfully for session:', sessionId);
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      const data: AgentEvent = JSON.parse(event.data);

      switch (data.type) {
        case 'status':
          // System status message
          setMessages((prev) => [
            ...prev,
            {
              id: `status-${Date.now()}`,
              role: 'system' as const,
              content: data.message,
            },
          ]);
          break;

        case 'assistant_started':
          // Start new streaming assistant message
          setIsStreaming(true);
          const assistantId = `assistant-${Date.now()}`;
          currentAssistantMessageId.current = assistantId;

          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: 'assistant',
              content: data.content,
            },
          ]);
          break;

        case 'assistant_delta':
          // Append to current streaming message
          if (currentAssistantMessageId.current) {
            setMessages((prev) => {
              const updated = [...prev];
              const msgIndex = updated.findIndex((m) => m.id === currentAssistantMessageId.current);
              if (msgIndex !== -1) {
                updated[msgIndex] = {
                  ...updated[msgIndex],
                  content: updated[msgIndex].content + data.content,
                };
              }
              return updated;
            });
          }
          break;

        case 'assistant_complete':
          // End streaming
          setIsStreaming(false);
          currentAssistantMessageId.current = null;
          break;

        case 'response':
          // Fallback: non-streaming response (legacy support)
          setIsStreaming(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: data.content,
            },
          ]);
          currentAssistantMessageId.current = null;
          break;

        case 'file_op':
          // File operation progress
          setFileOperations((prev) => {
            const opId = `${data.op}-${data.path}`;
            const existing = prev.find((op) => op.id === opId);

            if (existing) {
              // Update existing operation
              return prev.map((op) =>
                op.id === opId
                  ? {
                      ...op,
                      status: data.status,
                      error: data.error,
                      timestamp: Date.now(),
                    }
                  : op
              );
            } else {
              // Add new operation
              return [
                ...prev,
                {
                  id: opId,
                  op: data.op,
                  path: data.path,
                  status: data.status,
                  error: data.error,
                  timestamp: Date.now(),
                },
              ];
            }
          });

          // Auto-remove completed/error operations after 3 seconds
          if (data.status === 'complete' || data.status === 'error') {
            setTimeout(() => {
              setFileOperations((prev) =>
                prev.filter((op) => op.id !== `${data.op}-${data.path}`)
              );
            }, 3000);
          }
          break;

        case 'files_updated':
          if (data.files) {
            setFiles(data.files);
            onFilesUpdatedRef.current?.(data.files);
          }
          // Clear file operations when tree updates
          setFileOperations([]);
          break;

        case 'error':
          // Show toast notification for rate limit and other errors
          if (data.message && data.message.toLowerCase().includes('rate limit')) {
            toast.error(data.message);
          }

          setIsStreaming(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              role: 'system' as const,
              content: `Error: ${data.message}`,
            },
          ]);
          currentAssistantMessageId.current = null;
          break;
      }
    };

    websocket.onclose = () => {
      if (!isCleanup) {
        console.log('⚠️ WebSocket disconnected unexpectedly');
        setConnected(false);
      } else {
        console.log('🔄 WebSocket closed for cleanup (React StrictMode)');
      }
      setIsStreaming(false);
      currentAssistantMessageId.current = null;
    };

    websocket.onerror = (error) => {
      if (!isCleanup) {
        console.error('❌ WebSocket error:', error);
      }
      setIsStreaming(false);
    };

    ws.current = websocket;

    return () => {
      isCleanup = true;
      websocket.close();
    };
  }, [url, sessionId]); // Removed onFilesUpdated from deps

  const sendMessage = useCallback(
    (prompt: string) => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        // Add user message to chat
        setMessages((prev) => [
          ...prev,
          {
            id: `user-${Date.now()}`,
            role: 'user',
            content: prompt,
          },
        ]);

        // Send to backend
        ws.current.send(
          JSON.stringify({
            type: 'prompt',
            prompt,
          })
        );
      }
    },
    []
  );

  return {
    connected,
    messages,
    files,
    fileOperations,
    isStreaming,
    sendMessage,
    clearMessages,
  };
}
