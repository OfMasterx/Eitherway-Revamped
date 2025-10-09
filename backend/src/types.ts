/**
 * Agent Event Protocol - Phase 1
 * Unified message types for WebSocket communication
 */

export type AgentEvent =
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

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
}
