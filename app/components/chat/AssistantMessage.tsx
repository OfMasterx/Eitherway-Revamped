import { memo } from 'react';
import { Markdown } from './Markdown';

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
}

export const AssistantMessage = memo(({ content, isStreaming = false }: AssistantMessageProps) => {
  return (
    <div className="overflow-hidden w-full">
      <Markdown html>{content}</Markdown>
      {isStreaming && (
        <div className="absolute bottom-0 left-0 right-0 h-2 overflow-hidden rounded-b-lg">
          <div
            className="w-[200%] h-full animate-barbershop"
            style={{
              background:
                'linear-gradient(45deg, #0D00FF -15%, #FFFFFF 0%, #429BFF 15%, #0D00FF 30%, #FFFFFF 50%, #87CEEB 70%, #0D00FF 85%, #FFFFFF 100%, #429BFF 115%)',
            }}
          />
        </div>
      )}
    </div>
  );
});
