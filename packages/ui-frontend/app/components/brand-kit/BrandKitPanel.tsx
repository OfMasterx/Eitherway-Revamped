import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { authStore } from '~/lib/stores/auth';
import { chatStore } from '~/lib/stores/chat';
import { brandKitStore } from '~/lib/stores/brandKit';
import { useWalletConnection } from '~/lib/web3/hooks';
import { createScopedLogger } from '~/utils/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { CategoryTabs, type AssetCategory } from './CategoryTabs';
import { AssetCard } from './AssetCard';
import { BACKEND_URL } from '~/config/api';

const logger = createScopedLogger('BrandKitPanel');

interface BrandKitPanelProps {
  onClose: () => void;
}

interface BrandAsset {
  id: string;
  assetType: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  processingStatus: string;
  uploadedAt: string;
  storageKey?: string;
  metadata?: {
    kind?: string;
    aspectRatio?: string;
    familyName?: string;
    weight?: number;
    variants?: Array<{
      purpose: string;
      fileName: string;
      storageKey: string;
    }>;
    aiAnalysis?: {
      description?: string;
      recommendations?: {
        bestFor?: string[];
      };
    };
  };
}

interface BrandColor {
  id: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number } | null;
  name: string | null;
  role: string | null;
  prominence: number | null;
  pixelPercentage: number | null;
}

interface BrandKitData {
  id: string;
  name: string;
  assets: BrandAsset[];
  colors: BrandColor[];
}

export function BrandKitPanel({ onClose }: BrandKitPanelProps) {
  const user = useStore(authStore.user);
  const chat = useStore(chatStore);
  const agentWorking = !!chat.currentPhase && chat.currentPhase !== 'completed';
  const { isConnected, address } = useWalletConnection();

  const [isUploading, setIsUploading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brandKitData, setBrandKitData] = useState<BrandKitData | null>(null);
  const [currentBrandKitId, setCurrentBrandKitId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<AssetCategory>('logos');
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [editingColor, setEditingColor] = useState<BrandColor | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [deletingColorId, setDeletingColorId] = useState<string | null>(null);

  const userId = (isConnected && address ? address : user?.email) || null;

  // Load session brand kit
  useEffect(() => {
    const loadSessionBrandKit = async () => {
      const { pendingBrandKitId } = brandKitStore.get();

      if (!pendingBrandKitId) {
        logger.info('No brand kit in current session');
        return;
      }

      try {
        const kitData = await fetchBrandKitData(pendingBrandKitId);
        if (kitData) {
          setCurrentBrandKitId(pendingBrandKitId);
          logger.info('Loaded brand kit from current session:', pendingBrandKitId);
        } else {
          brandKitStore.set({ pendingBrandKitId: null, dirty: false });
        }
      } catch (err: any) {
        logger.error('Error loading session brand kit:', err);
        brandKitStore.set({ pendingBrandKitId: null, dirty: false });
      }
    };

    loadSessionBrandKit();
  }, [chat.sessionId]);

  const fetchBrandKitData = async (brandKitId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/brand-kits/${brandKitId}`);
      if (!response.ok) throw new Error('Failed to fetch brand kit data');

      const data = await response.json();
      if (data.success && data.brandKit) {
        setBrandKitData(data.brandKit);
        return data.brandKit;
      }
      return null;
    } catch (err: any) {
      console.error('Failed to fetch brand kit data:', err);
      return null;
    }
  };

  const handleDeleteAsset = async (assetId: string, fileName: string) => {
    if (!currentBrandKitId || !confirm(`Delete ${fileName}?`)) return;

    try {
      setDeletingAssetId(assetId);
      setGlobalMessage(`Deleting ${fileName}...`);

      const deleteResponse = await fetch(`${BACKEND_URL}/api/brand-kits/${currentBrandKitId}/assets/${assetId}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) throw new Error(`Failed to delete asset`);

      // Re-aggregate colors
      await fetch(`${BACKEND_URL}/api/brand-kits/${currentBrandKitId}/aggregate-colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      await fetchBrandKitData(currentBrandKitId);
      setGlobalMessage(`✓ ${fileName} deleted`);
      window.dispatchEvent(new CustomEvent('brand-kit-updated'));
      setTimeout(() => setGlobalMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete asset');
      setGlobalMessage(null);
    } finally {
      setDeletingAssetId(null);
    }
  };

  const handleFileUpload = async (files: FileList | null, category?: AssetCategory) => {
    if (!files || files.length === 0 || !userId) {
      if (!userId) setError('Please connect your wallet to upload brand assets');
      return;
    }

    setIsUploading(true);
    setError(null);
    const fileArray = Array.from(files);
    setUploadingFiles(fileArray.map(f => f.name));

    try {
      // Get or create brand kit
      let brandKitId = currentBrandKitId;
      if (!brandKitId) {
        setGlobalMessage('Creating brand kit...');
        const createResponse = await fetch('/api/brand-kits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            name: `Brand Kit - ${new Date().toLocaleDateString()}`,
            description: 'Auto-generated brand kit',
          }),
        });

        if (!createResponse.ok) throw new Error('Failed to create brand kit');
        const { brandKit } = await createResponse.json();
        brandKitId = brandKit.id;
        setCurrentBrandKitId(brandKitId);
      }

      setGlobalMessage(`Uploading ${fileArray.length} file(s)...`);

      // Upload files
      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);
        // Pass the intended category to the backend
        formData.append('category', category || activeCategory);

        const uploadResponse = await fetch(`${BACKEND_URL}/api/brand-kits/${brandKitId}/assets`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error(`Failed to upload ${file.name}`);
      }

      // Aggregate colors
      setGlobalMessage('Extracting brand colors...');
      await fetch(`${BACKEND_URL}/api/brand-kits/${brandKitId}/aggregate-colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      await fetchBrandKitData(brandKitId);
      brandKitStore.setKey('pendingBrandKitId', brandKitId);
      brandKitStore.setKey('dirty', true);

      setGlobalMessage(`✓ ${fileArray.length} file(s) uploaded successfully`);
      window.dispatchEvent(new CustomEvent('brand-kit-updated'));
      setTimeout(() => setGlobalMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadingFiles([]);
    }
  };

  // Filter assets by category
  const getFilteredAssets = (): BrandAsset[] => {
    if (!brandKitData) return [];

    return brandKitData.assets.filter((asset) => {
      const kind = asset.metadata?.kind;

      switch (activeCategory) {
        case 'icons':
          return kind === 'icon' || asset.mimeType === 'image/x-icon' || asset.fileName.endsWith('.ico');
        case 'logos':
          return kind === 'logo' || (!kind && asset.mimeType.startsWith('image/') && !asset.fileName.endsWith('.ico'));
        case 'images':
          return kind === 'image';
        case 'fonts':
          return kind === 'font' || asset.mimeType.startsWith('font/') || /\.(ttf|otf|woff|woff2)$/i.test(asset.fileName);
        case 'videos':
          return kind === 'video' || asset.mimeType.startsWith('video/') || asset.fileName.endsWith('.mp4');
        default:
          return false;
      }
    });
  };

  const filteredAssets = getFilteredAssets();

  const handleAddColor = async () => {
    if (!currentBrandKitId) {
      setError('Please create a brand kit first');
      return;
    }

    try {
      setGlobalMessage('Adding color...');
      const response = await fetch(`${BACKEND_URL}/api/brand-kits/${currentBrandKitId}/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorHex: newColorHex }),
      });

      if (!response.ok) throw new Error('Failed to add color');

      await fetchBrandKitData(currentBrandKitId);
      setGlobalMessage('✓ Color added');
      setShowColorPicker(false);
      setNewColorHex('#000000');
      setTimeout(() => setGlobalMessage(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to add color');
      setGlobalMessage(null);
    }
  };

  const handleUpdateColor = async (colorId: string, newHex: string) => {
    if (!currentBrandKitId) return;

    try {
      setGlobalMessage('Updating color...');
      const response = await fetch(`${BACKEND_URL}/api/brand-kits/${currentBrandKitId}/colors/${colorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colorHex: newHex }),
      });

      if (!response.ok) throw new Error('Failed to update color');

      await fetchBrandKitData(currentBrandKitId);
      setGlobalMessage('✓ Color updated');
      setShowColorPicker(false);
      setEditingColor(null);
      setTimeout(() => setGlobalMessage(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update color');
      setGlobalMessage(null);
    }
  };

  const handleDeleteColor = async (colorId: string) => {
    if (!currentBrandKitId || !confirm('Delete this color?')) return;

    try {
      setDeletingColorId(colorId);
      setGlobalMessage('Deleting color...');

      const response = await fetch(`${BACKEND_URL}/api/brand-kits/${currentBrandKitId}/colors/${colorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete color');

      await fetchBrandKitData(currentBrandKitId);
      setGlobalMessage('✓ Color deleted');
      setTimeout(() => setGlobalMessage(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete color');
      setGlobalMessage(null);
    } finally {
      setDeletingColorId(null);
    }
  };

  const openColorPicker = (color?: BrandColor) => {
    if (color) {
      setEditingColor(color);
      setNewColorHex(color.hex);
    } else {
      setEditingColor(null);
      setNewColorHex('#000000');
    }
    setShowColorPicker(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Brand Kit Gallery</h2>
            <p className="text-sm text-gray-400 mt-1">Manage your logos, fonts, images & colors</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-4">
          <CategoryTabs
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            counts={{
              icons: brandKitData?.assets.filter(a =>
                a.metadata?.kind === 'icon' || a.mimeType === 'image/x-icon' || a.fileName.endsWith('.ico')
              ).length || 0,
              logos: brandKitData?.assets.filter(a =>
                a.metadata?.kind === 'logo' || (!a.metadata?.kind && a.mimeType.startsWith('image/') && !a.fileName.endsWith('.ico'))
              ).length || 0,
              images: brandKitData?.assets.filter(a => a.metadata?.kind === 'image').length || 0,
              fonts: brandKitData?.assets.filter(a =>
                a.metadata?.kind === 'font' || a.mimeType.startsWith('font/') || /\.(ttf|otf|woff|woff2)$/i.test(a.fileName)
              ).length || 0,
              videos: brandKitData?.assets.filter(a =>
                a.metadata?.kind === 'video' || a.mimeType.startsWith('video/') || a.fileName.endsWith('.mp4')
              ).length || 0,
            }}
          />
        </div>

        {/* Messages */}
        <div className="px-6 pt-4">
          <AnimatePresence>
            {globalMessage && (
              <motion.div
                key="global-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 mb-2"
              >
                <p className="text-sm text-blue-300">{globalMessage}</p>
              </motion.div>
            )}
            {error && (
              <motion.div
                key="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-2"
              >
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredAssets.length === 0 ? (
            /* Empty State centered horizontally */
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  id="gallery-upload"
                  className="hidden"
                  accept={
                    activeCategory === 'fonts' ? '.ttf,.otf,.woff,.woff2' :
                    activeCategory === 'videos' ? '.mp4,video/mp4' :
                    'image/png,image/jpeg,image/jpg,image/svg+xml,image/x-icon,.ico'
                  }
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files, activeCategory)}
                  disabled={isUploading || agentWorking}
                />
                {/* Add Asset Card (Plus Icon) */}
                <label
                  htmlFor="gallery-upload"
                  className={`relative group bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-600 hover:border-blue-500 transition-all cursor-pointer w-[180px] h-[180px] flex-shrink-0 ${
                    isUploading || agentWorking ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="i-ph:plus text-5xl text-gray-500 group-hover:text-blue-400 transition-colors mb-2" />
                    <p className="text-xs font-medium text-gray-400 group-hover:text-blue-300 transition-colors">
                      {isUploading ? 'Uploading...' : `Add`}
                    </p>
                  </div>
                </label>

                {/* Empty State Text Card */}
                <div className="flex flex-col items-center justify-center text-center w-[180px] h-[180px]">
                  <div className="text-4xl text-gray-600 mb-2">
                    {activeCategory === 'icons' && <div className="i-ph:app-window" />}
                    {activeCategory === 'logos' && <div className="i-ph:image" />}
                    {activeCategory === 'images' && <div className="i-ph:images" />}
                    {activeCategory === 'fonts' && <div className="i-ph:text-aa" />}
                    {activeCategory === 'videos' && <div className="i-ph:video" />}
                  </div>
                  <h3 className="text-base font-semibold text-gray-300 mb-1">
                    No {activeCategory} yet
                  </h3>
                  <p className="text-xs text-gray-500">
                    Click the + button to upload
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Horizontal gallery with + button on the left */
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 auto-rows-[180px]">
              {/* Add Asset Card (Plus Icon) - First in grid */}
              <input
                type="file"
                id="gallery-upload"
                className="hidden"
                accept={
                  activeCategory === 'fonts' ? '.ttf,.otf,.woff,.woff2' :
                  activeCategory === 'videos' ? '.mp4,video/mp4' :
                  'image/png,image/jpeg,image/jpg,image/svg+xml,image/x-icon,.ico'
                }
                multiple
                onChange={(e) => handleFileUpload(e.target.files, activeCategory)}
                disabled={isUploading || agentWorking}
              />
              <label
                htmlFor="gallery-upload"
                className={`relative group bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-600 hover:border-blue-500 transition-all cursor-pointer ${
                  isUploading || agentWorking ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="i-ph:plus text-5xl text-gray-500 group-hover:text-blue-400 transition-colors mb-2" />
                  <p className="text-xs font-medium text-gray-400 group-hover:text-blue-300 transition-colors">
                    {isUploading ? 'Uploading...' : `Add`}
                  </p>
                </div>
              </label>

              {/* Asset Cards */}
              <AnimatePresence mode="popLayout">
                {filteredAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onDelete={() => handleDeleteAsset(asset.id, asset.fileName)}
                    isDeleting={deletingAssetId === asset.id}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Color Management Footer */}
        {brandKitData && (
          <div className="border-t border-gray-700 p-6 bg-gray-800/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-300">Brand Colors</h4>
              <button
                onClick={() => openColorPicker()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
              >
                <div className="i-ph:plus text-sm" />
                Add Color
              </button>
            </div>

            {brandKitData.colors.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {brandKitData.colors.map((color) => (
                  <motion.div
                    key={color.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center flex-shrink-0 relative group"
                  >
                    <button
                      onClick={() => openColorPicker(color)}
                      className="w-16 h-16 rounded-xl border-2 border-gray-600 hover:border-blue-400 transition-all cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
                      style={{ backgroundColor: color.hex }}
                      title={`${color.name || 'Click to edit'} - ${color.hex}`}
                    />
                    <p className="text-xs text-gray-400 mt-1.5 font-mono">{color.hex}</p>
                    {color.name && (
                      <p className="text-xs text-gray-500 truncate max-w-[64px]">{color.name}</p>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteColor(color.id);
                      }}
                      disabled={deletingColorId === color.id}
                      className="absolute -top-1 -right-1 p-1 bg-red-600/90 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      title="Delete color"
                    >
                      {deletingColorId === color.id ? (
                        <div className="i-ph:spinner text-white text-xs animate-spin" />
                      ) : (
                        <div className="i-ph:x text-white text-xs" />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No colors yet. Colors are extracted from uploaded images, or you can add them manually.
              </p>
            )}
          </div>
        )}

        {/* Color Picker Modal */}
        {showColorPicker && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full border-2 border-gray-700"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {editingColor ? 'Edit Color' : 'Add Color'}
              </h3>

              <div className="space-y-4">
                {/* Color Preview */}
                <div className="flex gap-4 items-center">
                  <div
                    className="w-24 h-24 rounded-xl border-2 border-gray-600 shadow-inner"
                    style={{ backgroundColor: newColorHex }}
                  />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Color
                    </label>
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-600 bg-gray-900"
                    />
                  </div>
                </div>

                {/* Hex Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hex Code
                  </label>
                  <input
                    type="text"
                    value={newColorHex}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        setNewColorHex(val);
                      }
                    }}
                    placeholder="#000000"
                    className="w-full px-4 py-2 bg-gray-900 border-2 border-gray-600 rounded-lg text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowColorPicker(false);
                      setEditingColor(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editingColor) {
                        handleUpdateColor(editingColor.id, newColorHex);
                      } else {
                        handleAddColor();
                      }
                    }}
                    disabled={!/^#[0-9A-Fa-f]{6}$/.test(newColorHex)}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    {editingColor ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
