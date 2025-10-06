import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | { text?: string; type?: string } | any;
  error?: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

// Helper to extract text from different content formats
function extractMessageText(content: any): string {
  if (!content) return '';

  // If it's already a string, return it
  if (typeof content === 'string') {
    return content;
  }

  // If it's an object with a 'text' property
  if (typeof content === 'object' && content.text) {
    return content.text;
  }

  // If it's an array, extract text from each item
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item.type === 'text' && item.text) return item.text;
        if (item.text) return item.text;
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  // Fallback: try to stringify
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return '[Unable to display message]';
  }
}

export default function ChatPanel({ messages, onSendMessage, disabled }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-message system">
            Start by describing the app you want to build...
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${msg.role} ${msg.error ? 'error' : ''}`}
          >
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
              {extractMessageText(msg.content)}
            </pre>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the app you want to build..."
            rows={3}
            disabled={disabled}
          />
        </div>
        <button
          type="submit"
          className="chat-send-btn"
          disabled={disabled || !input.trim()}
        >
          Send
        </button>
      </form>
    </>
  );
}
