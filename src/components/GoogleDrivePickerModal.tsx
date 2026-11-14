import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Search,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileImage,
  FileVideo,
  FileArchive,
  File as FileIcon,
  Check,
  AlertCircle,
  HardDrive,
  Link2,
  Paperclip,
  LayoutList,
  LayoutGrid,
  Star,
  ExternalLink
} from 'lucide-react';
import { GoogleDriveIcon } from './CloudIcons';
import {
  DriveFileItem,
  listGoogleDriveFiles,
  downloadDriveFile
} from '../services/googleDrive';

type CategoryFilter = 'all' | 'docs' | 'pdf' | 'media' | 'starred';
type ViewMode = 'list' | 'grid';
type AttachMode = 'link' | 'file';

export interface PickedDriveLink {
  id: string;
  name: string;
  url: string;
  mimeType: string;
}

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onFilesSelected: (files: File[]) => void;
  onLinksSelected?: (links: PickedDriveLink[]) => void;
  onRequestConnect: (forceAccountSelect?: boolean) => void;
  onUseNativePicker?: () => void;
}

const getFileCategoryLabel = (mimeType: string, ext?: string): string => {
  if (mimeType === 'application/vnd.google-apps.document') return 'Google Doc';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'Google Sheet';
  if (mimeType === 'application/vnd.google-apps.presentation') return 'Google Slides';
  if (mimeType === 'application/vnd.google-apps.drawing') return 'Google Drawing';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.startsWith('image/')) return ext ? ext.toUpperCase() : 'Image';
  if (mimeType.startsWith('video/')) return ext ? ext.toUpperCase() : 'Video';
  if (mimeType.startsWith('audio/')) return ext ? ext.toUpperCase() : 'Audio';
  if (mimeType.includes('wordprocessingml')) return 'DOCX';
  if (mimeType.includes('spreadsheetml')) return 'XLSX';
  if (mimeType.includes('presentationml')) return 'PPTX';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'Archive';
  if (ext) return ext.toUpperCase();
  return 'File';
};

const renderFileTypeIcon = (mimeType: string, className = 'w-4 h-4') => {
  if (mimeType === 'application/vnd.google-apps.spreadsheet' || mimeType.includes('spreadsheet')) {
    return <FileSpreadsheet className={`${className} text-emerald-700`} />;
  }
  if (mimeType === 'application/vnd.google-apps.presentation' || mimeType.includes('presentation')) {
    return <Presentation className={`${className} text-amber-700`} />;
  }
  if (mimeType.startsWith('image/')) {
    return <FileImage className={`${className} text-neutral-700`} />;
  }
  if (mimeType.startsWith('video/')) {
    return <FileVideo className={`${className} text-neutral-700`} />;
  }
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('tar')) {
    return <FileArchive className={`${className} text-neutral-700`} />;
  }
  if (
    mimeType === 'application/vnd.google-apps.document' ||
    mimeType === 'application/pdf' ||
    mimeType.includes('word') ||
    mimeType.startsWith('text/')
  ) {
    return <FileText className={`${className} text-neutral-800`} />;
  }
  return <FileIcon className={`${className} text-neutral-600`} />;
};

const formatFileSize = (bytes?: string, mimeType?: string): string => {
  if (!bytes) {
    return mimeType?.startsWith('application/vnd.google-apps.') ? 'Cloud Doc' : '—';
  }
  const num = parseInt(bytes, 10);
  if (isNaN(num) || num <= 0) return '—';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
};

const formatBytesTotal = (total: number): string => {
  if (total <= 0) return '';
  if (total < 1024) return `${total} B`;
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '';
  }
};

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  token,
  onFilesSelected,
  onLinksSelected,
  onRequestConnect,
  onUseNativePicker
}) => {
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [attachMode, setAttachMode] = useState<AttachMode>('link');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<string>('');
  const [brokenThumbs, setBrokenThumbs] = useState<Set<string>>(new Set());

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
      setError(null);
      setBrokenThumbs(new Set());
      loadFiles('');
    }
  }, [isOpen, token]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !importing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, importing, onClose]);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      if (category === 'docs') {
        return (
          file.mimeType.startsWith('application/vnd.google-apps.') ||
          file.mimeType.includes('word') ||
          file.mimeType.includes('spreadsheet') ||
          file.mimeType.includes('presentation') ||
          file.mimeType.startsWith('text/')
        );
      }
      if (category === 'pdf') {
        return file.mimeType === 'application/pdf';
      }
      if (category === 'media') {
        return (
          file.mimeType.startsWith('image/') ||
          file.mimeType.startsWith('video/') ||
          file.mimeType.startsWith('audio/')
        );
      }
      if (category === 'starred') {
        return Boolean(file.starred);
      }
      return true;
    });
  }, [files, category]);

  const selectedItems = useMemo(
    () => files.filter((f) => selectedIds.has(f.id)),
    [files, selectedIds]
  );

  const selectedTotalBytes = useMemo(
    () =>
      selectedItems.reduce((acc, f) => {
        const parsed = f.size ? parseInt(f.size, 10) : 0;
        return acc + (isNaN(parsed) ? 0 : parsed);
      }, 0),
    [selectedItems]
  );

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

  const handleConfirmSelection = async () => {
    if (!token || selectedItems.length === 0) return;

    if (attachMode === 'link' && onLinksSelected) {
      const links: PickedDriveLink[] = selectedItems.map((item) => ({
        id: item.id,
        name: item.name,
        url: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`,
        mimeType: item.mimeType
      }));
      onLinksSelected(links);
      onClose();
      return;
    }

    setImporting(true);
    setError(null);
    const downloadedFiles: File[] = [];

    try {
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        setImportProgress(`Fetching ${i + 1} of ${selectedItems.length} · ${item.name}`);
        const file = await downloadDriveFile(token, item);
        downloadedFiles.push(file);
      }
      onFilesSelected(downloadedFiles);
      onClose();
    } catch (err: any) {
      console.error('Import failed:', err);
      setError(err.message || 'Failed to export selected file(s) from Google Drive.');
    } finally {
      setImporting(false);
      setImportProgress('');
    }
  };

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'All Files' },
    { id: 'docs', label: 'Docs & Sheets' },
    { id: 'pdf', label: 'PDFs' },
    { id: 'media', label: 'Media' },
    { id: 'starred', label: 'Starred' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={() => !importing && onClose()}
          className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-[#141414]/45 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drive-picker-title"
            className="bg-[#F4F3F0] border-2 border-[#141414] w-full max-w-3xl rounded-sm shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] flex flex-col max-h-[88vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-[#141414]/15 bg-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-sm bg-[#F4F3F0] border border-[#141414]/15 flex items-center justify-center shrink-0">
                  <GoogleDriveIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="drive-picker-title"
                    className="text-xl sm:text-2xl font-serif italic font-bold tracking-tight text-[#141414] leading-tight truncate"
                  >
                    Google Drive
                  </h2>
                  <p className="text-xs text-neutral-600 truncate">
                    Select documents or media to share via Sendarro
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {token && (
                  <>
                    <div
                      className="hidden sm:flex items-center p-0.5 bg-[#F4F3F0] border border-[#141414]/15 rounded-sm"
                      role="group"
                      aria-label="View layout"
                    >
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                          viewMode === 'list'
                            ? 'bg-white text-[#141414] shadow-2xs'
                            : 'text-neutral-500 hover:text-[#141414]'
                        }`}
                        title="List view"
                        aria-label="List view"
                      >
                        <LayoutList className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
                          viewMode === 'grid'
                            ? 'bg-white text-[#141414] shadow-2xs'
                            : 'text-neutral-500 hover:text-[#141414]'
                        }`}
                        title="Grid view"
                        aria-label="Grid view"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRequestConnect(true)}
                      disabled={importing}
                      className="hidden sm:inline-flex items-center px-2.5 min-h-[36px] text-xs font-medium text-neutral-600 hover:text-[#141414] hover:bg-[#F4F3F0] rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      title="Switch Google account"
                    >
                      Switch account
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  disabled={importing}
                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center hover:bg-[#141414]/5 rounded-sm transition-colors text-[#141414] cursor-pointer disabled:opacity-40"
                  title="Close"
                  aria-label="Close Google Drive picker"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search & Category Filter Toolbar */}
            {token && (
              <div className="px-4 sm:px-6 py-3 border-b border-[#141414]/10 bg-[#F4F3F0] space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by file name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') loadFiles(searchQuery);
                      }}
                      className="w-full min-h-[40px] pl-9 pr-9 py-2 bg-white border border-[#141414]/25 focus:border-[#141414] rounded-sm text-sm placeholder:text-neutral-400 focus:outline-none transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          loadFiles('');
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-[#141414] cursor-pointer"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => loadFiles(searchQuery)}
                    disabled={loading || importing}
                    className="min-h-[40px] px-3.5 border border-[#141414]/25 bg-white hover:border-[#141414] rounded-sm transition-colors flex items-center gap-2 text-xs font-medium text-[#141414] whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    title="Refresh file list"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>

                {/* Category Segmented Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                  {categories.map((cat) => {
                    const isActive = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`px-3 py-1.5 min-h-[32px] text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-[#141414] text-white'
                            : 'bg-white/70 text-neutral-600 hover:text-[#141414] hover:bg-white border border-[#141414]/10'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Content Body */}
            <div className="flex-1 overflow-y-auto bg-white custom-scrollbar min-h-[280px]">
              {!token ? (
                <div className="px-6 py-14 text-center max-w-md mx-auto space-y-5">
                  <div className="w-14 h-14 mx-auto rounded-sm bg-[#F4F3F0] border border-[#141414]/15 flex items-center justify-center">
                    <GoogleDriveIcon className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-serif italic font-bold text-[#141414]">
                      Access your Google Drive
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      Authorize read-only access to browse your recent documents, PDFs, and media. Only items you pick are shared.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onRequestConnect(false)}
                      className="w-full sm:w-auto min-h-[44px] bg-[#141414] text-white px-6 py-2.5 rounded-sm font-medium text-xs tracking-wide hover:bg-neutral-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Continue with Google Drive
                    </button>
                    {onUseNativePicker && (
                      <button
                        type="button"
                        onClick={onUseNativePicker}
                        className="w-full sm:w-auto min-h-[44px] border border-[#141414]/25 text-[#141414] px-4 py-2.5 rounded-sm font-medium text-xs hover:border-[#141414] transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Native Picker</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : loading ? (
                <div className="divide-y divide-[#141414]/10">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="px-4 sm:px-6 py-3.5 flex items-center gap-3.5 animate-pulse">
                      <div className="w-4 h-4 rounded-xs bg-[#141414]/10 shrink-0" />
                      <div className="w-8 h-8 rounded-sm bg-[#141414]/10 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-[#141414]/10 rounded-xs w-2/3" />
                        <div className="h-2.5 bg-[#141414]/5 rounded-xs w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-6">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-red-900 text-xs flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2.5">
                      <div>
                        <p className="font-semibold text-sm">Unable to access Google Drive</p>
                        <p className="text-red-700 mt-0.5 leading-relaxed">{error}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onRequestConnect(false)}
                          className="px-3.5 py-2 bg-[#141414] text-white text-xs font-medium rounded-sm hover:bg-neutral-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Reconnect Drive
                        </button>
                        {onUseNativePicker && (
                          <button
                            type="button"
                            onClick={onUseNativePicker}
                            className="px-3.5 py-2 bg-white border border-red-300 text-red-900 text-xs font-medium rounded-sm hover:bg-red-100/50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Try Native Google Picker
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="px-6 py-16 text-center space-y-3">
                  <HardDrive className="w-8 h-8 mx-auto text-neutral-300" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[#141414]">
                      {searchQuery || category !== 'all'
                        ? 'No matching files found'
                        : 'Your Google Drive has no files'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {searchQuery || category !== 'all'
                        ? 'Try another search query or reset your active filters.'
                        : 'Upload a file to Google Drive and click refresh.'}
                    </p>
                  </div>
                  {(searchQuery || category !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setCategory('all');
                        loadFiles('');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-[#141414]/25 text-xs font-medium text-[#141414] rounded-sm hover:border-[#141414] transition-colors cursor-pointer"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : viewMode === 'list' ? (
                <div className="divide-y divide-[#141414]/10">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedIds.has(file.id);
                    const typeLabel = getFileCategoryLabel(file.mimeType, file.fileExtension);
                    const sizeLabel = formatFileSize(file.size, file.mimeType);
                    const dateLabel = formatDate(file.modifiedTime);

                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => !importing && toggleSelect(file.id)}
                        className={`w-full text-left px-4 sm:px-6 py-3 flex items-center gap-3.5 transition-colors cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#141414] ${
                          isSelected
                            ? 'bg-emerald-50/70'
                            : 'hover:bg-[#F7F6F3]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#141414] border-[#141414] text-emerald-400'
                              : 'border-[#141414]/30 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="w-8 h-8 rounded-sm bg-[#F4F3F0] border border-[#141414]/10 flex items-center justify-center shrink-0">
                          {renderFileTypeIcon(file.mimeType, 'w-4 h-4')}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-[#141414] truncate">
                              {file.name}
                            </span>
                            {file.starred && (
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs font-mono tabular-nums text-neutral-500 truncate">
                            <span>{typeLabel}</span>
                            <span aria-hidden="true">·</span>
                            <span>{sizeLabel}</span>
                            {dateLabel && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{dateLabel}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredFiles.map((file) => {
                    const isSelected = selectedIds.has(file.id);
                    const typeLabel = getFileCategoryLabel(file.mimeType, file.fileExtension);
                    const sizeLabel = formatFileSize(file.size, file.mimeType);
                    const showThumb = Boolean(file.thumbnailLink && !brokenThumbs.has(file.id));

                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => !importing && toggleSelect(file.id)}
                        className={`text-left border rounded-sm overflow-hidden transition-colors cursor-pointer select-none flex flex-col focus-visible:outline-2 focus-visible:outline-[#141414] ${
                          isSelected
                            ? 'border-[#141414] bg-emerald-50/50 ring-1 ring-[#141414]'
                            : 'border-[#141414]/15 bg-white hover:border-[#141414]/45'
                        }`}
                      >
                        <div className="h-24 w-full bg-[#F4F3F0] border-b border-[#141414]/10 relative flex items-center justify-center overflow-hidden">
                          {showThumb ? (
                            <img
                              src={file.thumbnailLink}
                              alt={file.name}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setBrokenThumbs((prev) => new Set(prev).add(file.id))
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            renderFileTypeIcon(file.mimeType, 'w-7 h-7')
                          )}
                          <div
                            className={`absolute top-2 right-2 w-5 h-5 rounded-xs border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-[#141414] border-[#141414] text-emerald-400'
                                : 'border-[#141414]/25 bg-white/90'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                        <div className="p-3 min-w-0 space-y-1">
                          <p className="text-xs font-medium text-[#141414] truncate">
                            {file.name}
                          </p>
                          <p className="text-[11px] font-mono tabular-nums text-neutral-500 truncate">
                            {typeLabel} · {sizeLabel}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {token && (
              <div className="px-4 sm:px-6 py-3.5 border-t border-[#141414]/15 bg-[#F4F3F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Attach Mode Segmented Switch + Selection Summary */}
                <div className="flex flex-wrap items-center justify-between sm:justify-start gap-3">
                  {onLinksSelected && (
                    <div
                      className="inline-flex items-center p-0.5 bg-white border border-[#141414]/20 rounded-sm"
                      role="group"
                      aria-label="Attachment format"
                    >
                      <button
                        type="button"
                        onClick={() => setAttachMode('link')}
                        disabled={importing}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                          attachMode === 'link'
                            ? 'bg-[#141414] text-white'
                            : 'text-neutral-600 hover:text-[#141414]'
                        }`}
                        title="Share Google Drive link directly (recommended for Docs & DOCX)"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Drive Link</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachMode('file')}
                        disabled={importing}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                          attachMode === 'file'
                            ? 'bg-[#141414] text-white'
                            : 'text-neutral-600 hover:text-[#141414]'
                        }`}
                        title="Download and attach file copy to clip"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>File Copy</span>
                      </button>
                    </div>
                  )}

                  <div className="text-xs font-mono tabular-nums text-neutral-600">
                    {importing ? (
                      <span className="text-[#141414] font-medium flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        <span className="truncate max-w-[220px]">{importProgress}</span>
                      </span>
                    ) : (
                      <span>
                        {selectedIds.size} selected
                        {selectedTotalBytes > 0 ? ` · ${formatBytesTotal(selectedTotalBytes)}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={importing}
                    className="flex-1 sm:flex-none min-h-[40px] px-4 py-2 bg-white border border-[#141414]/25 hover:border-[#141414] text-xs font-medium text-[#141414] rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSelection}
                    disabled={selectedIds.size === 0 || importing}
                    className="flex-1 sm:flex-none min-h-[40px] bg-[#141414] text-white px-5 py-2 text-xs font-medium rounded-sm hover:bg-neutral-800 disabled:opacity-35 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {attachMode === 'link' ? (
                      <>
                        <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          Attach {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}
                          {selectedIds.size === 1 ? 'Link' : 'Links'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          Attach {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}
                          {selectedIds.size === 1 ? 'File' : 'Files'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
