import { memo, useRef, useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { IconButton } from '~/components/ui/IconButton';
import { PortDropdown } from './PortDropdown';
import { workbenchStore } from '~/lib/stores/workbench';
import PreviewPaneCore from './PreviewPaneCore';

/**
 * Phase 3: PreviewEnhanced
 *
 * Preserves stable deployed WebContainer internals (PreviewPaneCore):
 * - WebContainer singleton with COEP credentialless
 * - Session-aware boot/teardown
 * - File syncing via session API
 * - CDN proxy support
 * - Overlay messages ("Booting...", "Switching...")
 *
 * Wraps with stripped-fe chrome:
 * - Address bar
 * - Reload button
 * - Port dropdown
 * - Styled UI from stripped-fe
 */

interface PreviewEnhancedProps {
  files: any[];
  sessionId: string | null;
}

export const PreviewEnhanced = memo(({ files, sessionId }: PreviewEnhancedProps) => {
  const [url, setUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);
  const hasSelectedPreview = useRef(false);

  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];

  const coreRef = useRef<HTMLIFrameElement>(null);

  const handleUrlChange = useCallback((newUrl: string) => {
    setPreviewUrl(newUrl);
    setUrl(newUrl);
  }, []);

  const validateUrl = useCallback(
    (value: string) => {
      if (!previewUrl) {
        return false;
      }

      if (value === previewUrl) {
        return true;
      } else if (value.startsWith(previewUrl)) {
        return ['/', '?', '#'].includes(value.charAt(previewUrl.length));
      }

      return false;
    },
    [previewUrl]
  );

  const reloadPreview = useCallback(() => {
    if (coreRef.current) {
      const iframe = coreRef.current.querySelector('iframe');
      if (iframe) {
        iframe.src = iframe.src;
      }
    }
  }, []);

  const findMinPortIndex = useCallback(
    (minIndex: number, preview: { port: number }, index: number, array: { port: number }[]) => {
      return preview.port < array[minIndex].port ? index : minIndex;
    },
    []
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Port dropdown overlay */}
      {isPortDropdownOpen && (
        <div
          className="z-iframe-overlay w-full h-full absolute"
          onClick={() => setIsPortDropdownOpen(false)}
        />
      )}

      {/* Preview Chrome - stripped-fe UI */}
      <div className="bg-eitherway-elements-background-depth-2 p-2 flex items-center gap-1.5">
        {/* Reload button */}
        <IconButton icon="i-ph:arrow-clockwise" onClick={reloadPreview} />

        {/* Address bar */}
        <div className="flex items-center gap-1 flex-grow bg-eitherway-elements-preview-addressBar-background border border-eitherway-elements-borderColor text-eitherway-elements-preview-addressBar-text rounded-full px-3 py-1 text-sm hover:bg-eitherway-elements-preview-addressBar-backgroundHover hover:focus-within:bg-eitherway-elements-preview-addressBar-backgroundActive focus-within:bg-eitherway-elements-preview-addressBar-backgroundActive focus-within-border-eitherway-elements-borderColorActive focus-within:text-eitherway-elements-preview-addressBar-textActive">
          <input
            className="w-full bg-transparent outline-none"
            type="text"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && validateUrl(url)) {
                setPreviewUrl(url);
              }
            }}
          />
        </div>

        {/* Port dropdown - only if multiple previews */}
        {previews.length > 1 && (
          <PortDropdown
            activePreviewIndex={activePreviewIndex}
            setActivePreviewIndex={setActivePreviewIndex}
            isDropdownOpen={isPortDropdownOpen}
            setHasSelectedPreview={(value) => (hasSelectedPreview.current = value)}
            setIsDropdownOpen={setIsPortDropdownOpen}
            previews={previews}
          />
        )}
      </div>

      {/* PreviewPaneCore - stable deployed internals */}
      <div ref={coreRef} className="flex-1 border-t border-eitherway-elements-borderColor">
        <PreviewPaneCore
          files={files}
          sessionId={sessionId}
          onUrlChange={handleUrlChange}
        />
      </div>
    </div>
  );
});

PreviewEnhanced.displayName = 'PreviewEnhanced';
