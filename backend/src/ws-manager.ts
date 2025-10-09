import { SocketStream } from '@fastify/websocket';
import { AgentEvent } from './types.js';

/**
 * WebSocket Connection Manager
 * Manages active WebSocket connections by sessionId for broadcasting events
 */
class WebSocketManager {
  private connections: Map<string, SocketStream> = new Map();

  /**
   * Register a WebSocket connection for a session
   */
  register(sessionId: string, socket: SocketStream): void {
    this.connections.set(sessionId, socket);
    console.log(`[WS Manager] Registered connection for session: ${sessionId}`);
  }

  /**
   * Unregister a WebSocket connection
   */
  unregister(sessionId: string): void {
    this.connections.delete(sessionId);
    console.log(`[WS Manager] Unregistered connection for session: ${sessionId}`);
  }

  /**
   * Broadcast an event to a specific session's WebSocket connection
   */
  broadcast(sessionId: string, event: AgentEvent): void {
    const socket = this.connections.get(sessionId);
    if (socket && socket.readyState === 1) { // 1 = OPEN
      socket.send(JSON.stringify(event));
    }
  }

  /**
   * Check if a session has an active connection
   */
  hasConnection(sessionId: string): boolean {
    const socket = this.connections.get(sessionId);
    return socket !== undefined && socket.readyState === 1;
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();
