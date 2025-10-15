/**
 * Human-friendly labels for tool execution status
 * Maps internal tool names to user-facing descriptions
 */

export function getToolActiveLabel(toolName: string): string {
  switch (toolName) {
    case 'web_search':
      return 'Searching web';
    case 'either-view':
      return 'Reading file';
    case 'either-write':
      return 'Writing file';
    case 'either-line-replace':
      return 'Editing file';
    case 'either-search-files':
      return 'Searching files';
    case 'eithergen--generate_image':
      return 'Generating image';
    default:
      return `Running ${toolName}`;
  }
}

export function getToolCompleteLabel(toolName: string): string {
  switch (toolName) {
    case 'web_search':
      return 'Searched web';
    case 'either-view':
      return 'Read file';
    case 'either-write':
      return 'Wrote file';
    case 'either-line-replace':
      return 'Edited file';
    case 'either-search-files':
      return 'Searched files';
    case 'eithergen--generate_image':
      return 'Generated image';
    default:
      return `Finished ${toolName}`;
  }
}
