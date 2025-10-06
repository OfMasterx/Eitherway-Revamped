import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import type { PostgresFileStore } from '@eitherway/database';

/**
 * Recursively hydrate an app with files from the scaffold template
 */
export async function hydrateAppFromScaffold(
  fileStore: PostgresFileStore,
  appId: string,
  scaffoldPath: string
): Promise<number> {
  let filesCreated = 0;

  async function walkDirectory(dirPath: string, basePath: string) {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = relative(basePath, fullPath);

      if (entry.isDirectory()) {
        // Recursively walk subdirectories
        await walkDirectory(fullPath, basePath);
      } else if (entry.isFile()) {
        // Read file content
        const content = await readFile(fullPath, 'utf-8');

        // Determine mime type based on extension
        const mimeType = getMimeType(entry.name);

        // Write to database
        await fileStore.write(appId, relativePath, content, mimeType);
        filesCreated++;
      }
    }
  }

  await walkDirectory(scaffoldPath, scaffoldPath);
  return filesCreated;
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    'ts': 'text/typescript',
    'tsx': 'text/typescript',
    'js': 'text/javascript',
    'jsx': 'text/javascript',
    'json': 'application/json',
    'html': 'text/html',
    'css': 'text/css',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'svg': 'image/svg+xml',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'cjs': 'text/javascript',
  };

  return mimeTypes[ext || ''] || 'text/plain';
}
