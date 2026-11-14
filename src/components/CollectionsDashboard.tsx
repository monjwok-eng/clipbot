import React, { useMemo, useState, useEffect } from 'react';
import {
  Archive,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  FolderOpen,
  Inbox,
  Link2,
  Lock,
  LogIn,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Zap,
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { GoogleDriveIcon, DropboxIcon } from './CloudIcons';

export interface DashboardClip {
  id: string;
  content?: string;
  createdAt?: Timestamp | null;
  expiresAt?: Timestamp | null;
  authorUid: string | null;
  tier: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  downloadUrl?: string;
  hasFile?: boolean;
  files?: any[];
  isCollection?: boolean;
  submissions?: Array<{
    contributorName?: string;
    submittedAt?: string;
    files?: Array<{
      fileName?: string;
      fileType?: string;
      fileSize?: number;
      downloadUrl?: string;
      url?: string;
    }>;
  }>;
  submissionCount?: number;
  maxSubmissions?: number;
  submissionDeadline?: Timestamp | null;
  burnOnRead?: boolean;
  viewCount?: number;
  totalSize?: number;
  fileCount?: number;
  hasWebhook?: boolean;
}

interface CollectionsDashboardProps {
  user: { uid: string; isAnonymous?: boolean } | null;
  isGuest: boolean;
  isProMax: boolean;
  hasUsedTrialCollection: boolean;
  clips: DashboardClip[];
  loading: boolean;
  reactivatingClips: Record<string, number>;
  isZipping: boolean;
  exportingDriveClipId: string | null;
  getSyncedNow: () => number;
  formatBytes: (bytes: number) => string;
  formatTime: (seconds: number) => string;
  onOpenInbox: (clip: DashboardClip) => void;
  onCopyCode: (code: string) => void;
  onReactivate: (clipId: string) => void;
  onDeleteClip: (clipId: string) => Promise<void> | void;
  onDownloadCollectionZip: (clip: DashboardClip) => void;
  onExportDrive: (clip: DashboardClip) => void;
  onExportDropbox: (clip: DashboardClip) => void;
  onCreateCollection: () => void;
  onUpgrade: () => void;
  onLogin: () => void;
}

function toMillisSafe(value: any): number | null {
  if (!value) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function getCollectionSubmissionStats(clip: DashboardClip) {
  const submissions = Array.isArray(clip.submissions) ? clip.submissions : [];
  const submissionCount = Math.max(submissions.length, clip.submissionCount || 0);
  let totalFiles = 0;
  let totalBytes = 0;
  let latestContributor = '';

  submissions.forEach((sub, idx) => {
    if (idx === submissions.length - 1 && sub.contributorName) {
      latestContributor = sub.contributorName;
    }
    const files = Array.isArray(sub.files) ? sub.files : [];
    totalFiles += files.length;
    files.forEach((f) => {
      totalBytes += f.fileSize || 0;
    });
  });

  return {
    submissions,
    submissionCount,
    totalFiles,
    totalBytes,
    latestContributor,
  };
}

export const CollectionsDashboard: React.FC<CollectionsDashboardProps> = ({
  user,
  isGuest,
  isProMax,
  hasUsedTrialCollection,
  clips,
  loading,
  reactivatingClips,
  isZipping,
  exportingDriveClipId,
  getSyncedNow,
  formatBytes,
  formatTime,
  onOpenInbox,
  onCopyCode,
  onReactivate,
  onDeleteClip,
  onDownloadCollectionZip,
  onExportDrive,
  onExportDropbox,
  onCreateCollection,
  onUpgrade,
  onLogin,
}) => {
  const [sectionTab, setSectionTab] = useState<'collections' | 'vault'>('collections');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => getSyncedNow());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(getSyncedNow());
    }, 15000);
    return () => clearInterval(timer);
  }, [getSyncedNow]);

  const isSignedInRealUser = Boolean(user && !user.isAnonymous && !isGuest);

  // Filter out permanently stale non-recoverable clips (> 7 days past expiry)
  const visibleOwnedClips = useMemo(() => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return clips.filter((clip) => {
      const expireMs = toMillisSafe(clip.expiresAt);
      if (!expireMs) return true;
      const isExpired = expireMs < nowTick;
      const withinVaultWindow = nowTick - expireMs < sevenDaysMs;
      const isReactivating = (reactivatingClips[clip.id] || 0) > 0;
      return !isExpired || withinVaultWindow || isReactivating;
    });
  }, [clips, nowTick, reactivatingClips]);

  const collectionClips = useMemo(
    () => visibleOwnedClips.filter((c) => Boolean(c.isCollection)),
    [visibleOwnedClips]
  );

  const classifyCollection = (clip: DashboardClip) => {
    const expireMs = toMillisSafe(clip.expiresAt) || 0;
    const deadlineMs = toMillisSafe(clip.submissionDeadline);
    const isReactivating = (reactivatingClips[clip.id] || 0) > 0;
    const isLinkExpired = expireMs > 0 && expireMs < nowTick && !isReactivating;
    const isDeadlinePassed = Boolean(deadlineMs && nowTick > deadlineMs);
    const submissionLimit = clip.maxSubmissions || (clip.tier !== 'promax' ? 5 : 0);
    const currentCount = Array.isArray(clip.submissions) ? clip.submissions.length : (clip.submissionCount || 0);
    const isLimitReached = Boolean(submissionLimit > 0 && currentCount >= submissionLimit);
    const isOpen = !isLinkExpired && !isDeadlinePassed && !isLimitReached;
    return {
      expireMs,
      deadlineMs,
      isReactivating,
      isLinkExpired,
      isDeadlinePassed,
      isLimitReached,
      isOpen,
    };
  };

  const collectionMetrics = useMemo(() => {
    let openCount = 0;
    let closedCount = 0;
    let totalSubmissions = 0;

    collectionClips.forEach((clip) => {
      const { isOpen } = classifyCollection(clip);
      if (isOpen) openCount += 1;
      else closedCount += 1;

      const stats = getCollectionSubmissionStats(clip);
      totalSubmissions += stats.submissionCount;
    });

    return {
      total: collectionClips.length,
      openCount,
      closedCount,
      totalSubmissions,
    };
  }, [collectionClips, nowTick, reactivatingClips]);

  const vaultMetrics = useMemo(() => {
    let activeCount = 0;
    let expiredInVaultCount = 0;
    let totalViews = 0;

    visibleOwnedClips.forEach((clip) => {
      const expireMs = toMillisSafe(clip.expiresAt) || 0;
      const isReactivating = (reactivatingClips[clip.id] || 0) > 0;
      const isActive = isReactivating || expireMs === 0 || expireMs >= nowTick;
      if (isActive) activeCount += 1;
      else expiredInVaultCount += 1;
      totalViews += clip.viewCount || 0;
    });

    return {
      total: visibleOwnedClips.length,
      activeCount,
      expiredInVaultCount,
      totalViews,
    };
  }, [visibleOwnedClips, nowTick, reactivatingClips]);

  const filteredClips = useMemo(() => {
    const baseList = sectionTab === 'collections' ? collectionClips : visibleOwnedClips;
    const q = searchQuery.trim().toLowerCase();

    return baseList.filter((clip) => {
      if (statusFilter !== 'all') {
        if (sectionTab === 'collections') {
          const { isOpen } = classifyCollection(clip);
          if (statusFilter === 'open' && !isOpen) return false;
          if (statusFilter === 'closed' && isOpen) return false;
        } else {
          const expireMs = toMillisSafe(clip.expiresAt) || 0;
          const isReactivating = (reactivatingClips[clip.id] || 0) > 0;
          const isActive = isReactivating || expireMs === 0 || expireMs >= nowTick;
          if (statusFilter === 'open' && !isActive) return false;
          if (statusFilter === 'closed' && isActive) return false;
        }
      }

      if (!q) return true;

      const idMatch = clip.id.toLowerCase().includes(q);
      const titleMatch = (clip.content || '').toLowerCase().includes(q);
      const fileMatch = (clip.fileName || '').toLowerCase().includes(q);
      const contribMatch = (clip.submissions || []).some((sub) =>
        (sub.contributorName || '').toLowerCase().includes(q)
      );

      return idMatch || titleMatch || fileMatch || contribMatch;
    });
  }, [sectionTab, collectionClips, visibleOwnedClips, statusFilter, searchQuery, nowTick, reactivatingClips]);

  const handleCopyShareLink = async (clipId: string) => {
    const url = `${window.location.origin}/?code=${clipId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(`link-${clipId}`);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch (err) {
      console.warn('Failed to copy collection link:', err);
    }
  };

  const handleCopyCodeLocal = (clipId: string) => {
    onCopyCode(clipId);
    setCopiedKey(`code-${clipId}`);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleConfirmDelete = async (clipId: string) => {
    setDeletingId(clipId);
    try {
      await onDeleteClip(clipId);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      aria-label="My Collections Dashboard"
      className="bg-white border border-[#141414] rounded-none sm:rounded-md shadow-none sm:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] overflow-hidden"
    >
      {/* Top Header */}
      <div className="p-5 sm:p-6 border-b border-[#141414]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-blue-700">
              Collection Workspace
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif italic font-normal text-[#141414] leading-tight">
            My Collections
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Monitor open drop boxes, track live submissions, and jump straight into any inbox.
          </p>
        </div>

        <div className="shrink-0">
          {!isSignedInRealUser ? (
            <button
              type="button"
              onClick={onLogin}
              className="w-full sm:w-auto bg-[#141414] text-[#E4E3E0] px-4 py-2.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sign In</span>
            </button>
          ) : isProMax || !hasUsedTrialCollection ? (
            <button
              type="button"
              onClick={onCreateCollection}
              className="w-full sm:w-auto bg-[#141414] text-[#E4E3E0] px-4 py-2.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isProMax ? 'New Collection' : 'Try 1 Free Box'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onUpgrade}
              className="w-full sm:w-auto bg-blue-700 text-white px-4 py-2.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Unlock Unlimited</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-[#141414]/15 bg-[#F9F9F8]">
        <button
          type="button"
          onClick={() => {
            setSectionTab('collections');
            setStatusFilter('all');
          }}
          className={`flex-1 py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
            sectionTab === 'collections'
              ? 'bg-white text-[#141414] border-b-2 border-[#141414]'
              : 'text-neutral-500 hover:text-[#141414]'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5 shrink-0" />
          <span>Collections</span>
          <span className="tabular-nums text-[11px] opacity-80">({collectionMetrics.total})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setSectionTab('vault');
            setStatusFilter('all');
          }}
          className={`flex-1 py-3 px-4 text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 whitespace-nowrap border-l border-[#141414]/15 cursor-pointer ${
            sectionTab === 'vault'
              ? 'bg-white text-[#141414] border-b-2 border-[#141414]'
              : 'text-neutral-500 hover:text-[#141414]'
          }`}
        >
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>All Clips & Vault</span>
          <span className="tabular-nums text-[11px] opacity-80">({vaultMetrics.total})</span>
        </button>
      </div>

      {/* Main Content */}
      {!isSignedInRealUser ? (
        <div className="p-8 sm:p-10 text-center space-y-4">
          <div className="w-11 h-11 mx-auto border border-[#141414]/20 bg-[#F9F9F8] rounded-sm flex items-center justify-center">
            <Lock className="w-5 h-5 text-neutral-700" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h3 className="text-base font-serif italic text-[#141414]">Sign in to manage your workspace</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Signed-in accounts sync every Collection Box and shared clip automatically so you can open inboxes without memorizing codes.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogin}
            className="bg-[#141414] text-[#E4E3E0] px-5 py-2.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sign in with Google</span>
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#141414]/15">
          {/* Summary Strip */}
          {sectionTab === 'collections' ? (
            <div className="grid grid-cols-3 divide-x divide-[#141414]/15 bg-[#F9F9F8]">
              <div className="p-3.5 sm:p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                  Open Boxes
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-emerald-700 mt-0.5">
                  {collectionMetrics.openCount}
                </div>
              </div>
              <div className="p-3.5 sm:p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                  Submissions
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-[#141414] mt-0.5">
                  {collectionMetrics.totalSubmissions}
                </div>
              </div>
              <div className="p-3.5 sm:p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                  Closed / Vault
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-neutral-700 mt-0.5">
                  {collectionMetrics.closedCount}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 divide-x divide-[#141414]/15 bg-[#F9F9F8]">
              <div className="p-3.5 sm:p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                  Active Clips
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-emerald-700 mt-0.5">
                  {vaultMetrics.activeCount}
                </div>
              </div>
              <div className="p-3.5 sm:p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                  7-Day Vault
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-[#141414] mt-0.5">
                  {vaultMetrics.expiredInVaultCount}
                </div>
              </div>
              <div className="p-3.5 sm:p-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                  Total Views
                </div>
                <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums text-neutral-700 mt-0.5">
                  {vaultMetrics.totalViews}
                </div>
              </div>
            </div>
          )}

          {/* Search & Status Filter Toolbar */}
          <div className="p-3.5 sm:p-4 bg-white flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  sectionTab === 'collections'
                    ? 'Search title, code, or contributor...'
                    : 'Search clips by code, title, or file...'
                }
                className="w-full pl-8 pr-3 py-2 border border-[#141414]/25 rounded-sm font-mono text-xs bg-white placeholder:text-neutral-400 focus:outline-none focus:border-[#141414]"
              />
            </div>
            <div className="flex border border-[#141414]/25 rounded-sm overflow-hidden shrink-0">
              {(['all', 'open', 'closed'] as const).map((status, idx) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    idx > 0 ? 'border-l border-[#141414]/25' : ''
                  } ${
                    statusFilter === status
                      ? 'bg-[#141414] text-[#E4E3E0]'
                      : 'bg-white text-neutral-600 hover:bg-[#F9F9F8] hover:text-[#141414]'
                  }`}
                >
                  {status === 'all'
                    ? 'All'
                    : status === 'open'
                    ? sectionTab === 'collections'
                      ? 'Open'
                      : 'Active'
                    : sectionTab === 'collections'
                    ? 'Closed'
                    : 'Expired'}
                </button>
              ))}
            </div>
          </div>

          {/* List Area */}
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-neutral-400" />
              <p className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                Syncing workspace...
              </p>
            </div>
          ) : filteredClips.length === 0 ? (
            <div className="p-8 sm:p-10 text-center space-y-4">
              {searchQuery || statusFilter !== 'all' ? (
                <>
                  <Search className="w-7 h-7 mx-auto text-neutral-400" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[#141414] uppercase tracking-wider font-mono">
                      No matching {sectionTab === 'collections' ? 'collections' : 'clips'}
                    </h3>
                    <p className="text-xs text-neutral-600">
                      Try clearing your search or switching the status filter.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="border border-[#141414] px-4 py-2 rounded-sm text-xs font-mono font-bold uppercase tracking-wider text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </>
              ) : sectionTab === 'collections' ? (
                isProMax || !hasUsedTrialCollection ? (
                  <>
                    <Inbox className="w-8 h-8 mx-auto text-blue-700" />
                    <div className="space-y-1 max-w-sm mx-auto">
                      <h3 className="text-base font-serif italic text-[#141414]">
                        {isProMax ? 'No collection boxes yet' : 'Try 1 Free Collection Box'}
                      </h3>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {isProMax
                          ? 'Create a Collection Box to collect assignments, client deliverables, or event media under one shareable link with an optional deadline.'
                          : 'Share one link and collect up to 5 file submissions into a single inbox — contributors never need an account.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={onCreateCollection}
                        className="bg-[#141414] text-[#E4E3E0] px-5 py-2.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{isProMax ? 'Create Collection Box' : 'Start Free Trial Box'}</span>
                      </button>
                      {!isProMax && vaultMetrics.total > 0 && (
                        <button
                          type="button"
                          onClick={() => setSectionTab('vault')}
                          className="border border-[#141414] px-4 py-2.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs text-[#141414] hover:bg-[#F9F9F8] transition-colors whitespace-nowrap cursor-pointer"
                        >
                          View All Clips ({vaultMetrics.total})
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Zap className="w-8 h-8 mx-auto text-blue-700" />
                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <h3 className="text-base font-serif italic text-[#141414]">
                        1/1 Free Trial Collection Used
                      </h3>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        Upgrade to Pro Max for unlimited Collection Boxes, unlimited submissions, auto-closing deadlines, 2 GB uploads, and ZIP/Drive/Dropbox exports.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={onUpgrade}
                        className="bg-blue-700 text-white px-5 py-2.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs hover:bg-blue-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Upgrade to Pro Max</span>
                      </button>
                      {vaultMetrics.total > 0 && (
                        <button
                          type="button"
                          onClick={() => setSectionTab('vault')}
                          className="border border-[#141414] px-4 py-2.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs text-[#141414] hover:bg-[#F9F9F8] transition-colors whitespace-nowrap cursor-pointer"
                        >
                          View All Clips ({vaultMetrics.total})
                        </button>
                      )}
                    </div>
                  </>
                )
              ) : (
                <>
                  <Shield className="w-8 h-8 mx-auto text-neutral-400" />
                  <div className="space-y-1 max-w-xs mx-auto">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#141414]">
                      Your vault is empty
                    </h3>
                    <p className="text-xs text-neutral-600">
                      Clips and files you share appear here automatically for quick retrieval and 7-day Pro Max recovery.
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#141414]/15 max-h-[560px] overflow-y-auto custom-scrollbar">
              {filteredClips.map((clip) => {
                const {
                  expireMs,
                  deadlineMs,
                  isReactivating,
                  isLinkExpired,
                  isDeadlinePassed,
                  isLimitReached,
                } = classifyCollection(clip);

                const isCollection = Boolean(clip.isCollection);
                const stats = isCollection ? getCollectionSubmissionStats(clip) : null;
                const submissionLimit = isCollection ? (clip.maxSubmissions || (clip.tier !== 'promax' ? 5 : 0)) : 0;
                const reactivateLeft = reactivatingClips[clip.id] || 0;

                const remainingSeconds =
                  reactivateLeft > 0
                    ? reactivateLeft
                    : expireMs > nowTick
                    ? Math.max(0, Math.floor((expireMs - nowTick) / 1000))
                    : 0;

                const regularFileCount = clip.files?.length || (clip.hasFile ? 1 : 0);
                const regularTotalSize =
                  clip.totalSize ||
                  (clip.files?.length
                    ? clip.files.reduce((sum, f) => sum + (f.fileSize || 0), 0)
                    : clip.fileSize || 0);

                let statusLabel = 'Active';
                let statusTone = 'text-emerald-800 bg-emerald-50 border-emerald-300';
                if (isCollection) {
                  if (isDeadlinePassed) {
                    statusLabel = 'Closed';
                    statusTone = 'text-amber-800 bg-amber-50 border-amber-300';
                  } else if (isLimitReached) {
                    statusLabel = 'Full';
                    statusTone = 'text-amber-800 bg-amber-50 border-amber-300';
                  } else if (isLinkExpired) {
                    statusLabel = 'Expired';
                    statusTone = 'text-neutral-700 bg-neutral-100 border-neutral-300';
                  } else {
                    statusLabel = 'Open';
                    statusTone = 'text-emerald-800 bg-emerald-50 border-emerald-300';
                  }
                } else if (isLinkExpired) {
                  statusLabel = 'Expired';
                  statusTone = 'text-neutral-700 bg-neutral-100 border-neutral-300';
                }

                const expiredHoursAgo =
                  expireMs > 0 && expireMs < nowTick
                    ? Math.max(1, Math.floor((nowTick - expireMs) / (1000 * 60 * 60)))
                    : 0;

                const canReactivate = isLinkExpired && isProMax && !isReactivating;

                return (
                  <article
                    key={clip.id}
                    className="p-4 sm:p-5 bg-white hover:bg-[#F9F9F8] transition-colors space-y-3"
                  >
                    {/* Top Row: Code + Status + Timing */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-xs font-bold font-mono bg-[#141414] text-[#E4E3E0] px-2 py-0.5 rounded-none tracking-wider">
                          {clip.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[10px] font-mono font-bold uppercase tracking-wider rounded-none ${statusTone}`}
                        >
                          {statusLabel === 'Open' || statusLabel === 'Active' ? (
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                          ) : statusLabel === 'Closed' ? (
                            <Calendar className="w-3 h-3 shrink-0" />
                          ) : (
                            <Lock className="w-3 h-3 shrink-0" />
                          )}
                          <span>{statusLabel}</span>
                        </span>
                        {sectionTab === 'vault' && isCollection && (
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded-none">
                            Collection
                          </span>
                        )}
                        {clip.burnOnRead && (
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 border border-red-200 bg-red-50 px-1.5 py-0.5 rounded-none">
                            Burn
                          </span>
                        )}
                        {isCollection && clip.hasWebhook && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded-none">
                            <Bell className="w-2.5 h-2.5 shrink-0" />
                            <span>Alerts</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-mono text-neutral-500 tabular-nums flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3 h-3 shrink-0" />
                        {reactivateLeft > 0 ? (
                          <span className="text-blue-700 font-semibold">
                            Reactivated · {formatTime(reactivateLeft)}
                          </span>
                        ) : isCollection && deadlineMs ? (
                          <span>
                            {isDeadlinePassed ? 'Closed ' : 'Closes '}
                            {new Date(deadlineMs).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        ) : remainingSeconds > 0 ? (
                          <span>Expires in {formatTime(remainingSeconds)}</span>
                        ) : (
                          <span>Expired {expiredHoursAgo}h ago</span>
                        )}
                      </div>
                    </div>

                    {/* Title & Metadata Line */}
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#141414] truncate">
                        {isCollection
                          ? clip.content?.trim() || 'Untitled Collection Box'
                          : clip.content?.trim() || (clip.hasFile ? clip.fileName : 'Untitled Clip')}
                      </h3>

                      {isCollection && stats ? (
                        <div className="text-xs font-mono text-neutral-600 tabular-nums flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className={stats.submissionCount > 0 ? 'text-[#141414] font-semibold' : ''}>
                            {stats.submissionCount}
                            {submissionLimit > 0 ? ` / ${submissionLimit}` : ''}{' '}
                            {stats.submissionCount === 1 && !submissionLimit ? 'submission' : 'submissions'}
                          </span>
                          <span>·</span>
                          <span>
                            {stats.totalFiles} {stats.totalFiles === 1 ? 'file' : 'files'}
                          </span>
                          {stats.totalBytes > 0 && (
                            <>
                              <span>·</span>
                              <span>{formatBytes(stats.totalBytes)}</span>
                            </>
                          )}
                          {stats.latestContributor && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[180px]">
                                Latest: {stats.latestContributor}
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-neutral-600 tabular-nums flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>
                            {regularFileCount > 0
                              ? `${regularFileCount} ${regularFileCount === 1 ? 'file' : 'files'}`
                              : 'Text clip'}
                          </span>
                          {regularTotalSize > 0 && (
                            <>
                              <span>·</span>
                              <span>{formatBytes(regularTotalSize)}</span>
                            </>
                          )}
                          {typeof clip.viewCount === 'number' && (
                            <>
                              <span>·</span>
                              <span>
                                {clip.viewCount} {clip.viewCount === 1 ? 'view' : 'views'}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onOpenInbox(clip)}
                          className="bg-[#141414] text-[#E4E3E0] px-3.5 py-2 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {isCollection ? (
                            <Inbox className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          <span>{isCollection ? 'Open Inbox' : 'Open Clip'}</span>
                        </button>

                        {isCollection && stats && stats.totalFiles > 0 && (
                          isProMax ? (
                            <>
                              <button
                                type="button"
                                disabled={isZipping}
                                onClick={() => onDownloadCollectionZip(clip)}
                                className="border border-[#141414] bg-white text-[#141414] px-3 py-2 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                              >
                                <Archive className="w-3.5 h-3.5 shrink-0" />
                                <span>ZIP ({stats.totalFiles})</span>
                              </button>
                              <button
                                type="button"
                                disabled={exportingDriveClipId === clip.id}
                                onClick={() => onExportDrive(clip)}
                                className="border border-[#141414]/30 bg-white text-[#141414] px-3 py-2 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider hover:border-[#141414] hover:bg-[#F9F9F8] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                                title="Save all submission files directly to Google Drive"
                              >
                                {exportingDriveClipId === clip.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                                ) : (
                                  <GoogleDriveIcon className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span>{exportingDriveClipId === clip.id ? 'Saving...' : 'Drive'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onExportDropbox(clip)}
                                className="border border-[#141414]/30 bg-white text-[#141414] px-3 py-2 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider hover:border-[#141414] hover:bg-[#F9F9F8] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                                title="Save all submission files directly to Dropbox"
                              >
                                <DropboxIcon className="w-3.5 h-3.5 shrink-0" />
                                <span>Dropbox</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={onUpgrade}
                              className="border border-blue-300 bg-blue-50 text-blue-800 px-3 py-2 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                              title="Upgrade to Pro Max for ZIP, Google Drive & Dropbox batch export"
                            >
                              <Lock className="w-3 h-3 shrink-0" />
                              <span>Bulk Export · Pro Max</span>
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopyShareLink(clip.id)}
                          className={`border px-3 py-2 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                            copiedKey === `link-${clip.id}`
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-[#141414]/25 bg-white text-neutral-700 hover:border-[#141414] hover:text-[#141414]'
                          }`}
                        >
                          {copiedKey === `link-${clip.id}` ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Link2 className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{copiedKey === `link-${clip.id}` ? 'Link Copied' : 'Copy Link'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyCodeLocal(clip.id)}
                          className={`border px-3 py-2 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                            copiedKey === `code-${clip.id}`
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                              : 'border-[#141414]/25 bg-white text-neutral-700 hover:border-[#141414] hover:text-[#141414]'
                          }`}
                        >
                          {copiedKey === `code-${clip.id}` ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{copiedKey === `code-${clip.id}` ? 'Copied' : 'Code'}</span>
                        </button>

                        {canReactivate && (
                          <button
                            type="button"
                            onClick={() => onReactivate(clip.id)}
                            className="border border-blue-300 bg-blue-50 text-blue-800 px-3 py-2 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 shrink-0" />
                            <span>Reactivate 15m</span>
                          </button>
                        )}
                      </div>

                      {/* Two-step Delete */}
                      <div className="shrink-0">
                        {confirmDeleteId === clip.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={deletingId === clip.id}
                              onClick={() => handleConfirmDelete(clip.id)}
                              className="bg-red-700 text-white px-2.5 py-2 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-red-800 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                            >
                              {deletingId === clip.id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="border border-[#141414]/25 px-2.5 py-2 rounded-sm text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-600 hover:text-[#141414] whitespace-nowrap cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(clip.id)}
                            className="p-2 border border-transparent hover:border-red-300 hover:bg-red-50 text-neutral-500 hover:text-red-700 rounded-sm transition-colors cursor-pointer"
                            title="Delete"
                            aria-label={`Delete ${clip.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
