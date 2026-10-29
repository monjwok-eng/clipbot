import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  RefreshCw, 
  FileText, 
  Check, 
  AlertCircle, 
  HardDrive,
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { GoogleDriveIcon } from './CloudIcons';
import { 
  DriveFileItem, 
  listGoogleDriveFiles, 
  downloadDriveFile 
} from '../services/googleDrive';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onFilesSelected: (files: File[]) => void;
  onRequestConnect: () => void;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  token,
  onFilesSelected,
  onRequestConnect
}) => {
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<string>('');

  const loadFiles = async (queryText = searchQuery) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const items = await listGoogleDriveFiles(token, queryText);
      setFiles(items);
    } catch (err: any) {
      console.error('Error fetching Drive files:', err);
      setError(err.message || 'Failed to load Google Drive files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      setSelectedIds(new Set());
      loadFiles('');
    }
  }, [isOpen, token]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleImport = async () => {
    if (!token || selectedIds.size === 0) return;
    setImporting(true);
    setError(null);

    const itemsToImport = files.filter((f) => selectedIds.has(f.id));
    const downloadedFiles: File[] = [];

    try {
      for (let i = 0; i < itemsToImport.length; i++) {
        const item = itemsToImport[i];
        setImportProgress(`Importing ${i + 1} of ${itemsToImport.length}: ${item.name}...`);
        const file = await downloadDriveFile(token, item);
        downloadedFiles.push(file);
      }
      onFilesSelected(downloadedFiles);
      onClose();
    } catch (err: any) {
      console.error('Import failed:', err);
      setError(err.message || 'Failed to download selected file(s) from Google Drive.');
    } finally {
      setImporting(false);
      setImportProgress('');
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return 'Google Doc';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#141414]/50 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.96, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 15 }}
          className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-2xl rounded-sm shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] flex flex-col max-h-[85vh] overflow-hidden relative"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#141414] flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-[#141414]/20 flex items-center justify-center shadow-xs">
                <GoogleDriveIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold uppercase tracking-widest text-[#141414]">
                  Google Drive Files
                </h2>
                <p className="text-[10px] font-mono opacity-50">
                  Select files to attach directly to your clip
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={importing}
              className="p-1.5 hover:bg-[#141414]/5 rounded-sm transition-colors text-[#141414]"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar & Refresh */}
          {token && (
            <div className="p-3 sm:px-5 border-b border-[#141414]/10 bg-[#E4E3E0]/70 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="text"
                  placeholder="Search Drive files..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadFiles(searchQuery);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#141414] rounded-sm text-xs font-mono focus:outline-none shadow-xs"
                />
              </div>
              <button
                onClick={() => loadFiles(searchQuery)}
                disabled={loading || importing}
                className="p-2 border border-[#141414] bg-white hover:bg-black hover:text-white rounded-sm transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar min-h-[260px]">
            {!token ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-white border border-[#141414]/20 flex items-center justify-center shadow-sm">
                  <GoogleDriveIcon className="w-9 h-9" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider">Connect Google Drive</h3>
                  <p className="text-xs opacity-60 max-w-sm mx-auto font-light">
                    Sign in to authorize ClipCloud to read files you choose from your Google Drive.
                  </p>
                </div>
                <button
                  onClick={onRequestConnect}
                  className="bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-sm font-bold uppercase tracking-[0.2em] text-xs hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  Connect Account
                </button>
              </div>
            ) : loading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto opacity-40 text-[#141414]" />
                <p className="text-xs font-mono uppercase tracking-widest opacity-50">
                  Loading Drive files...
                </p>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-100 border border-red-300 rounded-sm text-red-800 text-xs flex items-start gap-3 my-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Error accessing Google Drive</p>
                  <p className="opacity-80 mt-0.5">{error}</p>
                  <button
                    onClick={onRequestConnect}
                    className="mt-2 text-xs font-bold uppercase underline tracking-wider"
                  >
                    Reconnect Google Drive
                  </button>
                </div>
              </div>
            ) : files.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <HardDrive className="w-8 h-8 mx-auto opacity-20" />
                <p className="text-xs font-mono uppercase tracking-widest opacity-40">
                  No files found in Google Drive
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {files.map((file) => {
                  const isSelected = selectedIds.has(file.id);
                  return (
                    <div
                      key={file.id}
                      onClick={() => !importing && toggleSelect(file.id)}
                      className={`p-3 border rounded-sm cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isSelected
                          ? 'bg-blue-50/80 border-blue-600 shadow-xs'
                          : 'bg-white border-[#141414]/20 hover:border-[#141414]/50 hover:bg-[#141414]/5'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-xs border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-[#141414]/30 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 opacity-40 shrink-0" />
                          <span className="text-xs font-bold text-[#141414] truncate">
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[9px] font-mono opacity-50">
                          <span>{formatFileSize(file.size)}</span>
                          {file.modifiedTime && (
                            <>
                              <span>•</span>
                              <span>{new Date(file.modifiedTime).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {token && (
            <div className="p-4 border-t border-[#141414] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs font-mono opacity-60">
                {importing ? (
                  <span className="text-blue-600 font-bold flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {importProgress}
                  </span>
                ) : (
                  <span>
                    {selectedIds.size} file{selectedIds.size === 1 ? '' : 's'} selected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  disabled={importing}
                  className="flex-1 sm:flex-none px-4 py-2 border border-[#141414] text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#141414]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={selectedIds.size === 0 || importing}
                  className="flex-1 sm:flex-none bg-[#141414] text-[#E4E3E0] px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  Attach to Clip
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
