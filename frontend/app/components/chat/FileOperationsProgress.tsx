import { memo } from 'react';
import { classNames } from '~/utils/classNames';
import type { FileOperation } from '~/lib/hooks/useWebSocket';

interface FileOperationsProgressProps {
  operations: FileOperation[];
}

export const FileOperationsProgress = memo(({ operations }: FileOperationsProgressProps) => {
  if (operations.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-8 z-50 bg-eitherway-elements-background-depth-2 border border-white/10 rounded-lg p-3 min-w-[280px] max-w-[400px] shadow-xl">
      <div className="text-xs font-semibold text-white/60 mb-2">File Operations</div>
      <div className="space-y-2">
        {operations.map((op) => (
          <div
            key={op.id}
            className={classNames(
              'flex items-center gap-2 text-sm transition-all duration-200',
              {
                'text-white/90': op.status === 'start',
                'text-green-400': op.status === 'complete',
                'text-red-400': op.status === 'error',
              }
            )}
          >
            <div className="flex-shrink-0">
              {op.status === 'start' && (
                <img
                  src="/icons/chat/loader.svg"
                  alt="Loading"
                  className="w-4 h-4 animate-spin"
                />
              )}
              {op.status === 'complete' && (
                <div className="i-ph:check-circle-fill text-green-400 text-lg" />
              )}
              {op.status === 'error' && (
                <div className="i-ph:x-circle-fill text-red-400 text-lg" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate">
                {op.status === 'start' && (
                  <>
                    {op.op === 'write' && 'Creating '}
                    {op.op === 'rename' && 'Renaming '}
                    {op.op === 'delete' && 'Deleting '}
                    <span className="font-mono text-xs">{op.path}</span>
                  </>
                )}
                {op.status === 'complete' && (
                  <>
                    {op.op === 'write' && 'Created '}
                    {op.op === 'rename' && 'Renamed '}
                    {op.op === 'delete' && 'Deleted '}
                    <span className="font-mono text-xs">{op.path}</span>
                  </>
                )}
                {op.status === 'error' && (
                  <>
                    <span className="font-mono text-xs">{op.path}</span>
                    {op.error && (
                      <div className="text-xs text-red-300 mt-1">{op.error}</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

FileOperationsProgress.displayName = 'FileOperationsProgress';
