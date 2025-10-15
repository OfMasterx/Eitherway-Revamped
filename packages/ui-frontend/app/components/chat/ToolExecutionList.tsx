/**
 * ToolExecutionList - v0-style tool execution status display
 * Shows active tools with spinners and completed tools with checkmarks
 */

interface ToolCall {
  toolUseId: string;
  toolName: string;
  status: 'active' | 'complete';
  taskNameActive?: string;
  taskNameComplete?: string;
  durationMs?: number;
  startedAt?: number;
}

interface ToolExecutionListProps {
  toolCalls: ToolCall[];
}

export function ToolExecutionList({ toolCalls }: ToolExecutionListProps) {
  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm text-bolt-elements-textSecondary">
      {toolCalls.map((tool) => {
        const label = tool.status === 'complete'
          ? tool.taskNameComplete || `Finished ${tool.toolName}`
          : tool.taskNameActive || `Running ${tool.toolName}`;

        const duration = tool.durationMs
          ? `${(tool.durationMs / 1000).toFixed(1)}s`
          : null;

        return (
          <div key={tool.toolUseId} className="flex items-center gap-2">
            {tool.status === 'active' ? (
              <div className="i-ph:spinner animate-spin text-blue-400" />
            ) : (
              <div className="i-ph:check-circle text-green-400" />
            )}
            <span className="flex-1">{label}</span>
            {duration && tool.status === 'complete' && (
              <span className="text-xs text-gray-400 opacity-70">
                {duration}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
