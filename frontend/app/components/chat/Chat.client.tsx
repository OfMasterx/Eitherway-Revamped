import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { useAnimate } from 'framer-motion';
import { memo, useEffect, useRef, useState } from 'react';
import { cssTransition, toast, ToastContainer } from 'react-toastify';
import { useShortcuts, useSnapScroll, useWebSocket } from '~/lib/hooks';
import { useChatHistory } from '~/lib/persistence';
import { chatStore } from '~/lib/stores/chat';
import { cubicEasingFn } from '~/utils/easings';
import { createScopedLogger } from '~/utils/logger';
import { BaseChat } from './BaseChat';
import { FileOperationsProgress } from './FileOperationsProgress';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

const logger = createScopedLogger('Chat');

// Get WebSocket URL - use relative URL to go through Vite proxy
const getWebSocketUrl = () => {
  if (typeof window === 'undefined') return 'ws://localhost:5173/api/agent';

  // Use relative URL to leverage Vite's proxy to backend
  // Vite will proxy ws://localhost:5173/api/agent -> wss://localhost:3001/api/agent
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host; // includes port

  return `${protocol}//${host}/api/agent`;
};

export function Chat() {
  const { ready, initialMessages, storeMessageHistory } = useChatHistory();

  return (
    <>
      {ready && <ChatImpl initialMessages={initialMessages} storeMessageHistory={storeMessageHistory} />}
      <ToastContainer
        closeButton={({ closeToast }) => {
          return (
            <button className="Toastify__close-button" onClick={closeToast}>
              <div className="i-ph:x text-lg" />
            </button>
          );
        }}
        icon={({ type }) => {
          switch (type) {
            case 'success': {
              return <div className="i-ph:check-bold text-eitherway-elements-icon-success text-2xl" />;
            }
            case 'error': {
              return <div className="i-ph:warning-circle-bold text-eitherway-elements-icon-error text-2xl" />;
            }
          }

          return undefined;
        }}
        position="bottom-right"
        pauseOnFocusLoss
        transition={toastAnimation}
      />
    </>
  );
}

interface ChatProps {
  initialMessages: Message[];
  storeMessageHistory: (messages: Message[]) => Promise<void>;
}

export const ChatImpl = memo(({ initialMessages, storeMessageHistory }: ChatProps) => {
  useShortcuts();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Session management - create session via API
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize or create session
    const initSession = async () => {
      if (typeof window === 'undefined') return;

      // Check for existing session in localStorage
      const existingId = localStorage.getItem('currentSessionId');
      if (existingId) {
        // Verify session exists on backend
        try {
          const response = await fetch(`/api/sessions/${existingId}`);
          if (response.ok) {
            setSessionId(existingId);
            return;
          }
        } catch (error) {
          console.warn('[Chat] Existing session not found, creating new one');
        }
      }

      // Create new session
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'user@localhost',  // Default anonymous user
            title: `Chat ${new Date().toLocaleString()}`,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.statusText}`);
        }

        const session = await response.json();
        localStorage.setItem('currentSessionId', session.id);
        setSessionId(session.id);
        console.log('[Chat] Created new session:', session.id);
      } catch (error) {
        console.error('[Chat] Failed to create session:', error);
        toast.error('Failed to create session');
      }
    };

    initSession();
  }, []);

  const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);
  const [input, setInput] = useState('');

  const { showChat } = useStore(chatStore);

  useEffect(() => {
    console.log('Chat.client - setting chatStarted to:', chatStarted);
    chatStore.setKey('started', chatStarted);
  }, [chatStarted]);

  const [animationScope, animate] = useAnimate();

  // Use WebSocket hook with Phase 1 protocol
  const {
    connected,
    messages,
    files,
    fileOperations,
    isStreaming,
    sendMessage: wsSendMessage,
  } = useWebSocket({
    url: getWebSocketUrl(),
    sessionId,
    onFilesUpdated: (updatedFiles) => {
      console.log('[Chat] Files updated:', updatedFiles.length);
      // Sync files to workbench store
      import('~/lib/stores/workbench').then(({ workbenchStore }) => {
        workbenchStore.files.set(updatedFiles);
      });
    },
  });

  // Sync sessionId to workbench store
  useEffect(() => {
    import('~/lib/stores/workbench').then(({ workbenchStore }) => {
      workbenchStore.sessionId = sessionId;
    });
  }, [sessionId]);

  const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

  useEffect(() => {
    chatStore.setKey('started', initialMessages.length > 0);
  }, []);

  useEffect(() => {
    // Store message history when messages change
    if (messages.length > initialMessages.length) {
      storeMessageHistory(messages).catch((error) => toast.error(error.message));
    }
  }, [messages, storeMessageHistory, initialMessages.length]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  useEffect(() => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.style.height = 'auto';

      const scrollHeight = textarea.scrollHeight;

      textarea.style.height = `${Math.min(scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
      textarea.style.overflowY = scrollHeight > TEXTAREA_MAX_HEIGHT ? 'auto' : 'hidden';
    }
  }, [input, textareaRef, TEXTAREA_MAX_HEIGHT]);

  const runAnimation = async () => {
    if (chatStarted) {
      return;
    }

    console.log('Chat.client - runAnimation called, setting chatStarted to true');

    await Promise.all([
      animate('#examples', { opacity: 0, display: 'none' }, { duration: 0.1 }),
      animate('#intro', { opacity: 0, flex: 1 }, { duration: 0.2, ease: cubicEasingFn }),
    ]);

    chatStore.setKey('started', true);
    setChatStarted(true);
  };

  const sendMessage = async (_event: React.UIEvent, messageInput?: string) => {
    const _input = messageInput || input;

    if (_input.length === 0 || isStreaming) {
      return;
    }

    if (!connected) {
      toast.error('Not connected to server');
      return;
    }

    chatStore.setKey('aborted', false);

    runAnimation();

    // Clear input
    setInput('');

    // Send via WebSocket
    wsSendMessage(_input);

    textareaRef.current?.blur();
  };

  const abort = () => {
    // For WebSocket, we don't have a direct abort mechanism
    // The backend handles the response lifecycle
    chatStore.setKey('aborted', true);
    logger.debug('User aborted streaming');
  };

  const [messageRef, scrollRef] = useSnapScroll();

  return (
    <>
      <BaseChat
        ref={animationScope}
        textareaRef={textareaRef}
        input={input}
        showChat={showChat}
        chatStarted={chatStarted}
        isStreaming={isStreaming}
        sendMessage={sendMessage}
        messageRef={messageRef}
        scrollRef={scrollRef}
        handleInputChange={handleInputChange}
        handleStop={abort}
        minTextareaHeight={131}
        messages={messages}
      />
      <FileOperationsProgress operations={fileOperations} />
    </>
  );
});
