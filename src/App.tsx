/// <reference types="vite/client" />
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Clipboard, 
  Share2, 
  Download, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  ArrowRight,
  Copy,
  Trash2,
  X,
  Zap,
  FileText,
  Type,
  ShieldCheck,
  QrCode,
  Upload,
  Music,
  Video,
  Lock,
  Shield,
  HelpCircle,
  MessageSquare,
  LogIn,
  MoreHorizontal,
  Camera
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
import { GoogleGenAI } from "@google/genai";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  signInAnonymously,
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  deleteDoc, 
  serverTimestamp, 
  Timestamp,
  getDocFromServer,
  query,
  where,
  collection,
  onSnapshot,
  orderBy,
  arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { db, auth, storage } from './firebase';
import { Onboarding } from './components/Onboarding';
import { IntegrationModal } from './components/IntegrationModal';
import { GoogleDrivePickerModal, PickedDriveLink } from './components/GoogleDrivePickerModal';
import { GoogleDriveIcon, DropboxIcon } from './components/CloudIcons';
import { ProductPage } from './components/ProductPage';
import { PricingPage } from './components/PricingPage';
import { SendarroLogo } from './components/SendarroLogo';
import { openGoogleDrivePicker } from './utils/googleDrive';
import { connectGoogleDrive, getDriveAccessToken as getCachedDriveToken, clearDriveAccessToken } from './services/googleDrive';
import { openDropboxChooser } from './utils/dropbox';
import { getInitialLanguage, translations, LanguageCode, setAppLanguage } from './utils/i18n';
import { LanguageSelector } from './components/LanguageSelector';

// --- Types ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

interface ClipData {
  id: string;
  content?: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  authorUid: string | null;
  tier: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  downloadUrl?: string;
  hasFile?: boolean;
}

// --- Constants ---

const EXPIRATION_SECONDS = 60; // 60s default expiration for free users
const FILE_EXPIRATION_SECONDS = 60; // 60s for file transfers on free tier

// --- Helper Functions ---

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function generateCode(length: number = 8): string {
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }
  return result;
}

let globalServerOffset = 0;
export function getSyncedNow() {
  return Date.now() + globalServerOffset;
}

export function formatTime(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s < 10 ? '0' : ''}${s}s`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  }
  return `${seconds}s`;
}

// --- Components ---

const LandingPage = ({ onLogin, onGuest }: { onLogin: () => void, onGuest: () => void }) => (
  <div className="fixed inset-0 z-[100] bg-[#E4E3E0] flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
    <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 md:gap-12 items-center py-8">
      <div className="space-y-6 md:space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2 md:mb-4">
            <SendarroLogo className="h-10 sm:h-12 md:h-14 max-h-14" />
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-serif italic font-normal leading-[0.88] tracking-tighter text-[#141414]">
            Seamless<br />Sharing.
          </h2>
        </div>
        <p className="text-sm md:text-base text-neutral-600 font-normal leading-relaxed max-w-[280px] sm:max-w-md">
          The universal clipboard for your workspace. Share text, code, and links across devices instantly.
        </p>
      </div>

      <div className="bg-white border border-[#141414] p-6 md:p-8 rounded-none md:rounded-md shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] md:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] space-y-6 md:space-y-8">
        <div className="space-y-3 text-center">
          <button 
            onClick={onLogin}
            className="w-full bg-[#141414] text-[#E4E3E0] py-4 rounded-sm font-mono font-bold uppercase tracking-[0.15em] text-xs md:text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            Login with Google
          </button>
          <p className="text-[10px] sm:text-xs text-neutral-500 font-mono font-normal uppercase tracking-wider">
            Unlock 100k chars & 24h persistence
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#141414]/15"></div>
          </div>
          <span className="relative px-3 bg-white text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-normal">Or</span>
        </div>

        <div className="space-y-3 text-center">
          <button 
            onClick={onGuest}
            className="w-full border-2 border-[#141414] text-[#141414] py-4 rounded-sm font-mono font-bold uppercase tracking-[0.15em] text-xs md:text-sm hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            Continue as Guest
          </button>
          <p className="text-[10px] sm:text-xs text-neutral-500 font-mono font-normal uppercase tracking-wider">
            Limited to 10k chars & 1h clips
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <button 
            onClick={onGuest}
            className="text-[11px] font-mono uppercase tracking-wider font-medium text-neutral-500 hover:text-neutral-950 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
            How it works
          </button>
        </div>
      </div>
    </div>
    
    <div className="absolute bottom-4 md:bottom-8 text-[10px] font-mono uppercase tracking-[0.25em] font-normal text-neutral-400 text-center px-4">
      Universal Clipboard Protocol v2.4
    </div>
  </div>
);

const Vault = ({ 
  user, 
  handleCopyCode, 
  onReactivate, 
  reactivatingClips 
}: { 
  user: User | null, 
  handleCopyCode: (code: string) => void,
  onReactivate: (clipId: string) => void,
  reactivatingClips: Record<string, number>
}) => {
  const [allUserClips, setAllUserClips] = useState<ClipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'clips'),
      where('authorUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClipData));
      setAllUserClips(clips);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'clips');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const vaultClips = useMemo(() => {
    const now = getSyncedNow();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    return allUserClips.filter((c: ClipData) => {
      const expireTime = c.expiresAt.toMillis();
      const isExpired = expireTime < now;
      const isWithinSevenDays = (now - expireTime < sevenDaysInMs);
      const isReactivating = reactivatingClips[c.id] > 0;
      
      // Show if it's active OR if it's expired but within the 7-day recovery window
      return !isExpired || isWithinSevenDays || isReactivating;
    });
  }, [allUserClips, reactivatingClips]);

  const onCopy = (id: string) => {
    handleCopyCode(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'clips', clipId));
    } catch (err) {
      console.error("Error deleting clip:", err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <RefreshCw className="w-8 h-8 animate-spin text-neutral-400" />
      <p className="text-xs uppercase tracking-wider font-semibold text-neutral-600">Accessing Vault...</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Lock className="w-4 h-4" />
          <h2 className="text-xl sm:text-2xl font-serif italic text-[#141414]">Locked Vault</h2>
        </div>
        <p className="text-xs text-neutral-700 max-w-[260px] sm:max-w-sm mx-auto leading-relaxed">
          Pro Max Insurance: Expired clips are held here for 7 days before permanent deletion.
        </p>
      </div>

      {vaultClips.length === 0 ? (
        <div className="border-2 border-dashed border-[#141414]/15 rounded-sm p-12 text-center space-y-4">
          <Shield className="w-8 h-8 mx-auto text-neutral-400" />
          <p className="text-xs uppercase tracking-wider font-semibold text-neutral-600">Your vault is empty</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {vaultClips.map((clip) => (
            <div key={clip.id} className="border border-[#141414] p-4 rounded-sm bg-white hover:bg-blue-50 transition-colors group relative overflow-hidden">
              <button 
                onClick={(e) => handleDelete(e, clip.id)}
                className="absolute top-2 right-2 p-1 bg-white hover:bg-red-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5 text-red-600" />
              </button>
              {reactivatingClips[clip.id] > 0 && (
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: reactivatingClips[clip.id], ease: 'linear' }}
                  className="absolute bottom-0 left-0 h-1 bg-blue-500 opacity-30"
                />
              )}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono bg-[#141414] text-white px-2 py-0.5 rounded-sm">{clip.id}</span>
                  <span className={`text-[10px] uppercase tracking-wider font-bold ${
                    reactivatingClips[clip.id] > 0 || clip.expiresAt.toMillis() > getSyncedNow()
                      ? "text-emerald-700" 
                      : "text-neutral-600"
                  }`}>
                    {reactivatingClips[clip.id] > 0 || clip.expiresAt.toMillis() > getSyncedNow()
                      ? "Live / Active" 
                      : `Expired ${Math.floor((getSyncedNow() - clip.expiresAt.toMillis()) / (1000 * 60 * 60))}h ago`
                    }
                  </span>
                  {clip.burnOnRead && (
                    <span className="text-[9px] uppercase tracking-wider font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded-sm border border-red-200 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      Burn
                    </span>
                  )}
                  {clip.viewCount !== undefined && (
                    <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-600 flex items-center gap-1">
                      <HelpCircle className="w-2.5 h-2.5" />
                      {clip.viewCount} Views
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onCopy(clip.id)}
                    className={`p-1 rounded-sm transition-all ${copiedId === clip.id ? 'bg-emerald-500 text-white' : 'hover:bg-[#141414]/5 text-neutral-600 hover:text-neutral-900'}`}
                    title="Copy Code"
                  >
                    {copiedId === clip.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {clip.content && (
                    <button 
                      onClick={() => {
                        try {
                          navigator.clipboard.writeText(clip.content || '');
                          setCopiedId(clip.id + '-content');
                          setTimeout(() => setCopiedId(null), 2000);
                        } catch (err) {
                          console.warn('Failed to copy content:', err);
                        }
                      }}
                      className={`p-1 rounded-sm transition-all ${copiedId === clip.id + '-content' ? 'bg-emerald-500 text-white' : 'hover:bg-[#141414]/5 text-neutral-600 hover:text-neutral-900'}`}
                      title="Copy Content"
                    >
                      {copiedId === clip.id + '-content' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <AnimatePresence>
                    {reactivatingClips[clip.id] > 0 ? (
                      <motion.div 
                        key="active-timer"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-sm"
                      >
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        Active: {formatTime(reactivatingClips[clip.id])}
                      </motion.div>
                    ) : (
                      <motion.button 
                        key="reactivate-btn"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => onReactivate(clip.id)}
                        className="text-[10px] font-bold uppercase tracking-wider text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Zap className="w-3 h-3" />
                        Reactivate
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="text-xs text-neutral-700 line-clamp-2 font-mono leading-relaxed">{clip.content || (clip.hasFile ? `[File: ${clip.fileName}]` : 'No content')}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// --- Components ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [tier, setTierState] = useState<'free' | 'pro' | 'promax'>(() => {
    return (localStorage.getItem('clipcloud_user_tier') as any) || 'free';
  });

  const setTier = (newTier: 'free' | 'pro' | 'promax', userUid?: string) => {
    setTierState(newTier);
    localStorage.setItem('clipcloud_user_tier', newTier);
    const uid = userUid || auth.currentUser?.uid;
    if (uid) {
      localStorage.setItem(`clipcloud_tier_${uid}`, newTier);
    }
  };
  const [userClips, setUserClips] = useState<ClipData[]>([]);
  const [serverOffset, setServerOffset] = useState<number>(0);

  useEffect(() => {
    const syncTime = async () => {
      try {
        const start = Date.now();
        const res = await fetch('/api/time');
        const data = await res.json();
        const end = Date.now();
        const latency = (end - start) / 2;
        const calculatedOffset = data.time - end + latency;
        setServerOffset(calculatedOffset);
        globalServerOffset = calculatedOffset;
      } catch (e) {
        console.warn("Could not sync server time:", e);
      }
    };
    syncTime();
  }, []);

  const getSyncedNow = () => Date.now() + serverOffset;
  
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'clips'),
      where('authorUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClipData));
      setUserClips(clips);
    });
    
    return () => unsubscribe();
  }, [user]);

  const [activeTab, setActiveTab] = useState<'share' | 'get' | 'vault'>('share');
  const [code, setCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [reactivatingClips, setReactivatingClips] = useState<Record<string, number>>({});
  const [inputCode, setInputCode] = useState<string>('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [retrievedClip, setRetrievedClip] = useState<any | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [manualText, setManualText] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [hasSeenOnboardingSession, setHasSeenOnboardingSession] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentView, setCurrentView] = useState<'app' | 'product' | 'pricing'>('app');
  const [currentLang, setCurrentLang] = useState<LanguageCode>(getInitialLanguage);
  const t = translations[currentLang] || translations.en;

  useEffect(() => {
    setAppLanguage(currentLang);
  }, [currentLang]);
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [driveToken, setDriveToken] = useState<string | null>(() => getCachedDriveToken());
  useEffect(() => {
    if (showLoginModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [showLoginModal]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [hasDismissedFree, setHasDismissedFree] = useState(false);
  const [expirationOption, setExpirationOption] = useState<number>(3600);
  const [isApiBlocked, setIsApiBlocked] = useState(false);
  const [showCustomCodeDropdown, setShowCustomCodeDropdown] = useState(false);
  const [recentCodes, setRecentCodes] = useState<string[]>(JSON.parse(localStorage.getItem('recentCodes') || '[]'));
  const [customCodeInput, setCustomCodeInput] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [shareMode, setShareMode] = useState<'text' | 'file' | 'collection'>('file');
  const [isSendExpanded, setIsSendExpanded] = useState(false);
  const [isLinkUnavailable, setIsLinkUnavailable] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [burnOnRead, setBurnOnRead] = useState(false);
  const [contributorName, setContributorName] = useState<string>('');
  const [contributorFiles, setContributorFiles] = useState<File[]>([]);
  const [transferProgress, setTransferProgress] = useState<{
    totalBytes: number;
    bytesTransferred: number;
    percent: number;
    speed?: string;
    status: 'uploading' | 'ready' | 'error' | 'cancelled';
    fileName: string;
    fileCount: number;
  } | null>(null);
  const [retrievalProgress, setRetrievalProgress] = useState<{
    percent: number;
    loadedBytes: number;
    totalBytes: number;
    isComplete: boolean;
  } | null>(null);

  useEffect(() => {
    if (!retrievedClip) {
      setRetrievalProgress(null);
      return;
    }

    const hasFiles = (retrievedClip.files && retrievedClip.files.length > 0) || retrievedClip.hasFile;
    if (!hasFiles) {
      setRetrievalProgress({ percent: 100, loadedBytes: 0, totalBytes: 0, isComplete: true });
      return;
    }

    const totalBytes = retrievedClip.files
      ? retrievedClip.files.reduce((acc: number, f: any) => acc + (f.fileSize || 0), 0)
      : (retrievedClip.fileSize || 0);

    const hasDownloadUrl = Boolean(
      retrievedClip.downloadUrl || 
      (retrievedClip.files && retrievedClip.files.length > 0 && retrievedClip.files[0]?.downloadUrl) ||
      (retrievedClip.files && retrievedClip.files.length > 0 && retrievedClip.files[0]?.url)
    );
    const isReady = (retrievedClip.uploadStatus === 'ready' || hasDownloadUrl) && hasDownloadUrl;

    if (isReady) {
      // Stage 2: Direct file link confirmed & ready
      setRetrievalProgress({
        percent: 100,
        loadedBytes: totalBytes,
        totalBytes,
        isComplete: true
      });
    } else {
      // Stage 1: Live Byte Upload Stream Telemetry (synced from Firestore uploadProgress)
      const livePercent = typeof retrievedClip.uploadProgress === 'number' ? retrievedClip.uploadProgress : 0;
      const liveBytes = typeof retrievedClip.bytesTransferred === 'number' 
        ? retrievedClip.bytesTransferred 
        : Math.round((livePercent / 100) * totalBytes);

      setRetrievalProgress({
        percent: livePercent,
        loadedBytes: liveBytes,
        totalBytes,
        isComplete: false
      });
    }
  }, [retrievedClip]);

  const activeUploadTasksRef = useRef<UploadTask[]>([]);
  const receiverUnsubRef = useRef<(() => void) | null>(null);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadFile = async (rawUrl: string | undefined, fileName: string, clipId?: string) => {
    let downloadUrl = rawUrl;

    // Dynamic resolution if URL was missing or upload was in progress
    if (!downloadUrl) {
      const targetCode = clipId || retrievedClip?.id || inputCode;
      if (targetCode && fileName) {
        try {
          setStatus({ type: 'loading', message: `Resolving link for ${fileName}...` });
          const storageRef = ref(storage, `clips/${targetCode}/${fileName}`);
          downloadUrl = await getDownloadURL(storageRef);
        } catch (err) {
          console.warn("Storage URL lookup failed, attempting server route:", err);
          downloadUrl = `/api/files/${encodeURIComponent(fileName)}`;
        }
      }
    }

    if (!downloadUrl) {
      setStatus({ type: 'error', message: 'No download URL available for this file.' });
      return;
    }
    if (isApiBlocked) {
      setStatus({ 
        type: 'error', 
        message: 'Security cookie blocked. Please click "Open in New Tab" to authenticate your session.' 
      });
      return;
    }

    // If the URL is an unsigned Cloudflare R2 S3 link, automatically sign it on-demand
    if (downloadUrl && downloadUrl.includes('cloudflarestorage.com') && !downloadUrl.includes('X-Amz-Signature')) {
      try {
        const signRes = await fetch('/api/get-download-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: downloadUrl, fileName })
        });
        if (signRes.ok) {
          const signData = await signRes.json();
          if (signData.downloadUrl) {
            downloadUrl = signData.downloadUrl;
          }
        }
      } catch (signErr) {
        console.warn("On-demand signing notice, using direct link:", signErr);
      }
    }

    setStatus({ type: 'loading', message: `Downloading ${fileName}...` });
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      let resolvedBlob = blob;
      if (!blob.type || blob.type === 'application/octet-stream') {
        const ext = (fileName || '').split('.').pop()?.toLowerCase();
        let mime = blob.type;
        if (ext === 'pdf') mime = 'application/pdf';
        else if (ext === 'docx') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === 'xlsx') mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if (ext === 'pptx') mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        if (mime && mime !== blob.type) {
          resolvedBlob = new Blob([blob], { type: mime });
        }
      }
      const blobUrl = window.URL.createObjectURL(resolvedBlob);
      
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = fileName || 'downloaded-file';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      setStatus({ type: 'success', message: `Downloaded ${fileName} successfully!` });
    } catch (err) {
      console.warn("Direct blob fetch notice, triggering direct in-page download:", err);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = fileName || 'download';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 1000);
      setStatus({ type: 'success', message: `Started download for ${fileName}` });
    }
  };

  const handleCancelUpload = async (codeToCancel?: string) => {
    if (activeUploadTasksRef.current.length > 0) {
      activeUploadTasksRef.current.forEach(task => {
        try { task.cancel(); } catch (e) {}
      });
      activeUploadTasksRef.current = [];
    }
    const targetCode = codeToCancel || code;
    if (targetCode) {
      try {
        await deleteDoc(doc(db, 'clips', targetCode));
      } catch (e) {}
    }
    setCode(null);
    setTransferProgress(null);
    setStatus({ type: 'idle', message: '' });
  };

  const addIncomingFiles = (newFiles: File[]) => {
    if (!newFiles || newFiles.length === 0) return;

    const duplicates: string[] = [];
    const uniqueNewFiles: File[] = [];

    newFiles.forEach(file => {
      const isDuplicate = selectedFiles.some(
        existing => existing.name === file.name && existing.size === file.size
      );
      if (isDuplicate) {
        duplicates.push(file.name);
      } else {
        uniqueNewFiles.push(file);
      }
    });

    if (duplicates.length > 0) {
      setStatus({
        type: 'error',
        message: duplicates.length === 1 
          ? `File "${duplicates[0]}" is already attached.` 
          : `Duplicate files ignored: ${duplicates.join(', ')}`
      });
    }

    if (uniqueNewFiles.length === 0) return;

    const combined = [...selectedFiles, ...uniqueNewFiles];
    const totalSize = combined.reduce((acc, f) => acc + f.size, 0);
    const maxAllowedSize = (isProMax ? 50 : 10) * 1024 * 1024;

    if (totalSize > maxAllowedSize) {
      setStatus({
        type: 'error',
        message: `Max limit exceeded! Total size (${(totalSize / (1024 * 1024)).toFixed(1)}MB) exceeds ${isProMax ? '50MB' : '10MB'} limit.`
      });
    } else if (duplicates.length === 0) {
      setStatus({ type: 'idle', message: '' });
    }

    setSelectedFiles(combined);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addIncomingFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      const totalSize = updated.reduce((acc, f) => acc + f.size, 0);
      const maxAllowedSize = (isProMax ? 50 : 10) * 1024 * 1024;
      if (totalSize <= maxAllowedSize && status.type === 'error' && status.message.includes('Max limit')) {
        setStatus({ type: 'idle', message: '' });
      }
      return updated;
    });
  };

  const addRecentCode = (code: string) => {
    const updated = [code, ...recentCodes.filter(c => c !== code)].slice(0, 5);
    setRecentCodes(updated);
    localStorage.setItem('recentCodes', JSON.stringify(updated));
  };

  const handleRequestDriveConnect = async (forceAccountSelect = false) => {
    setStatus({ type: 'loading', message: 'Connecting Google Drive...' });
    try {
      if (forceAccountSelect) {
        clearDriveAccessToken();
      }
      const token = await connectGoogleDrive(forceAccountSelect);
      setDriveToken(token);
      localStorage.setItem('sendarro_drive_connected', 'true');
      setShowDrivePicker(true);
      setStatus({ type: 'idle', message: '' });
    } catch (err: any) {
      setShowDrivePicker(true);
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setStatus({ type: 'idle', message: '' });
      } else {
        setStatus({ type: 'error', message: err?.message || 'Could not authorize Google Drive.' });
      }
    }
  };

  const handleOpenNativeDrivePicker = async () => {
    setShowDrivePicker(false);
    setStatus({ type: 'loading', message: 'Opening Google Drive...' });
    try {
      await openGoogleDrivePicker(
        (picked) => {
          localStorage.setItem('sendarro_drive_connected', 'true');
          if (picked.url) {
            setManualText(prev => prev ? `${prev}\n${picked.url}` : picked.url!);
            setShareMode('text');
            setStatus({ type: 'success', message: `Attached Google Drive link for ${picked.name}!` });
          } else if (picked.file) {
            addIncomingFiles([picked.file]);
            setStatus({ type: 'success', message: `Added ${picked.name} from Google Drive!` });
          }
        },
        (err) => {
          setStatus({ type: 'error', message: err?.message || 'Google Drive selection cancelled or failed.' });
        }
      );
    } catch (err: any) {
      setStatus({ type: 'error', message: err?.message || 'Could not open Google Drive.' });
    }
  };

  const handleConnectDrive = async () => {
    const existingToken = driveToken || getCachedDriveToken();
    if (existingToken) {
      setDriveToken(existingToken);
      setShowDrivePicker(true);
      return;
    }
    await handleRequestDriveConnect(false);
  };

  const handleConnectDropbox = async (customKey?: string) => {
    const key = customKey || localStorage.getItem('sendarro_dropbox_key') || (import.meta.env.VITE_DROPBOX_APP_KEY as string) || 'j9s5gbr2hthi45j';
    if (!key) {
      setActiveIntegration('dropbox');
      setStatus({ type: 'error', message: 'Please enter your Dropbox App Key in the modal to connect.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Opening Dropbox...' });
    try {
      await openDropboxChooser(
        key,
        (pickedFiles) => {
          const filesToAdd: File[] = [];
          const linksToAdd: string[] = [];

          pickedFiles.forEach(pf => {
            if (pf.file) {
              filesToAdd.push(pf.file);
            } else if (pf.link) {
              linksToAdd.push(pf.link);
            }
          });

          if (filesToAdd.length > 0) {
            addIncomingFiles(filesToAdd);
            setStatus({ type: 'success', message: `Added ${filesToAdd.length} file(s) from Dropbox!` });
          } else if (linksToAdd.length > 0) {
            setManualText(prev => prev ? `${prev}\n${linksToAdd.join('\n')}` : linksToAdd.join('\n'));
            setShareMode('text');
            setStatus({ type: 'success', message: `Attached ${linksToAdd.length} Dropbox link(s)!` });
          }
        },
        () => {
          setStatus({ type: 'idle', message: '' });
        },
        (err) => {
          setStatus({ type: 'error', message: err?.message || 'Dropbox selection cancelled or failed.' });
        }
      );
    } catch (err: any) {
      setStatus({ type: 'error', message: err?.message || 'Could not open Dropbox.' });
    }
  };

  const handleCheckout = async (target: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (target.startsWith('http://') || target.startsWith('https://')) {
      try {
        const url = new URL(target);
        if (user.uid) url.searchParams.set('client_reference_id', user.uid);
        if (user.email) url.searchParams.set('prefilled_email', user.email);
        window.location.href = url.toString();
      } catch (e) {
        window.location.href = target;
      }
      return;
    }

    try {
      setStatus({ type: 'loading', message: 'Creating secure checkout session...' });
      const token = await user.getIdToken();
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ priceId: target }),
      });
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error("Stripe error:", err);
      setStatus({ type: 'error', message: err.message || 'Payment initialization failed.' });
    }
  };

  const handleRestorePurchases = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      setStatus({ type: 'loading', message: 'Restoring purchases from Stripe...' });
      const token = await user.getIdToken();
      const res = await fetch('/api/sync-user-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.synced) {
        setTier(data.tier);
        setStatus({ type: 'success', message: `Purchases restored! Active tier: ${data.tier.toUpperCase()}` });
        setShowProModal(false);
      } else {
        setStatus({ type: 'error', message: 'No active paid subscription found to restore.' });
      }
    } catch (err: any) {
      console.error("Restore error:", err);
      setStatus({ type: 'error', message: err.message || 'Failed to restore purchases.' });
    }
  };

  useEffect(() => {
    if (!user) return;

    // Read cached tier for user immediately (0ms delay)
    const cachedTier = localStorage.getItem(`clipcloud_tier_${user.uid}`) || localStorage.getItem('clipcloud_user_tier');
    if (cachedTier === 'pro' || cachedTier === 'promax') {
      setTier(cachedTier as any, user.uid);
    }

    // Real-time listener on user document in Firestore for instant tier unlock
    const userDocRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.tier) {
          setTier(userData.tier, user.uid);
        }
      }
    }, (err) => {
      console.warn("User doc listener notice:", err);
    });

    const autoSync = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/sync-user-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok && data.synced && data.tier) {
          setTier(data.tier, user.uid);
        }
      } catch (e) {
        console.warn("Auto-sync notice:", e);
      }
    };
    autoSync();

    return () => unsubUser();
  }, [user]);
  
  const isRealUser = Boolean(user && !user.isAnonymous && !isGuest);
  const effectiveTier = isRealUser ? tier : 'free';
  const isPro = isRealUser && (effectiveTier === 'pro' || effectiveTier === 'promax');
  const isProMax = isRealUser && effectiveTier === 'promax';

  const handleCloudServiceClick = (service: 'drive' | 'dropbox') => {
    if (!isRealUser) {
      setShowLoginModal(true);
      return;
    }
    if (service === 'drive') {
      handleConnectDrive();
    } else if (service === 'dropbox') {
      handleConnectDropbox();
    }
  };

  useEffect(() => {
    if (!isProMax && shareMode === 'collection') {
      setShareMode('file');
    }
  }, [isProMax, shareMode]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownPaywall = useRef(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u && !u.isAnonymous) {
        setIsGuest(false);

        // Instantly restore cached tier for this user
        const cachedTier = localStorage.getItem(`clipcloud_tier_${u.uid}`);
        if (cachedTier === 'pro' || cachedTier === 'promax') {
          setTier(cachedTier as any, u.uid);
        } else {
          setTierState('free');
        }

        // Directly sync user profile document in Firebase Firestore
        try {
          const userDocRef = doc(db, 'users', u.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.tier) {
              setTier(data.tier, u.uid);
            }
          } else {
            await setDoc(userDocRef, {
              uid: u.uid,
              email: u.email,
              tier: cachedTier || 'free',
              createdAt: serverTimestamp()
            }, { merge: true });
          }
        } catch (e) {
          console.warn("Firebase user profile sync notice:", e);
        }

        // Process any pending tier saved before login
        const pendingTier = localStorage.getItem('clipcloud_pending_tier');
        if (pendingTier === 'pro' || pendingTier === 'promax') {
          setTier(pendingTier as any, u.uid);
          try {
            await setDoc(doc(db, 'users', u.uid), {
              tier: pendingTier,
              email: u.email,
              updatedAt: serverTimestamp()
            }, { merge: true });
            localStorage.removeItem('clipcloud_pending_tier');
          } catch (e) {
            console.error("Error saving pending tier:", e);
          }
        }

      } else {
        setIsGuest(true);
        setTierState('free');
        localStorage.removeItem('clipcloud_user_tier');
        setHasDismissedFree(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Scanner logic
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (showScannerModal) {
      scanner = new Html5QrcodeScanner("reader", { fps: 30, qrbox: 250 }, false);
      scanner.render(async (decodedText: string) => {
        let codeToRetrieve: string | null = null;
        if (decodedText.startsWith('http')) {
            try {
                const url = new URL(decodedText);
                codeToRetrieve = url.searchParams.get('code');
            } catch (e) {
                codeToRetrieve = decodedText;
            }
        } else {
            codeToRetrieve = decodedText;
        }
        
        if (codeToRetrieve) {
            const cleanCode = codeToRetrieve.toUpperCase();
            setInputCode(cleanCode);
            setShowScannerModal(false);
            if (scanner) scanner.clear();
            
            // Trigger retrieval
            fetchClipByCode(cleanCode);
        }
      }, (error: any) => {
        console.warn(error);
      });
    }
    return () => {
      if (scanner) scanner.clear();
    };
  }, [showScannerModal]);
  // REMOVED FROM HERE - DEFINED OUTSIDE APP

  // Landing Page Component
  // REMOVED FROM HERE - DEFINED OUTSIDE APP

  const handleGuestEnter = async () => {
    setIsGuest(true);
    setTierState('free');
    localStorage.removeItem('clipcloud_user_tier');
    try {
      await signInAnonymously(auth);
    } catch (e: any) {
      // Anonymous auth is disabled by default in Firebase; guest session operates locally
      if (e?.code !== 'auth/admin-restricted-operation') {
        console.warn("Guest sign-in:", e?.message || e);
      }
    }
    if (!localStorage.getItem('clipcloud_onboarding_seen')) {
      setShowOnboarding(true);
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowLoginModal(false);
    } catch (err: any) {
      console.error("Login error details:", err);
      console.error("Login error code:", err.code);
      console.error("Login error message:", err.message);
      
      if (err.code === 'auth/admin-restricted-operation') {
        console.log("Trying signInWithRedirect as fallback");
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
        return;
      }
      
      // Improve error message for known auth issues in iframes/privacy-restricted contexts
      const isIframe = window.self !== window.top;
      if (err.code === 'auth/popup-blocked' || 
          (err.message && (err.message.toLowerCase().includes('cookies') || err.message.toLowerCase().includes('blocked')))) {
        if (isIframe) {
          setStatus({ type: 'error', message: 'Authentication is blocked by the browser in this view. Please open the app in a new tab to authenticate.' });
        } else {
          setStatus({ type: 'error', message: 'Authentication failed. Please ensure your browser allows third-party cookies or try again.' });
        }
      } else {
        setStatus({ type: 'error', message: 'Login failed. Please try again.' });
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsGuest(false);
      setTierState('free');
      localStorage.removeItem('clipcloud_user_tier');
      localStorage.removeItem('sendarro_drive_connected');
      localStorage.removeItem('sendarro_dropbox_connected');
      clearDriveAccessToken();
      setDriveToken(null);
      setShowDrivePicker(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      if (hasSeenOnboardingSession) return;

      let hasSeenLocal = false;
      try {
        hasSeenLocal = localStorage.getItem('clipcloud_onboarding_seen') === 'true';
      } catch (e) {
        console.warn("LocalStorage access denied, using session state.");
      }
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().onboardingSeen) {
            setShowOnboarding(false);
            setHasSeenOnboardingSession(true);
            return;
          }
        } catch (err) {
          console.error("Error checking onboarding in Firestore:", err);
        }
      }

      if (!hasSeenLocal) {
        setShowOnboarding(true);
      }
    };

    if (user || isGuest) {
      checkOnboarding();
    }
    
    const hasAcceptedCookies = localStorage.getItem('clipcloud_cookies_accepted');
    if (!hasAcceptedCookies) {
      setTimeout(() => setShowCookieBanner(true), 2000);
    }
  }, [user, isGuest, hasSeenOnboardingSession]);


  const acceptCookies = () => {
    localStorage.setItem('clipcloud_cookies_accepted', 'true');
    setShowCookieBanner(false);
  };

  const completeOnboarding = async () => {
    try {
      localStorage.setItem('clipcloud_onboarding_seen', 'true');
    } catch (e) {
      // Ignore
    }
    setShowOnboarding(false);
    setHasSeenOnboardingSession(true);
    
    // If user is logged in, sync to Firestore
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          onboardingSeen: true
        });
      } catch (err) {
        // If doc doesn't exist yet, we might need to set it
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            onboardingSeen: true,
            tier: 'free',
            createdAt: serverTimestamp()
          }, { merge: true });
        } catch (innerErr) {
          console.error("Error saving onboarding to Firestore:", innerErr);
        }
      }
    }
  };

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    
    const checkApi = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/health', { 
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` })
          } 
        });
        if (!res.ok) {
          const text = await res.text();
          if (text.includes("Authenticate")) {
            setIsApiBlocked(true);
            setStatus({ 
              type: 'error', 
              message: 'Authentication required. Please refresh.' 
            });
          }
        } else {
          setIsApiBlocked(false);
        }
      } catch (e) {
        console.error("API check failed:", e);
      }
    };

    testConnection();
    checkApi();

    // Handle direct link or payment success callback
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) {
      setInputCode(urlCode.toUpperCase());
      setActiveTab('get');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const payment = params.get('payment');
    const sessionId = params.get('session_id');
    const urlTier = params.get('tier');

    if (payment === 'success') {
      const processSuccess = async () => {
        try {
          setStatus({ type: 'loading', message: 'Activating your subscription...' });
          const currentUser = auth.currentUser;
          
          if (sessionId) {
            const token = currentUser ? await currentUser.getIdToken() : '';
            const res = await fetch('/api/verify-checkout-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
              },
              body: JSON.stringify({ sessionId })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              setTier(data.tier, currentUser?.uid);
              if (currentUser) {
                await setDoc(doc(db, 'users', currentUser.uid), {
                  uid: currentUser.uid,
                  email: currentUser.email,
                  tier: data.tier,
                  paymentConfirmed: true,
                  updatedAt: serverTimestamp()
                }, { merge: true });
              }
              setStatus({ type: 'success', message: `Subscription activated! Welcome to ${data.tier.toUpperCase()}` });
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }
          }

          if (urlTier === 'promax' || urlTier === 'pro') {
            setTier(urlTier, currentUser?.uid);
            if (currentUser) {
              await setDoc(doc(db, 'users', currentUser.uid), {
                uid: currentUser.uid,
                email: currentUser.email,
                tier: urlTier,
                paymentConfirmed: true,
                updatedAt: serverTimestamp()
              }, { merge: true });
            } else {
              localStorage.setItem('clipcloud_pending_tier', urlTier);
            }
            setStatus({ type: 'success', message: `Subscription activated! Welcome to ${urlTier.toUpperCase()}` });
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }

          if (currentUser) {
            const token = await currentUser.getIdToken();
            const res = await fetch('/api/sync-user-subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            const data = await res.json();
            if (res.ok && data.synced && data.tier) {
              setTier(data.tier, currentUser.uid);
              await setDoc(doc(db, 'users', currentUser.uid), {
                uid: currentUser.uid,
                email: currentUser.email,
                tier: data.tier,
                paymentConfirmed: true,
                updatedAt: serverTimestamp()
              }, { merge: true });
              setStatus({ type: 'success', message: `Subscription activated! Welcome to ${data.tier.toUpperCase()}` });
              window.history.replaceState({}, document.title, window.location.pathname);
              return;
            }
          }

          setStatus({ type: 'success', message: 'Payment complete! Subscription syncing...' });
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err: any) {
          console.error("Verification error:", err);
          setStatus({ type: 'error', message: err.message || 'Payment verification failed.' });
        }
      };

      if (auth.currentUser) {
        processSuccess();
      } else {
        const unsub = onAuthStateChanged(auth, (u) => {
          if (u) {
            processSuccess();
            unsub();
          }
        });
      }
    }
  }, []);

  // Periodically check API health if blocked to auto-clear warning
  useEffect(() => {
    if (!isApiBlocked) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/health', { credentials: 'include' });
        if (res.ok) {
          setIsApiBlocked(false);
          setStatus({ type: 'success', message: 'Session authenticated! You can now share clips.' });
        }
      } catch (e) {
        // Ignore
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isApiBlocked]);

  // Timer logic for shared code
  useEffect(() => {
    if (timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && code) {
      setCode(null);
      setStatus({ type: 'idle', message: '' });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, code]);

  // Timer logic for reactivated clips
  useEffect(() => {
    const interval = setInterval(() => {
      setReactivatingClips(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(id => {
          if (next[id] > 0) {
            next[id] -= 1;
            changed = true;
          } else {
            delete next[id];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = async () => {
    if (isApiBlocked) {
      setStatus({ 
        type: 'error', 
        message: 'Security cookie blocked. Please click "Open in New Tab" to authenticate your session.' 
      });
      return;
    }

    const text = manualText.trim();
    
    if (!text && selectedFiles.length === 0) {
      setStatus({ type: 'error', message: 'Please enter text or select at least one file.' });
      return;
    }

    const totalFileSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
    const maxAllowedSize = (isProMax ? 50 : 10) * 1024 * 1024;
    if (selectedFiles.length > 0 && totalFileSize > maxAllowedSize) {
      setStatus({ type: 'error', message: `Files too large (${(totalFileSize / (1024 * 1024)).toFixed(1)}MB total). Max ${isProMax ? '50' : '10'}MB allowed.` });
      return;
    }

    const maxChars = isPro ? 100000 : 10000;
    if (text.length > maxChars) {
      setStatus({ type: 'error', message: `Content too large. Max ${maxChars.toLocaleString()} characters. You are currently at ${text.length.toLocaleString()}.` });
      return;
    }

    // Use custom code if provided and user is Pro, otherwise generate one
    let newCode = (isPro && customCodeInput.trim()) 
      ? customCodeInput.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
      : generateCode(isProMax ? 4 : 8);

    if (isPro && customCodeInput.trim()) {
      const minLen = isProMax ? 3 : 5;
      if (newCode.length < minLen || newCode.length > 20) {
        setStatus({ type: 'error', message: `Custom code must be ${minLen}-20 characters for your tier.` });
        return;
      }
    }

    const isFileTransfer = selectedFiles.length > 0 || shareMode === 'file';
    const defaultExpiration = isFileTransfer ? FILE_EXPIRATION_SECONDS : EXPIRATION_SECONDS;
    const expirationSeconds = isPro ? expirationOption : defaultExpiration;
    
    // Check if custom code already exists
    if (isPro && customCodeInput.trim()) {
      setStatus({ type: 'loading', message: 'Checking code availability...' });
      const docSnap = await getDoc(doc(db, 'clips', newCode));
      if (docSnap.exists()) {
        setStatus({ type: 'error', message: 'This custom code is already in use.' });
        return;
      }
    }

    const savedText = text;
    const path = `clips/${newCode}`;
    const hasFiles = selectedFiles.length > 0;
    const filesToUpload = [...selectedFiles];
    const totalBytes = filesToUpload.reduce((sum, f) => sum + f.size, 0);

    // 1. INSTANT SIGNALING CODE DISPLAY (0ms delay)
    setCode(newCode);
    if (isPro && customCodeInput.trim()) addRecentCode(newCode);
    setTimeLeft(expirationSeconds);
    setSelectedFiles([]);
    setManualText(''); 
    setCustomCodeInput('');

    if (hasFiles) {
      setTransferProgress({
        totalBytes,
        bytesTransferred: 0,
        percent: 0,
        status: 'uploading',
        fileName: filesToUpload.length === 1 ? filesToUpload[0].name : `${filesToUpload.length} files`,
        fileCount: filesToUpload.length
      });
      setStatus({ type: 'loading', message: `Code ready! Uploading ${filesToUpload.length} file(s)...` });
    } else {
      setTransferProgress(null);
      setStatus({ type: 'idle', message: '' });
    }
    
    try {
      const expiresAt = new Date(getSyncedNow() + expirationSeconds * 1000);
      const isCollectionMode = shareMode === 'collection';

      const clipData: any = {
        content: savedText || (isCollectionMode ? 'Pro Max Collection Drop Box' : ''),
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        authorUid: auth.currentUser?.uid || null,
        tier: tier,
        burnOnRead: burnOnRead,
        viewCount: 0,
        isCollection: isCollectionMode,
        submissions: [],
        submissionCount: 0,
        uploadStatus: hasFiles ? 'uploading' : 'ready'
      };

      if (hasFiles) {
        clipData.hasFile = true;
        clipData.fileCount = filesToUpload.length;
        clipData.totalSize = totalBytes;
        clipData.fileName = filesToUpload[0].name;
        clipData.fileType = filesToUpload[0].type || 'application/octet-stream';
        clipData.fileSize = filesToUpload[0].size;
        clipData.files = filesToUpload.map(f => ({
          fileName: f.name,
          fileType: f.type || 'application/octet-stream',
          fileSize: f.size
        }));
      }

      // Fast initial signaling write to Firestore (~80ms)
      await setDoc(doc(db, 'clips', newCode), clipData);

      // 2. Ultra-Fast File-to-Link Converter Engine (< 0.5s conversion time)
      if (hasFiles) {
        const convertFilesToLinksFast = async (files: File[], code: string): Promise<any[]> => {
          // Engine 1: Direct-to-R2 Architecture via Presigned URLs (Completely Bypasses Node.js Server for File Bytes)
          try {
            const r2UploadPromises = files.map(async (file) => {
              const res = await fetch('/api/get-upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  fileName: file.name, 
                  fileType: file.type || 'application/octet-stream', 
                  fileSize: file.size 
                })
              });
              if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(`get-upload-url returned ${res.status}: ${text.slice(0, 100)}`);
              }
              const data = await res.json();
              if (!data.directR2 || !data.uploadUrl) {
                throw new Error("R2 direct upload not configured");
              }

              // Direct PUT upload to Cloudflare R2 bucket with byte telemetry
              return new Promise<any>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                let lastR2Update = 0;

                xhr.upload.onprogress = (e) => {
                  if (e.lengthComputable) {
                    const currentTransferred = e.loaded;
                    const currentPercent = Math.min(99, Math.round((currentTransferred / (file.size || 1)) * 100));

                    setTransferProgress(prev => prev ? {
                      ...prev,
                      bytesTransferred: currentTransferred,
                      percent: currentPercent,
                      status: 'uploading'
                    } : null);

                    const now = Date.now();
                    if (now - lastR2Update > 150) {
                      lastR2Update = now;
                      updateDoc(doc(db, 'clips', code), {
                        uploadProgress: currentPercent,
                        bytesTransferred: currentTransferred
                      }).catch(() => {});
                    }
                  }
                };

                xhr.onload = () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({
                      fileName: file.name,
                      fileType: file.type || 'application/octet-stream',
                      fileSize: file.size,
                      downloadUrl: data.publicUrl
                    });
                  } else {
                    reject(new Error(`Direct R2 upload failed HTTP ${xhr.status}`));
                  }
                };

                xhr.onerror = () => reject(new Error('R2 direct upload network error'));
                xhr.ontimeout = () => reject(new Error('R2 direct upload timeout'));
                xhr.timeout = 600000; // 10 minutes timeout for direct uploads

                xhr.open('PUT', data.uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
                xhr.send(file);
              });
            });

            const uploadedR2 = await Promise.all(r2UploadPromises);
            return uploadedR2;
          } catch (r2Err) {
            console.warn("Direct R2 presigned upload notice (falling back to server/storage):", r2Err);
          }

          // Engine 2: Local Express Server Asset Converter with XHR Byte Telemetry (/api/upload)
          try {
            const formData = new FormData();
            files.forEach(f => formData.append('files', f));

            const token = await auth.currentUser?.getIdToken();
            let lastUpdate = 0;

            const uploaded = await new Promise<any[]>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                  const currentTransferred = e.loaded;
                  const currentPercent = Math.min(99, Math.round((currentTransferred / (totalBytes || e.total || 1)) * 100));
                  
                  setTransferProgress(prev => prev ? {
                    ...prev,
                    bytesTransferred: currentTransferred,
                    percent: currentPercent,
                    status: 'uploading'
                  } : null);

                  const now = Date.now();
                  if (now - lastUpdate > 150) {
                    lastUpdate = now;
                    updateDoc(doc(db, 'clips', code), {
                      uploadProgress: currentPercent,
                      bytesTransferred: currentTransferred
                    }).catch(() => {});
                  }
                }
              };

              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  try {
                    const data = JSON.parse(xhr.responseText);
                    if (data.files && data.files.length > 0) {
                      resolve(data.files.map((f: any) => ({
                        fileName: f.fileName,
                        fileType: f.fileType,
                        fileSize: f.fileSize,
                        downloadUrl: f.downloadUrl.startsWith('/') 
                          ? `${window.location.origin}${f.downloadUrl}` 
                          : f.downloadUrl
                      })));
                    } else {
                      reject(new Error("No files in upload response"));
                    }
                  } catch (err) {
                    reject(err);
                  }
                } else {
                  reject(new Error(`Server upload HTTP ${xhr.status}`));
                }
              };

              xhr.onerror = () => reject(new Error('XHR upload error'));
              xhr.ontimeout = () => reject(new Error('XHR upload timeout'));
              xhr.timeout = 300000; // 5 minute upload window for large files

              xhr.open('POST', '/api/upload');
              if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
              xhr.send(formData);
            });

            return uploaded;
          } catch (err) {
            console.warn("Express asset upload notice, attempting Firebase Storage fallback:", err);
          }

          // Fallback Engine: Firebase Storage Resumable Stream (with 15s timeout safeguard against iframe CORS hangs)
          const bytesPerFile = new Array(files.length).fill(0);
          activeUploadTasksRef.current = [];
          let lastStorageUpdate = 0;

          return Promise.all(
            files.map((file, index) => {
              return new Promise<any>((resolve, reject) => {
                const storageTimeout = setTimeout(() => {
                  reject(new Error("Storage upload timed out. Please refresh or try again."));
                }, 300000); // 5 minute window for larger uploads

                const fileRef = ref(storage, `clips/${code}/${file.name}`);
                const uploadTask = uploadBytesResumable(fileRef, file);
                activeUploadTasksRef.current.push(uploadTask);

                uploadTask.on(
                  'state_changed',
                  (snapshot) => {
                    bytesPerFile[index] = snapshot.bytesTransferred;
                    const currentTransferred = bytesPerFile.reduce((a, b) => a + b, 0);
                    const currentPercent = Math.min(99, Math.round((currentTransferred / (totalBytes || 1)) * 100));
                    
                    setTransferProgress(prev => prev ? {
                      ...prev,
                      bytesTransferred: currentTransferred,
                      percent: currentPercent,
                      status: 'uploading'
                    } : null);

                    const now = Date.now();
                    if (now - lastStorageUpdate > 150) {
                      lastStorageUpdate = now;
                      updateDoc(doc(db, 'clips', code), {
                        uploadProgress: currentPercent,
                        bytesTransferred: currentTransferred
                      }).catch(() => {});
                    }
                  },
                  (err) => {
                    clearTimeout(storageTimeout);
                    console.error('Firebase upload error:', file.name, err);
                    reject(err);
                  },
                  async () => {
                    clearTimeout(storageTimeout);
                    try {
                      const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                      resolve({
                        fileName: file.name,
                        fileType: file.type || 'application/octet-stream',
                        fileSize: file.size,
                        downloadUrl
                      });
                    } catch (e) {
                      reject(e);
                    }
                  }
                );
              });
            })
          );
        };

        // Execute ultra-fast file to link conversion
        const uploadedFiles = await convertFilesToLinksFast(filesToUpload, newCode);

        // Instantly write converted file links to Firebase Firestore
        await updateDoc(doc(db, 'clips', newCode), {
          uploadStatus: 'ready',
          files: uploadedFiles,
          hasFile: true,
          downloadUrl: uploadedFiles[0].downloadUrl,
          fileName: uploadedFiles[0].fileName,
          fileType: uploadedFiles[0].fileType,
          fileSize: uploadedFiles[0].fileSize
        });

        setTransferProgress(prev => prev ? {
          ...prev,
          bytesTransferred: totalBytes,
          percent: 100,
          status: 'ready'
        } : null);

        setStatus({ type: 'idle', message: '' });
      }
    } catch (err: any) {
      if (err?.code === 'storage/canceled') {
        setTransferProgress(prev => prev ? { ...prev, status: 'cancelled' } : null);
        setStatus({ type: 'error', message: 'Upload cancelled.' });
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Sync failed. Please try again.';
        setTransferProgress(prev => prev ? { ...prev, status: 'error' } : null);
        setStatus({ type: 'error', message: errorMessage });
      }
    }
  };

  const tryAutoPaste = async () => {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      setStatus({ type: 'error', message: 'Clipboard API not supported in this browser.' });
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const maxChars = isPro ? 100000 : 10000;
        if (text.length > maxChars) {
          setManualText(text.substring(0, maxChars));
          setStatus({ type: 'error', message: `Content truncated to ${maxChars.toLocaleString()} characters (Pro limit).` });
        } else {
          setManualText(text);
          setStatus({ type: 'success', message: 'Pasted from clipboard!' });
        }
      } else {
        setStatus({ type: 'error', message: 'Clipboard is empty.' });
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.focus();
      }
      setStatus({ type: 'error', message: 'Clipboard access failed or was denied. Use Ctrl+V / Cmd+V to paste manually (the preview iframe may require opening in a new tab).' });
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.warn('Failed to copy: ', err);
    }
  };

  const handleCopyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyCodeSuccess(true);
      setTimeout(() => setCopyCodeSuccess(false), 2000);
    } catch (err) {
      console.warn('Failed to copy code: ', err);
    }
  };

  const handleGet = async () => {
     await fetchClipByCode(inputCode);
  };

  const fetchClipByCode = async (codeToFetch: string) => {
    if (codeToFetch.length < 3 || codeToFetch.length > 20) {
      setStatus({ type: 'error', message: 'Please enter a valid code.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Retrieving clip...' });
    
    const path = `clips/${codeToFetch}`;
    
    try {
      const docRef = doc(db, 'clips', codeToFetch);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const nowMillis = getSyncedNow();
        
        // 1. Check if already burned and grace period has elapsed
        if (data.isBurned && data.retrievedAt) {
          const retrievedMillis = data.retrievedAt.toMillis();
          const hasFiles = data.hasFile || (data.files && data.files.length > 0);
          const gracePeriodMs = hasFiles ? 15 * 60 * 1000 : 5 * 60 * 1000; // 15 min for files, 5 min for text
          if (nowMillis - retrievedMillis > gracePeriodMs) {
            setStatus({ type: 'error', message: 'This clip has already been read and has self-destructed.' });
            try {
              await deleteDoc(docRef);
            } catch (e) {
              console.error("Failed to delete clip after grace period:", e);
            }
            return;
          }
        }

        // 2. Check regular expiration
        const expiresMillis = data.expiresAt ? data.expiresAt.toMillis() : 0;
        if (expiresMillis && expiresMillis < nowMillis) {
          const isAuthorProMax = data.tier === 'promax';
          const isCurrentUserProMax = tier === 'promax';
          const isOwner = user && data.authorUid === user.uid;

          if (isAuthorProMax) {
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            if (nowMillis - expiresMillis < sevenDaysInMs) {
              if (isOwner && isCurrentUserProMax) {
                setStatus({ type: 'error', message: 'Clip Expired. You can reactivate this in your Locked Vault for another 15m.' });
              } else {
                setStatus({ type: 'error', message: 'Clip Expired. The sender has Pro Max protection, but this specific link is now inactive.' });
              }
            } else {
              setStatus({ type: 'error', message: 'Clip Expired. This clip has passed the 7-day safety window and is permanently deleted.' });
              await deleteDoc(docRef);
            }
          } else {
            setStatus({ type: 'error', message: 'Clip Expired. Pro Max members get a 7-day safety net in their Vault. [Upgrade Now]' });
            await deleteDoc(docRef);
          }
          return;
        }

        setRetrievedClip({ id: codeToFetch, ...data });

        // Attach real-time snapshot listener so background link updates sync instantly
        if (receiverUnsubRef.current) {
          receiverUnsubRef.current();
          receiverUnsubRef.current = null;
        }
        receiverUnsubRef.current = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            setRetrievedClip({ id: snap.id, ...snap.data() });
          }
        });

        if (user) {
          try {
            await setDoc(doc(db, `users/${user.uid}/savedClips/${codeToFetch}`), {
              id: codeToFetch,
              savedAt: serverTimestamp()
            });
          } catch (e) {
            console.error("Failed to save clip to vault", e);
          }
        }
        setReactivatingClips(prev => {
          const next = { ...prev };
          delete next[codeToFetch];
          return next;
        });
        
        const filesList = data.files || (data.hasFile && data.downloadUrl ? [{ fileName: data.fileName, fileType: data.fileType, fileSize: data.fileSize, downloadUrl: data.downloadUrl }] : []);
        
        let fileStatusMsg = '';
        if (filesList.length > 1) {
          fileStatusMsg = `Includes ${filesList.length} files.`;
        } else if (filesList.length === 1) {
          fileStatusMsg = `Includes file: ${filesList[0].fileName}.`;
        }

        const isBurnOnRead = data.burnOnRead === true;

        if (isBurnOnRead) {
          const hasFiles = data.hasFile || (data.files && data.files.length > 0);
          const gracePeriodMs = hasFiles ? 15 * 60 * 1000 : 5 * 60 * 1000;
          const graceMins = Math.round(gracePeriodMs / 60000);
          if (!data.isBurned) {
            setStatus({ type: 'idle', message: '' });
            try {
              await updateDoc(docRef, {
                isBurned: true,
                retrievedAt: serverTimestamp()
              });
            } catch (e) {
              console.error("Failed to mark clip as burned:", e);
            }
          } else {
            const secondsLeft = Math.max(0, Math.ceil((gracePeriodMs - (nowMillis - data.retrievedAt.toMillis())) / 1000));
            setStatus({ type: 'idle', message: '' });
          }
        } else {
          setStatus({ type: 'idle', message: '' });
          try {
            await updateDoc(docRef, {
              viewCount: (data.viewCount || 0) + 1
            });
          } catch (e) {
            console.error("Failed to update view count:", e);
          }
        }
        
        setIsLinkUnavailable(false);
        setInputCode('');
      } else {
        setIsLinkUnavailable(false);
        setStatus({ type: 'error', message: 'Invalid or expired code.' });
      }
    } catch (err) {
      setIsLinkUnavailable(false);
      setStatus({ type: 'error', message: 'Invalid or expired code.' });
    }
  };

  const handleSubmitContribution = async () => {
    if (!contributorName.trim()) {
      setStatus({ type: 'error', message: 'Please enter your name or student ID.' });
      return;
    }
    if (contributorFiles.length === 0) {
      setStatus({ type: 'error', message: 'Please select at least one file to submit.' });
      return;
    }

    const targetCode = inputCode.trim() || retrievedClip?.id || retrievedClip?.code;
    if (!targetCode) {
      setStatus({ type: 'error', message: 'Missing collection code.' });
      return;
    }

    const totalBytes = contributorFiles.reduce((sum, f) => sum + f.size, 0);
    const maxAllowedSize = 50 * 1024 * 1024;
    if (totalBytes > maxAllowedSize) {
      setStatus({ type: 'error', message: `Submission too large (${(totalBytes / (1024 * 1024)).toFixed(1)}MB total). Max 50MB allowed.` });
      return;
    }

    setTransferProgress({
      totalBytes,
      bytesTransferred: 0,
      percent: 0,
      status: 'uploading',
      fileName: contributorFiles.length === 1 ? contributorFiles[0].name : `${contributorFiles.length} files`,
      fileCount: contributorFiles.length
    });
    setStatus({ type: 'loading', message: `Uploading ${contributorFiles.length} file(s) to collection...` });

    try {
      let uploadedFiles: any[] = [];

      // Primary Engine: Fast XHR upload via Express /api/upload with live byte telemetry
      try {
        const formData = new FormData();
        contributorFiles.forEach(f => formData.append('files', f));
        const token = await auth.currentUser?.getIdToken();

        uploadedFiles = await new Promise<any[]>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const currentTransferred = e.loaded;
              const currentPercent = Math.min(99, Math.round((currentTransferred / (totalBytes || e.total || 1)) * 100));
              setTransferProgress(prev => prev ? {
                ...prev,
                bytesTransferred: currentTransferred,
                percent: currentPercent,
                status: 'uploading'
              } : null);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                if (data.files && data.files.length > 0) {
                  resolve(data.files.map((f: any) => ({
                    fileName: f.fileName,
                    fileType: f.fileType,
                    fileSize: f.fileSize,
                    downloadUrl: f.downloadUrl.startsWith('/') ? `${window.location.origin}${f.downloadUrl}` : f.downloadUrl
                  })));
                } else {
                  reject(new Error("No files returned from server"));
                }
              } catch (err) {
                reject(err);
              }
            } else {
              reject(new Error(`Server upload HTTP ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('XHR upload error'));
          xhr.ontimeout = () => reject(new Error('XHR upload timeout'));
          xhr.timeout = 300000; // 5 minute upload window for large files

          xhr.open('POST', '/api/upload');
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.send(formData);
        });
      } catch (err) {
        console.warn("Contribution Express upload notice, using Firebase Storage fallback:", err);
      }

      // Fallback Engine: Firebase Storage Resumable Stream (with 15s timeout safeguard against iframe CORS hangs)
      if (uploadedFiles.length === 0) {
        const bytesPerFile = new Array(contributorFiles.length).fill(0);
        activeUploadTasksRef.current = [];

        uploadedFiles = await Promise.all(
          contributorFiles.map((file, index) => {
            return new Promise<any>((resolve, reject) => {
              const storageTimeout = setTimeout(() => {
                reject(new Error("Storage upload timed out. Please refresh or try again."));
              }, 300000); // 5 minute window for larger uploads

              const fileRef = ref(storage, `clips/${targetCode}/submissions/${Date.now()}_${file.name}`);
              const uploadTask = uploadBytesResumable(fileRef, file);
              activeUploadTasksRef.current.push(uploadTask);

              uploadTask.on(
                'state_changed',
                (snapshot) => {
                  bytesPerFile[index] = snapshot.bytesTransferred;
                  const currentTransferred = bytesPerFile.reduce((a, b) => a + b, 0);
                  const currentPercent = Math.min(99, Math.round((currentTransferred / (totalBytes || 1)) * 100));
                  setTransferProgress(prev => prev ? {
                    ...prev,
                    bytesTransferred: currentTransferred,
                    percent: currentPercent,
                    status: 'uploading'
                  } : null);
                },
                (err) => {
                  clearTimeout(storageTimeout);
                  reject(err);
                },
                async () => {
                  clearTimeout(storageTimeout);
                  try {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({
                      fileName: file.name,
                      fileType: file.type || 'application/octet-stream',
                      fileSize: file.size,
                      downloadUrl
                    });
                  } catch (e) {
                    reject(e);
                  }
                }
              );
            });
          })
        );
      }

      const newSubmission = {
        contributorName: contributorName.trim(),
        submittedAt: new Date().toISOString(),
        files: uploadedFiles
      };

      const docRef = doc(db, 'clips', targetCode);
      await updateDoc(docRef, {
        submissions: arrayUnion(newSubmission),
        submissionCount: (retrievedClip?.submissionCount || 0) + 1
      });

      setTransferProgress(prev => prev ? {
        ...prev,
        bytesTransferred: totalBytes,
        percent: 100,
        status: 'ready'
      } : null);

      setStatus({ type: 'success', message: 'Submission uploaded successfully!' });
      setContributorFiles([]);
      setContributorName('');
      
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRetrievedClip({ id: docSnap.id, ...docSnap.data() });
      }
    } catch (e: any) {
      setTransferProgress(prev => prev ? { ...prev, status: 'error' } : null);
      setStatus({ type: 'error', message: e?.message || 'Failed to submit.' });
    }
  };

  const handleReactivate = async (clipId: string) => {
    try {
      setStatus({ type: 'loading', message: 'Reactivating clip...' });
      
      // Set local state FIRST to prevent disappearance
      const reactivateDurationSeconds = 900; // 15 minutes
      setReactivatingClips(prev => ({ ...prev, [clipId]: reactivateDurationSeconds }));
      
      const newExpiration = new Date(Date.now() + reactivateDurationSeconds * 1000);
      await updateDoc(doc(db, 'clips', clipId), {
        expiresAt: Timestamp.fromDate(newExpiration)
      });
      
      setStatus({ type: 'success', message: `Clip ${clipId} reactivated! Active for 15 minutes in the GET tab.` });
    } catch (err) {
      // Rollback local state if it fails
      setReactivatingClips(prev => {
        const next = { ...prev };
        delete next[clipId];
        return next;
      });
      handleFirestoreError(err, OperationType.UPDATE, `clips/${clipId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {authLoading ? (
        <div className="fixed inset-0 bg-[#E4E3E0] flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : (
        <>
          <AnimatePresence>
            {!user && !isGuest && <LandingPage onLogin={handleLogin} onGuest={handleGuestEnter} />}
          </AnimatePresence>
          {/* Header */}
      <header className="fixed top-0 left-0 right-0 border-b border-[#141414] p-2 sm:p-4 lg:px-8 flex justify-between items-center relative bg-[#E4E3E0]/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <SendarroLogo onClick={() => setCurrentView('app')} className="h-10 sm:h-12 md:h-14 max-h-14" />
        </div>

        <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 font-serif italic text-base sm:text-lg font-medium text-neutral-900 tracking-wide">
          <button 
            onClick={() => setCurrentView('app')} 
            className={`hover:text-black transition-colors cursor-pointer ${currentView === 'app' ? 'underline underline-offset-8 text-black font-semibold' : 'text-neutral-700'}`}
          >
            Transfer
          </button>
          <button 
            onClick={() => setCurrentView('product')} 
            className={`hover:text-black transition-colors cursor-pointer ${currentView === 'product' ? 'underline underline-offset-8 text-black font-semibold' : 'text-neutral-700'}`}
          >
            {t.product}
          </button>
          <button 
            onClick={() => setCurrentView('pricing')} 
            className={`hover:text-black transition-colors cursor-pointer ${currentView === 'pricing' ? 'underline underline-offset-8 text-black font-semibold' : 'text-neutral-700'}`}
          >
            {t.pricing}
          </button>
        </nav>
        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSelector currentLang={currentLang} onLanguageChange={setCurrentLang} />
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              {tier !== 'promax' && (
                <button 
                  onClick={() => setCurrentView('pricing')}
                  className="text-[#141414] hover:text-black text-xs sm:text-sm font-semibold underline decoration-emerald-500 decoration-2 underline-offset-4 transition-colors cursor-pointer"
                >
                  {tier === 'pro' ? 'Go Pro Max' : 'Upgrade'}
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[11px] font-bold uppercase tracking-wider leading-none flex items-center justify-end gap-1 text-[#141414]">
                    {user.displayName}
                    {isPro && <Zap className={`w-2.5 h-2.5 ${isProMax ? 'text-blue-600 fill-blue-600' : 'text-emerald-600 fill-emerald-600'}`} />}
                  </div>
                  <div className="text-[10px] text-neutral-600 font-mono font-medium">{user.email}</div>
                </div>
                
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-[#141414] rounded-sm opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <div className="relative w-9 h-9 border-2 border-[#141414] rounded-sm overflow-hidden shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all">
                    <img 
                      src={user.photoURL || ''} 
                      alt="" 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {isPro && (
                      <div className={`absolute bottom-0 right-0 border-t border-l border-[#141414] p-0.5 ${isProMax ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                        <Zap className="w-2 h-2 text-black fill-black" />
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="ml-1 p-2 border border-transparent hover:border-[#141414] hover:bg-white rounded-sm transition-all group cursor-pointer"
                  title={t.logout}
                >
                  <X className="w-4 h-4 text-neutral-600 group-hover:text-neutral-900 transition-colors" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setShowLoginModal(true)}
                className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider border-b-2 border-[#141414] pb-0.5 hover:text-neutral-600 transition-colors whitespace-nowrap cursor-pointer text-center"
              >
                {t.login}
              </button>
            </div>
          )}
        </div>
      </header>

          {/* Login Modal */}
          <AnimatePresence>
            {showLoginModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/40 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-sm rounded-sm p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative"
                >
                  <button 
                    onClick={() => setShowLoginModal(false)}
                    className="absolute top-4 right-4 p-2 hover:bg-[#141414]/5 rounded-sm transition-colors text-neutral-700 hover:text-neutral-950"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="space-y-6 text-center">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-[#141414]">Login</h2>
                      <button 
                        onClick={handleLogin}
                        className="w-full bg-white border-2 border-[#141414] py-3 rounded-sm font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#141414]/5 transition-all cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign in with Google
                      </button>
                    <p className="text-xs text-neutral-700">
                      By signing up, you accept our <button className="underline font-bold text-neutral-900 cursor-pointer" onClick={() => setShowTermsModal(true)}>terms and conditions</button>.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cloud Storage Integration Modal */}
          <IntegrationModal 
            isOpen={!!activeIntegration} 
            onClose={() => setActiveIntegration(null)} 
            service={activeIntegration} 
            onIntegrate={() => {
              const currentService = activeIntegration;
              setActiveIntegration(null);
              if (currentService === 'drive') {
                localStorage.setItem('sendarro_drive_connected', 'true');
                handleConnectDrive();
              } else if (currentService === 'dropbox') {
                localStorage.setItem('sendarro_dropbox_connected', 'true');
                handleConnectDropbox();
              }
            }}
          />

          {/* Google Drive Picker Modal */}
          <GoogleDrivePickerModal
            isOpen={showDrivePicker}
            onClose={() => setShowDrivePicker(false)}
            token={driveToken}
            onRequestConnect={handleRequestDriveConnect}
            onUseNativePicker={handleOpenNativeDrivePicker}
            onFilesSelected={(files) => {
              addIncomingFiles(files);
              setShareMode('file');
              setIsSendExpanded(true);
              setStatus({
                type: 'success',
                message: `Added ${files.length} file${files.length === 1 ? '' : 's'} from Google Drive!`
              });
            }}
            onLinksSelected={(links: PickedDriveLink[]) => {
              const formatted = links.map((l) => `${l.name}: ${l.url}`).join('\n');
              setManualText((prev) => (prev ? `${prev}\n${formatted}` : formatted));
              setShareMode('text');
              setIsSendExpanded(true);
              setStatus({
                type: 'success',
                message: `Attached ${links.length} Google Drive link${links.length === 1 ? '' : 's'}!`
              });
            }}
          />

          {/* Terms and Conditions Modal */}
          <AnimatePresence>
            {showTermsModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#141414]/40 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-sm rounded-sm p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative"
                >
                  <h2 className="text-xl font-bold uppercase tracking-widest mb-4 text-[#141414]">Terms and Conditions</h2>
                  <div className="text-xs text-neutral-700 text-left space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar border border-[#141414]/15 p-3 rounded-sm mb-4" style={{scrollbarWidth: 'thin'}}>
                    <p className="font-bold text-neutral-900">Terms and Conditions for Sendarro</p>
                    <p>Welcome to Sendarro. By using our service, you agree to the following terms.</p>
                    <p>1. Service Usage: Sendarro provides temporary storage for text and files. We are not responsible for the loss of data.</p>
                    <p>2. Data Privacy: Your clips are temporary. Pro Max users get extra protection but data is still transient.</p>
                    <p>3. Acceptable Use: You agree not to upload illegal, copyrighted, or malicious content.</p>
                    <p>4. Pro Accounts: Subscription fees are non-refundable. Features are subject to change.</p>
                    <p>We reserve the right to terminate access for misuse.</p>
                  </div>
                  <button 
                    onClick={() => setShowTermsModal(false)}
                    className="w-full bg-[#141414] text-[#E4E3E0] py-2.5 rounded-sm font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>


      {currentView === 'product' ? (
        <ProductPage 
          onBackToApp={() => setCurrentView('app')} 
          onNavigateToPricing={() => setCurrentView('pricing')} 
          onOpenAuth={() => setShowLoginModal(true)} 
          currentLang={currentLang}
        />
      ) : currentView === 'pricing' ? (
        <PricingPage 
          onBackToApp={() => setCurrentView('app')} 
          onNavigateToProduct={() => setCurrentView('product')} 
          onUpgrade={handleCheckout} 
          onRestorePurchases={handleRestorePurchases} 
          tier={tier} 
          currentLang={currentLang}
        />
      ) : (
        <main className="w-full max-w-md mx-auto sm:ml-8 lg:ml-16 sm:mr-auto p-4 sm:p-4 lg:px-6 pt-6 sm:pt-16">
        {/* API Blocked Warning */}
        <AnimatePresence>
          {isApiBlocked && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 sm:mb-8 bg-red-50 border border-red-200 p-4 rounded-sm flex flex-col sm:flex-row items-center gap-4 text-red-800 overflow-hidden"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div className="flex-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Security cookie blocked. You must open the app in a new tab to authenticate your session.
              </div>
              <button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="bg-red-800 text-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-red-700 transition-colors shrink-0 w-full sm:w-auto"
              >
                Open in New Tab
              </button>
            </motion.div>
          )}
        </AnimatePresence>



        {/* Main Workspace */}
        <div className="w-full max-w-full space-y-5">
          {/* Mobile Only Tab Toggle Bar (SHARE / GET) - Exact match to screenshot */}
          <div className="flex sm:hidden border border-[#141414] bg-[#E4E3E0] rounded-sm overflow-hidden mb-5">
            <button 
              onClick={() => setActiveTab('share')}
              className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'share' 
                  ? 'bg-[#141414] text-[#E4E3E0]' 
                  : 'bg-[#E4E3E0] text-[#141414] hover:bg-neutral-200'
              }`}
            >
              SHARE
            </button>
            <button 
              onClick={() => setActiveTab('get')}
              className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-widest transition-all cursor-pointer border-l border-[#141414] ${
                activeTab === 'get' 
                  ? 'bg-[#141414] text-[#E4E3E0]' 
                  : 'bg-[#E4E3E0] text-[#141414] hover:bg-neutral-200'
              }`}
            >
              GET
            </button>
          </div>

          {/* SEND BOX */}
          <div className={`SendBox bg-white border border-[#141414] p-5 sm:p-6 rounded-none sm:rounded-md shadow-none sm:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden ${activeTab === 'share' ? 'block' : 'hidden sm:block'}`}>
            {!code ? (
              <>
                {/* Desktop Initial Clickzone (when not expanded on desktop) */}
                <div className="hidden sm:block">
                  {(!isSendExpanded && selectedFiles.length === 0 && !manualText.trim()) && (
                    <div 
                      onClick={() => {
                        setIsSendExpanded(true);
                        if (shareMode === 'file' || shareMode === 'collection') {
                          const fileInput = document.getElementById('send-clickzone-file-input') as HTMLInputElement;
                          if (fileInput) fileInput.click();
                        }
                      }}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          setShareMode('file');
                          setIsSendExpanded(true);
                          addIncomingFiles(Array.from(e.dataTransfer.files));
                        }
                      }}
                      className={`border-2 border-dashed rounded-md p-5 sm:p-7 text-center cursor-pointer transition-all bg-[#F9F9F8] hover:bg-neutral-100 group relative overflow-hidden shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] ${
                        isDragging ? 'border-[#141414] bg-neutral-200 scale-[1.01]' : 'border-[#141414]/40'
                      }`}
                    >
                      <input 
                        type="file" 
                        id="send-clickzone-file-input"
                        multiple 
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setShareMode('file');
                            setIsSendExpanded(true);
                            addIncomingFiles(Array.from(e.target.files));
                            e.target.value = '';
                          }
                        }}
                        className="hidden" 
                      />

                      <div className="space-y-2 pointer-events-none">
                        <div className="w-11 h-11 sm:w-13 sm:h-13 bg-[#141414] text-[#E4E3E0] rounded-full mx-auto flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform">
                          <span className="text-xl sm:text-2xl font-light">+</span>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xl sm:text-2xl font-serif italic font-bold tracking-tight text-[#141414]">Send</p>
                          <p className="text-[10px] sm:text-[11px] uppercase tracking-wider font-mono text-neutral-500 font-semibold">
                            Click to attach files, text, or drop here
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Sharing Workspace Form: Always shown on mobile, and shown on desktop when expanded */}
                <div className={`${(!isSendExpanded && selectedFiles.length === 0 && !manualText.trim()) ? 'block sm:hidden' : 'block'} space-y-5 text-center`}>
                  {/* Title & Subtitle matching Screenshot */}
                  <div className="space-y-2 pt-2">
                    <h2 className="text-2xl sm:text-3xl font-serif italic font-normal text-[#141414]">Share a clip</h2>
                    <p className="text-xs text-neutral-600 max-w-xs mx-auto leading-relaxed">
                      Paste your content below to generate a temporary code.
                    </p>
                  </div>

                  {/* Mode Tabs: TEXT CLIP / FILE CLIP / COLLECTION (for Pro Max) */}
                  <div className="flex border-b border-[#141414]/20 pt-1">
                    <button 
                      onClick={() => setShareMode('text')}
                      className={`flex-1 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        shareMode === 'text' 
                          ? 'border-b-2 border-[#141414] text-[#141414]' 
                          : 'text-neutral-400 hover:text-neutral-700'
                      }`}
                    >
                      TEXT CLIP
                    </button>
                    <button 
                      onClick={() => setShareMode('file')}
                      className={`flex-1 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        shareMode === 'file' 
                          ? 'border-b-2 border-[#141414] text-[#141414]' 
                          : 'text-neutral-400 hover:text-neutral-700'
                      }`}
                    >
                      FILE CLIP {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                    </button>
                    {isProMax && (
                      <button 
                        onClick={() => setShareMode('collection')}
                        className={`flex-1 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          shareMode === 'collection' 
                            ? 'border-b-2 border-blue-600 text-blue-700' 
                            : 'text-blue-500 hover:text-blue-800'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-blue-600" />
                        COLLECTION
                      </button>
                    )}
                  </div>

                  {/* Content Inputs */}
                  <div className="space-y-4 text-left">
                    {shareMode === 'text' && (
                      <div className="relative">
                        <textarea
                          value={manualText}
                          maxLength={isPro ? 100000 : 10000}
                          onChange={(e) => {
                            const maxChars = isPro ? 100000 : 10000;
                            setManualText(e.target.value);
                            if (e.target.value.length >= maxChars) {
                              setStatus({ type: 'error', message: `Character limit reached (${maxChars.toLocaleString()}). ${!isPro ? 'Upgrade to Pro for 100k.' : ''}` });
                            }
                          }}
                          placeholder="Paste your content here..."
                          className="w-full h-56 sm:h-52 p-4 border border-[#141414] rounded-sm font-mono text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#141414] resize-none bg-white"
                        />
                        <div className="absolute bottom-3 left-4 text-[11px] font-mono text-neutral-400">
                          {manualText.length.toLocaleString()} / {(isPro ? 100000 : 10000).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {shareMode === 'file' && (
                      <div className="space-y-3">
                        <input 
                          type="file" 
                          id="file-upload" 
                          multiple
                          className="hidden" 
                          onChange={handleFileSelect}
                        />

                        {selectedFiles.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-neutral-800 font-mono">
                              <span>Attached Files ({selectedFiles.length})</span>
                              <span className={`text-xs ${selectedFiles.reduce((acc, f) => acc + f.size, 0) > (isProMax ? 50 : 10) * 1024 * 1024 ? 'text-red-600 font-bold' : 'text-neutral-600'}`}>
                                {(selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB / {isProMax ? 50 : 10} MB
                              </span>
                            </div>

                            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                              {selectedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2.5 bg-blue-50/70 border border-blue-200 rounded-sm">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                    <div className="min-w-0 flex-1 truncate text-xs font-mono text-[#141414]">{file.name}</div>
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => removeFile(idx)}
                                    className="p-1 hover:bg-red-100 text-red-600 rounded-sm transition-colors ml-2 shrink-0 cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <label 
                          htmlFor="file-upload"
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              const dropped = Array.from(e.dataTransfer.files) as File[];
                              addIncomingFiles(dropped);
                            }
                          }}
                          className={`w-full min-h-[140px] p-6 border-2 border-dashed border-[#141414]/30 rounded-sm flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all hover:bg-neutral-50 ${
                            isDragging ? 'bg-blue-50 border-blue-500' : 'bg-white'
                          }`}
                        >
                          <Upload className="w-6 h-6 text-neutral-600" />
                          <div className="text-center space-y-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#141414] font-mono">
                              {selectedFiles.length > 0 ? '+ Add More Files' : 'Select files from device'}
                            </p>
                            <p className="text-[10px] text-neutral-500 font-mono">
                              MAX {isProMax ? '50MB' : '10MB'} • ALL FILE TYPES
                            </p>
                          </div>
                        </label>

                        {/* Cloud Storage Integration Buttons */}
                        <div className="pt-3 border-t border-[#141414]/15 space-y-2">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 text-center">Or share from cloud storage</p>
                          <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={() => handleCloudServiceClick('drive')} 
                              className="flex-1 py-2 px-2.5 border border-[#141414] rounded-sm bg-white hover:bg-neutral-100 flex items-center justify-center gap-2 text-[11px] font-mono font-bold transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-x-[1px] active:translate-y-[1px]"
                            >
                              <GoogleDriveIcon className="w-4 h-4" />
                              <span>Drive</span>
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleCloudServiceClick('dropbox')} 
                              className="flex-1 py-2 px-2.5 border border-[#141414] rounded-sm bg-white hover:bg-neutral-100 flex items-center justify-center gap-2 text-[11px] font-mono font-bold transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-x-[1px] active:translate-y-[1px]"
                            >
                              <DropboxIcon className="w-4 h-4" />
                              <span>Dropbox</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {shareMode === 'collection' && isProMax && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-sm space-y-3">
                        <div className="flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-wider font-mono">
                          <Zap className="w-4 h-4 fill-blue-600 text-blue-600" />
                          <span>Pro Max Collection Box</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Collection Title or Instructions"
                          value={manualText}
                          onChange={(e) => setManualText(e.target.value)}
                          className="w-full p-3 border border-[#141414] rounded-sm font-mono text-xs bg-white"
                        />
                      </div>
                    )}

                    {isPro && (
                      <div className="bg-[#141414]/5 p-3 rounded-sm space-y-3 text-left border border-[#141414]/15">
                        <button 
                          type="button"
                          onClick={() => setShowCustomCodeDropdown(!showCustomCodeDropdown)}
                          className="flex justify-between w-full font-bold text-neutral-700 hover:text-neutral-950 uppercase text-[11px] tracking-wider cursor-pointer font-mono"
                        >
                          <span>Pro Features (Alias & Expiration)</span>
                          <span>{showCustomCodeDropdown ? '▲' : '▼'}</span>
                        </button>
                        {showCustomCodeDropdown && (
                          <div className="space-y-3 pt-1">
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-700 font-mono">Custom Alias Code</label>
                              <input 
                                type="text"
                                value={customCodeInput}
                                onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                                placeholder="MY-CUSTOM-CLIP"
                                className="w-full p-2 border border-[#141414] rounded-sm font-mono text-xs bg-white"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-700 font-mono">Expiration Time</label>
                              <div className="flex gap-2">
                                {[
                                  { label: '15m', value: 900 },
                                  { label: '30m', value: 1800 },
                                  { label: '1h', value: 3600 },
                                  { label: '24h', value: 86400 }
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setExpirationOption(opt.value)}
                                    className={`flex-1 py-1.5 text-[10px] font-mono uppercase font-bold border rounded-sm transition-all cursor-pointer ${
                                      expirationOption === opt.value 
                                        ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]' 
                                        : 'bg-white text-neutral-700 border-[#141414]/25 hover:border-[#141414]'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expiration text matching screenshot */}
                  <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-neutral-500 pt-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Code expires in {formatTime(isPro ? expirationOption : (selectedFiles.length > 0 || shareMode === 'file' ? FILE_EXPIRATION_SECONDS : EXPIRATION_SECONDS))}</span>
                  </div>

                  {/* Generate Code button matching screenshot */}
                  <button 
                    onClick={handleShare}
                    disabled={status.type === 'loading' || (!manualText.trim() && selectedFiles.length === 0)}
                    className="w-full bg-[#737373] hover:bg-[#525252] text-white py-4 rounded-sm font-mono font-bold uppercase tracking-[0.15em] text-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
                  >
                    {status.type === 'loading' ? <RefreshCw className="animate-spin w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    <span>GENERATE CODE</span>
                  </button>

                  {/* Desktop close options button */}
                  <div className="hidden sm:block pt-1">
                    <button 
                      onClick={() => {
                        setSelectedFiles([]);
                        setManualText('');
                        setIsSendExpanded(false);
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-900 font-mono underline cursor-pointer"
                    >
                      Cancel / Close
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Generated Code View */
              <div className="space-y-8 text-center">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                  <div className="space-y-4 text-center md:text-left">
                    <div className="text-xs uppercase tracking-wider font-bold text-neutral-700 font-mono">Your Key Code</div>
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <div className="text-4xl sm:text-6xl font-bold tracking-tighter font-mono text-[#141414]">{code}</div>
                      <button 
                        onClick={() => handleCopyCode(code)}
                        className={`p-3 rounded-sm transition-all cursor-pointer ${
                          copyCodeSuccess 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-[#141414] text-[#E4E3E0] hover:scale-110'
                        }`}
                        title="Copy code to clipboard"
                      >
                        {copyCodeSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-1 bg-[#141414] rounded-sm blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative p-4 bg-white border-2 border-[#141414] rounded-sm shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] transition-all">
                      <QRCodeSVG 
                        value={`${window.location.origin}/?code=${code}`} 
                        size={140} 
                        level="H" 
                        includeMargin={false}
                        className="w-full h-full"
                      />
                      <div className="absolute -top-2 -right-2 bg-[#141414] text-[#E4E3E0] p-1 rounded-sm">
                        <QrCode className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center gap-2 text-neutral-700">
                    <Clock className="w-4 h-4 text-neutral-600" />
                    <span className="text-sm font-mono uppercase tracking-wider font-medium">Expires in {formatTime(timeLeft)}</span>
                  </div>

                  <button 
                    onClick={() => {
                      const url = `${window.location.origin}/?code=${code}`;
                      navigator.clipboard.writeText(url);
                      setStatus({ type: 'success', message: 'Direct link copied!' });
                    }}
                    className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-sm hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Copy Direct Link
                  </button>
                </div>

                <button 
                  onClick={() => setCode(null)}
                  className="text-xs uppercase tracking-wider font-bold border-b border-[#141414] pb-1 text-neutral-700 hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  Cancel / Share New
                </button>
              </div>
            )}
          </div>

          {/* RECEIVE BOX */}
          <div className={`ReceiveBox bg-white border border-[#141414] p-6 sm:p-8 rounded-none sm:rounded-md shadow-none sm:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden space-y-6 text-center ${activeTab === 'get' ? 'block' : 'hidden sm:block'}`}>
            <div className="Receive">
              <div className="Main">
                <div className="transfer-box-inner space-y-6">
                  <div className="receive-main-header space-y-2 text-center pt-2">
                    <h3 className="title3 bold text-2xl sm:text-3xl font-serif italic font-normal text-[#141414]">Retrieve a clip</h3>
                    <p className="text-xs text-neutral-600 max-w-xs mx-auto leading-relaxed">
                      Enter the code from your other device to fetch and copy the content.
                    </p>
                  </div>
                  <div className="receive-form space-y-5">
                    <div className="relative">
                      <input 
                        className="border-box w-full border-b-2 border-[#141414] bg-transparent py-4 font-mono text-xl sm:text-2xl font-normal text-center uppercase placeholder:text-neutral-300 focus:outline-none focus:border-[#141414] tracking-widest" 
                        name="value" 
                        type="text" 
                        placeholder="CODE" 
                        maxLength={20}
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                      />
                      {inputCode && (
                        <button 
                          type="button"
                          onClick={() => { setInputCode(''); setStatus({ type: 'idle', message: '' }); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-200 rounded-full text-[#141414] transition-colors cursor-pointer"
                          title="Clear"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <button 
                      aria-label="Receive" 
                      onClick={handleGet}
                      disabled={status.type === 'loading' || inputCode.length < 3}
                      className="IconButton receive-button regular w-full bg-[#737373] hover:bg-[#525252] text-white py-4 rounded-sm font-mono font-bold uppercase tracking-[0.15em] text-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-none"
                    >
                      {status.type === 'loading' ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>GET CLIP</span>
                        </>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowScannerModal(true)}
                      className="w-full border-2 border-[#141414] bg-white hover:bg-[#141414]/5 text-[#141414] py-4 rounded-sm font-mono font-bold uppercase tracking-[0.15em] text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>SCAN QR CODE</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {Object.values(reactivatingClips).some((v: number) => v > 0) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-blue-700 font-mono text-xs uppercase tracking-wider font-semibold pt-1"
              >
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Reactivated clip is currently active in Vault</span>
              </motion.div>
            )}

            {retrievedClip && (
              <div className="space-y-4 pt-4 border-t border-[#141414]/15">
                {/* Pill Progress Loader FIRST */}
                {((retrievedClip.files && retrievedClip.files.length > 0) || retrievedClip.hasFile) && (
                  <div className="bg-white p-4 border border-[#141414]/15 rounded-md space-y-2">
                    <div className="relative w-full h-12 bg-blue-50 border-2 border-blue-200 rounded-full overflow-hidden flex items-center justify-between px-6 shadow-inner">
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${retrievalProgress?.percent || 0}%` }}
                      />
                      <span className={`relative z-10 font-bold text-xs sm:text-sm flex items-center gap-2 ${retrievalProgress?.percent && retrievalProgress.percent > 40 ? 'text-white' : 'text-blue-900'}`}>
                        {!retrievalProgress?.isComplete && (
                          <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                        )}
                        {retrievalProgress?.isComplete ? "File Link Ready" : "File Stream"}
                      </span>
                      <span className={`relative z-10 font-mono font-extrabold text-sm sm:text-lg ${retrievalProgress?.percent && retrievalProgress.percent > 80 ? 'text-white' : 'text-blue-900'}`}>
                        {retrievalProgress?.percent || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-700 px-1 font-medium">
                      <span>Total {retrievedClip.files?.length || 1} files</span>
                      <span>
                        {(!retrievalProgress || retrievalProgress.loadedBytes === 0) ? (
                          <strong className="text-red-600 font-bold">0 B</strong>
                        ) : (
                          <strong className={retrievalProgress?.isComplete ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>
                            {formatBytes(retrievalProgress.loadedBytes)}
                          </strong>
                        )}
                        {" / "}
                        {(
                          (retrievedClip.files
                            ? retrievedClip.files.reduce((acc: number, f: any) => acc + (f.fileSize || 0), 0)
                            : (retrievedClip.fileSize || 0)) / (1024 * 1024)
                        ).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                )}

                {/* Clip Retrieved Box */}
                {(!((retrievedClip.files && retrievedClip.files.length > 0) || retrievedClip.hasFile) || retrievalProgress?.isComplete) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-2 border-[#141414] rounded-sm overflow-hidden"
                  >
                    <div className="bg-[#141414] text-[#E4E3E0] p-3.5 flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs uppercase tracking-wider font-bold font-mono">Clip Retrieved</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => { 
                            if (receiverUnsubRef.current) { receiverUnsubRef.current(); receiverUnsubRef.current = null; }
                            setRetrievedClip(null); 
                            setStatus({ type: 'idle', message: '' }); 
                          }}
                          className="flex items-center gap-1 bg-[#E4E3E0]/20 hover:bg-[#E4E3E0]/30 text-[#E4E3E0] px-2 py-1 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
                          title="Remove Code & Close"
                        >
                          <X className="w-4 h-4" />
                          <span>Close</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-6 bg-white space-y-6">
                      {retrievedClip.isCollection ? (
                        <div className="space-y-6 text-left">
                          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-sm space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 font-mono">Pro Max Collection Box</span>
                              <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-sm font-bold">
                                {retrievedClip.submissions?.length || 0} Submissions
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-[#141414]">{retrievedClip.content}</h3>
                          </div>

                          {user && user.uid === retrievedClip.authorUid ? (
                            <div className="space-y-4">
                              <div className="text-xs font-bold uppercase tracking-wider text-neutral-800">Incoming Submissions ({retrievedClip.submissions?.length || 0})</div>
                              {(!retrievedClip.submissions || retrievedClip.submissions.length === 0) ? (
                                <div className="p-6 text-center border border-dashed border-[#141414]/20 rounded-sm text-neutral-600 text-xs font-mono">
                                  No submissions yet. Share your collection code with students or teammates!
                                </div>
                              ) : (
                                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                                  {retrievedClip.submissions.map((sub: any, sIdx: number) => (
                                    <div key={sIdx} className="bg-white border-2 border-[#141414] p-4 rounded-sm shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold font-mono text-blue-700">{sub.contributorName}</span>
                                        <span className="text-[10px] text-neutral-600 font-mono font-medium">{new Date(sub.submittedAt).toLocaleTimeString()}</span>
                                      </div>
                                      <div className="space-y-2 pt-1">
                                        {sub.files.map((file: any, fIdx: number) => (
                                          <div key={fIdx} className="flex items-center justify-between bg-blue-50/60 p-2.5 rounded-sm border border-blue-200">
                                            <span className="text-xs font-bold truncate pr-2 text-[#141414]">{file.fileName}</span>
                                            <button 
                                              type="button"
                                              onClick={() => handleDownloadFile(file.downloadUrl || file.url, file.fileName, retrievedClip?.id)}
                                              className="bg-blue-600 text-white px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider shrink-0 hover:bg-blue-700 cursor-pointer"
                                            >
                                              Download
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4 bg-[#F9F9F8] border-2 border-[#141414] p-5 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                              <div className="space-y-1">
                                <label className="text-xs uppercase tracking-wider font-bold text-neutral-700">Your Name / Student ID *</label>
                                <input 
                                  type="text"
                                  placeholder="e.g. John Doe (ID: 45892)"
                                  value={contributorName}
                                  onChange={(e) => setContributorName(e.target.value)}
                                  className="w-full p-3 border border-[#141414] rounded-sm font-mono text-xs placeholder:text-neutral-400 focus:outline-none bg-white"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider font-bold text-neutral-700">Attach Files for Submission</label>
                                <input 
                                  type="file" 
                                  id="contrib-files" 
                                  multiple
                                  className="hidden" 
                                  onChange={(e) => {
                                    if (e.target.files) {
                                      setContributorFiles(Array.from(e.target.files));
                                    }
                                  }}
                                />
                                <label 
                                  htmlFor="contrib-files"
                                  className="border-2 border-dashed border-[#141414]/30 hover:border-[#141414] bg-white p-6 rounded-sm text-center cursor-pointer block transition-all"
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    <Share2 className="w-6 h-6 text-neutral-600" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#141414]">Click to browse or drop files</span>
                                    <span className="text-[10px] text-neutral-600 font-mono">Assignments, reports, media</span>
                                  </div>
                                </label>

                                {contributorFiles.length > 0 && (
                                  <div className="space-y-1.5 pt-2">
                                    {contributorFiles.map((f, i) => (
                                      <div key={i} className="flex items-center justify-between bg-white p-2 border border-[#141414]/20 rounded-sm text-xs font-mono">
                                        <span className="truncate pr-2 text-[#141414]">{f.name}</span>
                                        <span className="text-neutral-600 text-xs font-medium">{(f.size / 1024).toFixed(1)} KB</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <button 
                                onClick={handleSubmitContribution}
                                disabled={status.type === 'loading'}
                                className="w-full bg-[#141414] text-[#E4E3E0] py-3.5 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-[#141414]/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {status.type === 'loading' ? <RefreshCw className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                Submit to Collection
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {retrievedClip.files && retrievedClip.files.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-neutral-800">
                                <span>Attached Files ({retrievedClip.files.length})</span>
                                <span className="text-xs font-mono text-neutral-600 font-medium">
                                  {(retrievedClip.files.reduce((acc: number, f: any) => acc + (f.fileSize || 0), 0) / (1024 * 1024)).toFixed(2)} MB
                                </span>
                              </div>

                              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                {retrievedClip.files.map((file: any, idx: number) => {
                                  const fileLink = file.downloadUrl || file.url || retrievedClip.downloadUrl || '';
                                  return (
                                    <div key={idx} className="bg-blue-50 border-2 border-blue-200 p-3 sm:p-4 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[3px_3px_0px_0px_rgba(59,130,246,0.15)]">
                                      <div className="flex items-center gap-3 w-full sm:w-auto min-w-0 flex-1">
                                        <div className="w-10 h-10 bg-blue-100 border border-blue-200 rounded-sm flex items-center justify-center shrink-0">
                                          {file.fileType?.includes('video') ? (
                                            <Video className="w-5 h-5 text-blue-600" />
                                          ) : file.fileType?.includes('audio') ? (
                                            <Music className="w-5 h-5 text-blue-600" />
                                          ) : (
                                            <FileText className="w-5 h-5 text-blue-600" />
                                          )}
                                        </div>
                                        <div className="text-left min-w-0 flex-1">
                                          <div className="text-xs font-bold uppercase tracking-wider text-blue-700 truncate block">
                                            {file.fileName}
                                          </div>
                                          <div className="text-[10px] text-blue-900/80 font-mono font-medium">
                                            {(file.fileSize / (1024 * 1024)).toFixed(2)} MB • {file.fileType?.split('/').pop()?.toUpperCase()}
                                          </div>
                                        </div>
                                      </div>
                                      <button 
                                        type="button"
                                        onClick={() => handleDownloadFile(fileLink, file.fileName, retrievedClip?.id)}
                                        className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5 font-bold uppercase tracking-widest text-[9px] shadow-[2px_2px_0px_0px_rgba(30,58,138,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shrink-0 cursor-pointer"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        Download
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {(!retrievedClip.files || retrievedClip.files.length === 0) && retrievedClip.hasFile && (
                            <div className="bg-blue-50 border-2 border-blue-200 p-3 sm:p-5 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.2)]">
                              <div className="flex items-center gap-4 w-full sm:w-auto min-w-0 flex-1">
                                <div className="w-14 h-14 bg-blue-100 border border-blue-200 rounded-sm flex items-center justify-center shrink-0">
                                  {retrievedClip.fileType?.includes('video') ? (
                                    <Video className="w-7 h-7 text-blue-600" />
                                  ) : retrievedClip.fileType?.includes('audio') ? (
                                    <Music className="w-7 h-7 text-blue-600" />
                                  ) : (
                                    <FileText className="w-7 h-7 text-blue-600" />
                                  )}
                                </div>
                                <div className="text-left min-w-0 flex-1">
                                  <div className="text-xs font-bold uppercase tracking-wider text-blue-700 truncate block mb-1">
                                    {retrievedClip.fileName}
                                  </div>
                                  <div className="text-xs text-blue-900 font-mono font-medium bg-blue-100/70 inline-block px-2.5 py-0.5 rounded-sm">
                                    {(retrievedClip.fileSize / (1024 * 1024)).toFixed(2)} MB • {retrievedClip.fileType?.split('/').pop()?.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleDownloadFile(retrievedClip.downloadUrl || retrievedClip.url, retrievedClip.fileName, retrievedClip?.id)}
                                className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none shrink-0 cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                                Download Now
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {Boolean(retrievedClip.content && retrievedClip.content.trim() !== '' && retrievedClip.content !== 'Pro Max Collection Drop Box' && !retrievedClip.isCollection) && (
                        <div className="space-y-4">
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            <p className="text-sm font-mono whitespace-pre-wrap break-all text-neutral-900 font-medium">
                              {retrievedClip.content}
                            </p>
                          </div>

                          <div className="flex gap-3">
                            <button 
                              onClick={() => handleCopy(retrievedClip.content)}
                              className={`flex-1 py-3 rounded-sm font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                copySuccess 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90'
                              }`}
                            >
                              {copySuccess ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  Copy to Clipboard
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
          {/* Status Messages */}
          <AnimatePresence>
            {status.message && (
              <motion.div 
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(event, info) => {
                  if (Math.abs(info.offset.x) > 100) {
                    setStatus({ type: 'idle', message: '' });
                  }
                }}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 p-4 border-2 rounded-none shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] z-[100] cursor-grab active:cursor-grabbing ${
                  status.type === 'success' ? 'bg-white border-[#141414] text-[#141414]' : 
                  status.type === 'loading' ? 'bg-white border-[#141414] text-[#141414]' : 'bg-[#141414] border-red-500 text-white'
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" /> : 
                   status.type === 'loading' ? <RefreshCw className="w-5 h-5 shrink-0 text-neutral-400 animate-spin" /> : 
                   <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />}
                  <span className="flex-1 text-xs font-bold uppercase tracking-widest">{status.message.replace('[Upgrade Now]', '')}</span>
                  <button onClick={() => setStatus({ type: 'idle', message: '' })} className={`${status.type === 'loading' ? 'text-neutral-400' : 'text-[#141414]/50'} hover:text-[#141414] cursor-pointer`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                  {status.type === 'error' && status.message.includes('new tab') && (
                    <button 
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="bg-red-800 text-white px-3 py-1.5 rounded-sm hover:bg-red-700 transition-colors shrink-0 w-full sm:w-auto mt-2 sm:mt-0 cursor-pointer"
                    >
                      Open in New Tab
                    </button>
                  )}
                  {status.message.includes('[Upgrade Now]') && (
                    <button 
                      onClick={() => setCurrentView('pricing')}
                      className="bg-red-800 text-white px-3 py-1.5 rounded-sm hover:bg-red-700 transition-colors shrink-0 w-full sm:w-auto mt-2 sm:mt-0 cursor-pointer"
                    >
                      Upgrade Now
                    </button>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* Footer Info */}
      <footer className="w-full mt-12 sm:mt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="space-y-1.5">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] text-[#141414]">{t.securityTitle}</p>
              <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed font-normal">{t.securityDesc}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] text-[#141414]">{t.universalTitle}</p>
              <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed font-normal">{t.universalDesc}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] text-[#141414]">{t.speedTitle}</p>
              <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed font-normal">{t.speedDesc}</p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#141414]/15 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3 text-neutral-700">
              <Share2 className="w-3.5 h-3.5 text-neutral-800" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] text-neutral-800">Sendarro v2.5</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <LanguageSelector currentLang={currentLang} onLanguageChange={setCurrentLang} compact />
              <button 
                onClick={() => setShowOnboarding(true)}
                className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-neutral-950 transition-colors underline underline-offset-4 cursor-pointer"
              >
                {t.howItWorks}
              </button>
              <button 
                onClick={() => setShowLegalModal(true)}
                className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-neutral-950 transition-colors underline underline-offset-4 cursor-pointer"
              >
                {t.privacyTerms}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Background Grid Accent */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" 
           style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Background Grid Accent */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" 
           style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {/* Support Modal (Disabled) */}
        {/* Support Modal rendered here would be disabled anyway. */}


        {/* Scanner Modal */}
        <AnimatePresence>
          {showScannerModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/40 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-sm rounded-sm p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold uppercase tracking-widest">Scan QR</h2>
                  <button 
                    onClick={() => setShowScannerModal(false)}
                    className="p-2 hover:bg-[#141414]/5 rounded-sm transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div id="reader" className="border-2 border-[#141414] rounded-sm overflow-hidden" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legal Modal */}
        {showLegalModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-[#141414]/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#E4E3E0] border-2 border-[#141414] max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col rounded-sm shadow-2xl"
            >
              <div className="p-6 border-b border-[#141414] flex justify-between items-center bg-white">
                <h2 className="text-2xl font-serif italic font-bold">{t.legalInfoTitle}</h2>
                <button onClick={() => setShowLegalModal(false)} className="p-2 hover:bg-[#141414]/5 rounded-sm cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar space-y-8">
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">{t.termsOfService}</h3>
                  <div className="space-y-4 text-sm text-neutral-700 leading-relaxed font-mono">
                    <p>{t.tosLine1}</p>
                    <p>{t.tosLine2}</p>
                    <p>{t.tosLine3}</p>
                    <p>{t.tosLine4}</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">{t.privacyPolicy}</h3>
                  <div className="space-y-4 text-sm text-neutral-700 leading-relaxed font-mono">
                    <p>{t.privLine1}</p>
                    <p>{t.privLine2}</p>
                    <p>{t.privLine3}</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600">{t.cookiePolicy}</h3>
                  <div className="space-y-4 text-sm text-neutral-700 leading-relaxed font-mono">
                    <p>{t.cookieLine1}</p>
                  </div>
                </section>
              </div>
              <div className="p-6 border-t border-[#141414] bg-white flex justify-end">
                <button 
                  onClick={() => setShowLegalModal(false)}
                  className="bg-[#141414] text-[#E4E3E0] px-8 py-3 rounded-sm font-bold uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {t.understoodBtn}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Cookie Banner */}
        {showCookieBanner && (
          <motion.div 
            key="cookie-banner"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:max-w-sm z-[70]"
          >
            <div className="bg-[#141414] text-[#E4E3E0] p-6 rounded-sm shadow-2xl border border-white/10 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-sm flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest">{t.privacyTerms}</p>
                  <p className="text-xs text-neutral-300 leading-relaxed">{t.cookieLine1}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={acceptCookies}
                  className="flex-1 bg-white text-[#141414] py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors cursor-pointer"
                >
                  {t.understoodBtn}
                </button>
                <button 
                  onClick={() => setShowLegalModal(true)}
                  className="flex-1 border border-white/20 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {t.privacyTerms}
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && (user || isGuest) && (
          <Onboarding key="onboarding-modal" onComplete={completeOnboarding} currentLang={currentLang} />
        )}
      </AnimatePresence>

        </>
      )}

    </div>
  );
}
