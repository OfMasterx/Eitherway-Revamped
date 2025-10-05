import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { useAnimate } from 'framer-motion';
import { memo, useEffect, useRef, useState } from 'react';
import { cssTransition, toast, ToastContainer } from 'react-toastify';
import { useShortcuts, useSnapScroll } from '~/lib/hooks';
import { useChatHistory } from '~/lib/persistence';
import { chatStore } from '~/lib/stores/chat';
import { cubicEasingFn } from '~/utils/easings';
import { createScopedLogger } from '~/utils/logger';
import { streamFromFastify, type StreamController } from '~/utils/streamClient';
import { BaseChat } from './BaseChat';

const toastAnimation = cssTransition({
  enter: 'animated fadeInRight',
  exit: 'animated fadeOutRight',
});

const logger = createScopedLogger('Chat');

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

  const [chatStarted, setChatStarted] = useState(initialMessages.length > 0);

  const { showChat } = useStore(chatStore);

  useEffect(() => {
    console.log('Chat.client - setting chatStarted to:', chatStarted);
    chatStore.setKey('started', chatStarted);
  }, [chatStarted]);

  const [animationScope, animate] = useAnimate();

  // Local state for messages (replaces useChat)
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const streamControllerRef = useRef<StreamController | null>(null);

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

  const scrollTextArea = () => {
    const textarea = textareaRef.current;

    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  };

  const abort = () => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    setIsLoading(false);
    chatStore.setKey('aborted', true);
  };

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

    if (_input.length === 0 || isLoading) {
      return;
    }

    chatStore.setKey('aborted', false);

    runAnimation();

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: _input,
    };

    // Add empty assistant message placeholder
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setIsLoading(true);

    textareaRef.current?.blur();

    // Stream response from Fastify backend
    try {
      const controller = await streamFromFastify({
        prompt: _input,
        chunkSize: 20,
        delayMs: 150,
        onChunk: (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.id === assistantMessageId) {
              lastMessage.content += chunk;
            }
            return updated;
          });
        },
        onComplete: () => {
          setIsLoading(false);
          streamControllerRef.current = null;
          logger.debug('Streaming complete');
        },
        onError: (error) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.id === assistantMessageId) {
              lastMessage.content = `[Error: ${error}]`;
            }
            return updated;
          });
          setIsLoading(false);
          streamControllerRef.current = null;
          toast.error(`Streaming error: ${error}`);
          logger.error('Streaming error:', error);
        },
      });

      streamControllerRef.current = controller;
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage && lastMessage.id === assistantMessageId) {
          lastMessage.content = `[Error: ${error instanceof Error ? error.message : 'Unknown error'}]`;
        }
        return updated;
      });
      setIsLoading(false);
      toast.error('Failed to start streaming');
      logger.error('Failed to start streaming:', error);
    }
  };

  const [messageRef, scrollRef] = useSnapScroll();

  return (
    <BaseChat
      ref={animationScope}
      textareaRef={textareaRef}
      input={input}
      showChat={showChat}
      chatStarted={chatStarted}
      isStreaming={isLoading}
      sendMessage={sendMessage}
      messageRef={messageRef}
      scrollRef={scrollRef}
      handleInputChange={handleInputChange}
      handleStop={abort}
      minTextareaHeight={131}
      messages={messages}
    />
  );
});
