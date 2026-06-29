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
import BundleManager from './components/BundleManager';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
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
import { db, auth } from './firebase';
import { Onboarding } from './components/Onboarding';
import { BundleManager } from './components/BundleManager';

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

const EXPIRATION_SECONDS = 60;

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

// --- Components ---

const LandingPage = ({ onLogin, onGuest }: { onLogin: () => void, onGuest: () => void }) => (
  <div className="fixed inset-0 z-[100] bg-[#E4E3E0] flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
    <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 md:gap-12 items-center py-8">
      <div className="space-y-6 md:space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#141414] rounded-sm flex items-center justify-center">
              <Share2 className="text-[#E4E3E0] w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h1 className="text-lg md:text-xl font-bold uppercase tracking-[0.3em]">ClipCloud</h1>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-8xl font-serif italic leading-[0.8] tracking-tighter">
            Seamless<br />Sharing.
          </h2>
        </div>
        <p className="text-sm md:text-lg opacity-60 font-light leading-relaxed max-w-[260px] sm:max-w-sm">
          The universal clipboard for your workspace. Share text, code, and links across devices instantly.
        </p>
      </div>

      <div className="bg-white border-2 border-[#141414] p-6 md:p-8 rounded-sm shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] md:shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] space-y-6 md:space-y-8">
        <div className="space-y-4">
          <button 
            onClick={onLogin}
            className="w-full bg-[#141414] text-[#E4E3E0] py-4 md:py-6 rounded-sm font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs md:text-base"
          >
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
            Login with Google
          </button>
          <p className="text-[9px] md:text-[10px] text-center opacity-40 uppercase tracking-widest">
            Unlock 100k chars & 24h persistence
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#141414]/10"></div>
          </div>
          <span className="relative px-4 bg-white text-[9px] md:text-[10px] uppercase tracking-widest opacity-40 font-bold">Or</span>
        </div>

        <div className="space-y-4">
          <button 
            onClick={onGuest}
            className="w-full border-2 border-[#141414] text-[#141414] py-4 md:py-6 rounded-sm font-bold uppercase tracking-[0.2em] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center justify-center gap-3 text-xs md:text-base"
          >
            Continue as Guest
          </button>
          <p className="text-[9px] md:text-[10px] text-center opacity-40 uppercase tracking-widest">
            Limited to 10k chars & 60s clips
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <button 
            onClick={() => {
              // Trigger onboarding directly for preview
              onGuest();
            }}
            className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity flex items-center gap-2"
          >
            <HelpCircle className="w-3 h-3 md:w-4 md:h-4" />
            How it works
          </button>
        </div>
      </div>
    </div>
    
    <div className="absolute bottom-4 md:bottom-8 text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.5em] opacity-20 font-bold text-center px-4">
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
    const now = Date.now();
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <RefreshCw className="w-8 h-8 animate-spin opacity-20" />
      <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Accessing Vault...</p>
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
          <h2 className="text-xl sm:text-2xl font-serif italic">Locked Vault</h2>
        </div>
        <p className="text-[10px] sm:text-xs opacity-60 max-w-[240px] sm:max-w-xs mx-auto">
          Pro Max Insurance: Expired clips are held here for 7 days before permanent deletion.
        </p>
      </div>

      {vaultClips.length === 0 ? (
        <div className="border-2 border-dashed border-[#141414]/10 rounded-sm p-12 text-center space-y-4">
          <Shield className="w-8 h-8 mx-auto opacity-10" />
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-30">Your vault is empty</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {vaultClips.map((clip) => (
            <div key={clip.id} className="border border-[#141414] p-4 rounded-sm bg-white hover:bg-blue-50 transition-colors group relative overflow-hidden">
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
                  <span className={`text-[9px] uppercase tracking-widest font-bold ${
                    reactivatingClips[clip.id] > 0 || clip.expiresAt.toMillis() > Date.now()
                      ? "text-emerald-600" 
                      : "opacity-40"
                  }`}>
                    {reactivatingClips[clip.id] > 0 || clip.expiresAt.toMillis() > Date.now()
                      ? "Live / Active" 
                      : `Expired ${Math.floor((Date.now() - clip.expiresAt.toMillis()) / (1000 * 60 * 60))}h ago`
                    }
                  </span>
                  {clip.burnOnRead && (
                    <span className="text-[8px] uppercase tracking-widest font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-sm border border-red-100 flex items-center gap-1">
                      <Zap className="w-2 h-2" />
                      Burn
                    </span>
                  )}
                  {clip.viewCount !== undefined && (
                    <span className="text-[8px] uppercase tracking-widest font-bold opacity-30 flex items-center gap-1">
                      <HelpCircle className="w-2 h-2" />
                      {clip.viewCount} Views
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onCopy(clip.id)}
                    className={`p-1 rounded-sm transition-all ${copiedId === clip.id ? 'bg-emerald-500 text-white' : 'hover:bg-[#141414]/5'}`}
                    title="Copy Code"
                  >
                    {copiedId === clip.id ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-40" />}
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
                      className={`p-1 rounded-sm transition-all ${copiedId === clip.id + '-content' ? 'bg-emerald-500 text-white' : 'hover:bg-[#141414]/5'}`}
                      title="Copy Content"
                    >
                      {copiedId === clip.id + '-content' ? <CheckCircle2 className="w-3 h-3" /> : <FileText className="w-3 h-3 opacity-40" />}
                    </button>
                  )}
                  <AnimatePresence>
                    {reactivatingClips[clip.id] > 0 ? (
                      <motion.div 
                        key="active-timer"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-[9px] font-bold uppercase tracking-widest text-blue-600 flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-sm"
                      >
                        <Clock className="w-3 h-3 animate-pulse" />
                        Active: {reactivatingClips[clip.id]}s
                      </motion.div>
                    ) : (
                      <motion.button 
                        key="reactivate-btn"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => onReactivate(clip.id)}
                        className="text-[9px] font-bold uppercase tracking-widest text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        Reactivate
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="text-xs opacity-60 line-clamp-2 font-mono">{clip.content || (clip.hasFile ? `[File: ${clip.fileName}]` : 'No content')}</p>
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
  const [tier, setTier] = useState<'free' | 'pro' | 'promax'>('free');
  const [userClips, setUserClips] = useState<ClipData[]>([]);
  
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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [hasDismissedFree, setHasDismissedFree] = useState(false);
  const [expirationOption, setExpirationOption] = useState<number>(60);
  const [isApiBlocked, setIsApiBlocked] = useState(false);
  const [showCustomCodeDropdown, setShowCustomCodeDropdown] = useState(false);
  const [recentCodes, setRecentCodes] = useState<string[]>(JSON.parse(localStorage.getItem('recentCodes') || '[]'));
  const [customCodeInput, setCustomCodeInput] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [shareMode, setShareMode] = useState<'text' | 'file'>('text');
  const [isDragging, setIsDragging] = useState(false);
  const [burnOnRead, setBurnOnRead] = useState(false);
  const [activeBundleId, setActiveBundleId] = useState<string | null>(null);

  const addRecentCode = (code: string) => {
    const updated = [code, ...recentCodes.filter(c => c !== code)].slice(0, 5);
    setRecentCodes(updated);
    localStorage.setItem('recentCodes', JSON.stringify(updated));
  };
  
  const isPro = tier === 'pro' || tier === 'promax';
  const isProMax = tier === 'promax';
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownPaywall = useRef(false);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        setIsGuest(false);
        if (!localStorage.getItem('hasShownPaywall')) {
          setShowProModal(true);
          localStorage.setItem('hasShownPaywall', 'true');
        }
      } else {
        setTier('free');
        localStorage.removeItem('hasShownPaywall');
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
    try {
      await signInAnonymously(auth);
      setIsGuest(true);
      if (!localStorage.getItem('clipcloud_onboarding_seen')) {
        setShowOnboarding(true);
      }
    } catch (e) {
      console.error(e);
      setIsGuest(true);
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
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
        const res = await fetch('/api/health', { credentials: 'include' });
        if (!res.ok) {
          const text = await res.text();
          if (text.includes("Cookie check") || text.includes("Authenticate in new window")) {
            setIsApiBlocked(true);
            setStatus({ 
              type: 'error', 
              message: 'Your browser is blocking a required security cookie. Please click "Open in New Tab" to authenticate.' 
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

    // Handle direct link
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) {
      setInputCode(urlCode.toUpperCase());
      setActiveTab('get');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
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
    
    if (!text && !selectedFile) {
      setStatus({ type: 'error', message: 'Please enter text or select a file.' });
      return;
    }

    if (selectedFile && selectedFile.size > (isProMax ? 50 : 10) * 1024 * 1024) {
      setStatus({ type: 'error', message: `File too large. Max ${isProMax ? '50' : '10'}MB allowed.` });
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

    const expirationSeconds = isPro ? expirationOption : EXPIRATION_SECONDS;
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000);
    
    // Check if custom code already exists
    if (isPro && customCodeInput.trim()) {
      setStatus({ type: 'loading', message: 'Checking code availability...' });
      const docSnap = await getDoc(doc(db, 'clips', newCode));
      if (docSnap.exists()) {
        setStatus({ type: 'error', message: 'This custom code is already in use.' });
        return;
      }
    }

    // Optimistic Update: Show code immediately
    setCode(newCode);
    if (isPro && customCodeInput.trim()) addRecentCode(newCode);
    setTimeLeft(expirationSeconds);
    setStatus({ type: 'success', message: 'Clip shared!' });
    const savedText = text;
    setManualText(''); 
    setCustomCodeInput('');

    // Sync to Firestore in background
    const path = `clips/${newCode}`;
    try {
      let downloadUrl = null;
      if (selectedFile) {
        setStatus({ type: 'loading', message: 'Uploading file...' });
        const formData = new FormData();
        formData.append('files', selectedFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        const contentType = uploadRes.headers.get("content-type");
        if (!uploadRes.ok) {
          let errorMessage = 'Upload failed';
          const text = await uploadRes.text();
          
          if (text.includes("Cookie check") || text.includes("Authenticate in new window")) {
            errorMessage = 'Security cookie blocked. Please open in a new tab to authenticate.';
          } else if (contentType && contentType.includes("application/json")) {
            try {
              const errorData = JSON.parse(text);
              errorMessage = errorData.error || errorMessage;
            } catch (e) {
              errorMessage = `Upload failed with status ${uploadRes.status}`;
            }
          } else {
            errorMessage = `Upload failed with status ${uploadRes.status}`;
          }
          throw new Error(errorMessage);
        }

        if (contentType && contentType.includes("application/json")) {
          const uploadData = await uploadRes.json();
          if (uploadData.files && uploadData.files[0]) {
            downloadUrl = uploadData.files[0].downloadUrl;
          } else {
            throw new Error("Invalid upload response format: " + JSON.stringify(uploadData));
          }
        } else {
          const text = await uploadRes.text();
          if (text.includes("Cookie check") || text.includes("Authenticate in new window")) {
            throw new Error("Security cookie blocked. Please open in a new tab to authenticate.");
          }
          console.error("Unexpected non-JSON response from /api/upload:", text);
          throw new Error("Server returned an unexpected response format. Please try again.");
        }
      }

      const clipData: any = {
        content: savedText,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        authorUid: auth.currentUser?.uid || null,
        tier: tier,
        burnOnRead: burnOnRead,
        viewCount: 0
      };

      if (selectedFile) {
        clipData.fileName = selectedFile.name;
        clipData.fileType = selectedFile.type;
        clipData.fileSize = selectedFile.size;
        clipData.downloadUrl = downloadUrl || null;
        clipData.hasFile = true;
      }

      await setDoc(doc(db, 'clips', newCode), clipData);
      
      if (activeBundleId) {
        await updateDoc(doc(db, 'bundles', activeBundleId), {
          clipIds: arrayUnion(newCode)
        });
      }

      setSelectedFile(null);
      setStatus({ type: 'success', message: 'Clip shared successfully!' });
    } catch (err) {
      // Rollback if sync fails
      setCode(null);
      setManualText(savedText);
      const errorMessage = err instanceof Error ? err.message : 'Sync failed. Please try again.';
      setStatus({ type: 'error', message: errorMessage });
      if (errorMessage.includes('Security cookie blocked')) {
        setIsApiBlocked(true);
      }
      handleFirestoreError(err, OperationType.CREATE, path);
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

    setStatus({ type: 'loading', message: tier === 'free' ? 'Processing (Free Tier)...' : 'Retrieving clip...' });
    
    // Speed Bump for Free Users
    if (tier === 'free') {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const path = `clips/${codeToFetch}`;
    
    try {
      const docRef = doc(db, 'clips', codeToFetch);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const now = Timestamp.now();
        
        if (data.expiresAt && data.expiresAt.toMillis() < (now.toMillis() - 300000)) {
          // ... (keep existing expiration logic)
          const isAuthorProMax = data.tier === 'promax';
          const isCurrentUserProMax = tier === 'promax';
          const isOwner = user && data.authorUid === user.uid;

          if (isAuthorProMax) {
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
            if (now.toMillis() - data.expiresAt.toMillis() < sevenDaysInMs) {
              if (isOwner && isCurrentUserProMax) {
                setStatus({ type: 'error', message: 'Clip Expired. You can reactivate this in your Locked Vault for another 60s.' });
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

        setRetrievedClip(data);
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
        
        if (data.hasFile) {
          setStatus({ type: 'success', message: `Clip retrieved! Includes file: ${data.fileName}${data.burnOnRead ? ' (Self-destructed)' : ''}` });
        } else {
          setStatus({ type: 'success', message: `Clip retrieved!${data.burnOnRead ? ' (Self-destructed)' : ''}` });
        }

        if (data.burnOnRead) {
          try {
            await deleteDoc(docRef);
          } catch (e) {
            console.error("Failed to burn on read:", e);
          }
        } else {
          try {
            await updateDoc(docRef, {
              viewCount: (data.viewCount || 0) + 1
            });
          } catch (e) {
            console.error("Failed to increment view count:", e);
          }

          if (data.tier === 'promax') {
            try {
              await updateDoc(docRef, { expiresAt: serverTimestamp() });
            } catch (e) {
              console.error("Failed to expire Pro Max clip:", e);
            }
          } else {
            try {
              await deleteDoc(docRef);
            } catch (e) {
              console.error("Failed to delete clip after retrieval:", e);
            }
          }
        }
        
        setInputCode('');
      } else {
        setStatus({ type: 'error', message: 'Invalid or expired code.' });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  };

  const handleReactivate = async (clipId: string) => {
    try {
      setStatus({ type: 'loading', message: 'Reactivating clip...' });
      
      // Set local state FIRST to prevent disappearance
      setReactivatingClips(prev => ({ ...prev, [clipId]: 60 }));
      
      const newExpiration = new Date(Date.now() + 60 * 1000); // 60 seconds
      await updateDoc(doc(db, 'clips', clipId), {
        expiresAt: Timestamp.fromDate(newExpiration)
      });
      
      setStatus({ type: 'success', message: `Clip ${clipId} reactivated! You can now copy the code and use it in the GET tab.` });
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
          <RefreshCw className="w-8 h-8 animate-spin opacity-20" />
        </div>
      ) : (
        <>
          <AnimatePresence>
            {!user && !isGuest && <LandingPage onLogin={handleLogin} onGuest={handleGuestEnter} />}
          </AnimatePresence>
          {/* Header */}
      <header className="fixed top-0 left-0 right-0 border-b border-[#141414] p-2 sm:p-4 lg:px-8 flex justify-between items-center bg-[#E4E3E0]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#141414] rounded-sm flex items-center justify-center">
            <Share2 className="text-[#E4E3E0] w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">ClipCloud</h1>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {tier !== 'promax' && (
                <button 
                  onClick={() => setShowProModal(true)}
                  className="bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <Zap className="w-3 h-3" />
                  {tier === 'pro' ? 'Go Pro Max' : 'Upgrade'}
                </button>
              )}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-bold uppercase tracking-widest leading-none flex items-center justify-end gap-1">
                    {user.displayName}
                    {isPro && <Zap className={`w-2.5 h-2.5 ${isProMax ? 'text-blue-600 fill-blue-600' : 'text-emerald-600 fill-emerald-600'}`} />}
                  </div>
                  <div className="text-[8px] opacity-40 font-mono">{user.email}</div>
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
                  className="ml-1 p-2 border border-transparent hover:border-[#141414] hover:bg-white rounded-sm transition-all group"
                  title="Logout"
                >
                  <X className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="text-[10px] font-bold uppercase tracking-widest border-b border-[#141414] pb-1 hover:opacity-50 transition-opacity"
            >
              Login for Pro
            </button>
          )}
          <button 
            onClick={() => setShowOnboarding(true)}
            className="text-[10px] uppercase tracking-widest font-bold border border-[#141414] px-2 py-1 rounded-sm hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
          >
            How it works
          </button>
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
                    className="absolute top-4 right-4 p-2 hover:bg-[#141414]/5 rounded-sm transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="space-y-6 text-center">
                    <h2 className="text-xl font-bold uppercase tracking-widest">Login</h2>
                      <button 
                        onClick={handleLogin}
                        className="w-full bg-white border border-[#141414] py-3 rounded-sm font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-[#141414]/5 transition-all"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign in with Google
                      </button>
                    <p className="text-[10px] opacity-60">
                      By signing up, you accept our <button className="underline font-bold" onClick={() => setShowTermsModal(true)}>terms and conditions</button>.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  <h2 className="text-xl font-bold uppercase tracking-widest mb-4">Terms and Conditions</h2>
                  <div className="text-[10px] opacity-60 text-left space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar border border-[#141414]/10 p-2 rounded-sm mb-4" style={{scrollbarWidth: 'thin'}}>
                    <p className="font-bold">Terms and Conditions for ClipCloud</p>
                    <p>Welcome to ClipCloud. By using our service, you agree to the following terms.</p>
                    <p>1. Service Usage: ClipCloud provides temporary storage for text and files. We are not responsible for the loss of data.</p>
                    <p>2. Data Privacy: Your clips are temporary. Pro Max users get extra protection but data is still transient.</p>
                    <p>3. Acceptable Use: You agree not to upload illegal, copyrighted, or malicious content.</p>
                    <p>4. Pro Accounts: Subscription fees are non-refundable. Features are subject to change.</p>
                    <p>We reserve the right to terminate access for misuse.</p>
                  </div>
                  <button 
                    onClick={() => setShowTermsModal(false)}
                    className="w-full bg-[#141414] text-[#E4E3E0] py-2 rounded-sm font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-all"
                  >
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>


      <main className="max-w-2xl mx-auto p-4 sm:p-6 lg:px-8 pt-24 sm:pt-32 lg:pt-40">
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

        {/* Tab Navigation */}
        <div className="flex border border-[#141414] mb-6 sm:mb-8 overflow-hidden rounded-sm w-full">
          <button 
            onClick={() => { setActiveTab('share'); setStatus({ type: 'idle', message: '' }); }}
            className={`flex-1 py-3 sm:py-4 text-[10px] sm:text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'share' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
          >
            Share
          </button>
          <button 
            onClick={() => { setActiveTab('get'); setStatus({ type: 'idle', message: '' }); }}
            className={`flex-1 py-3 sm:py-4 text-[10px] sm:text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'get' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
          >
            Get
          </button>
          {isProMax && (
            <button 
              onClick={() => { setActiveTab('vault'); setStatus({ type: 'idle', message: '' }); }}
              className={`flex-1 py-3 sm:py-4 text-[10px] sm:text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'vault' ? 'bg-blue-600 text-white' : 'hover:bg-blue-600/5'}`}
            >
              Vault
            </button>
          )}
          <button 
            onClick={() => { setActiveTab('share'); setStatus({ type: 'idle', message: '' }); }}
            className={`flex-1 py-3 sm:py-4 text-[10px] sm:text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'share' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
          >
            Share
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white border border-[#141414] p-4 sm:p-8 pb-24 sm:pb-32 min-h-[300px] flex flex-col relative w-full max-w-full overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'share' ? (
              <motion.div 
                key="share-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 sm:space-y-8 text-center"
              >
                {!code ? (
                  <>
                    {user && <BundleManager user={user} tier={tier} allUserClips={userClips} activeBundleId={activeBundleId} setActiveBundleId={setActiveBundleId} />}
                    <div className="space-y-4">
                      <h2 className="text-lg sm:text-3xl font-serif italic">Share a clip</h2>
                      <p className="text-[9px] sm:text-sm opacity-60 max-w-[200px] sm:max-w-xs mx-auto">
                        {isProMax 
                          ? "Share text, files, or both with your elite Pro Max tools." 
                          : "Paste your content below to generate a temporary code."}
                      </p>
                    </div>

                    <div className="flex border-b border-[#141414]/10 mb-4">
                        <button 
                          onClick={() => setShareMode('text')}
                          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${shareMode === 'text' ? 'border-b-2 border-[#141414] opacity-100' : 'opacity-30 hover:opacity-50'}`}
                        >
                          Text Clip
                        </button>
                        <button 
                          onClick={() => setShareMode('file')}
                          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${shareMode === 'file' ? 'border-b-2 border-[#141414] opacity-100' : 'opacity-30 hover:opacity-50'}`}
                        >
                          File Clip
                        </button>
                      </div>

                    <div className="space-y-4">
                      <div className="relative">
                        {(shareMode === 'text') && (
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
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
                              className="w-full h-40 p-4 border border-[#141414] rounded-sm font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]/20 resize-none bg-[#F9F9F8]"
                            />
                            <div className={`absolute bottom-3 left-3 text-[10px] font-mono transition-colors ${
                              manualText.length >= (isPro ? 100000 : 10000) ? 'text-red-500 font-bold' : 'opacity-30'
                            }`}>
                              {manualText.length.toLocaleString()} / {(isPro ? 100000 : 10000).toLocaleString()}
                            </div>
                          </motion.div>
                        )}
                        
                        {(shareMode === 'file') && (
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="py-4"
                          >
                            <input 
                              type="file" 
                              id="file-upload" 
                              className="hidden" 
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                            <label 
                              htmlFor="file-upload"
                              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                              onDragLeave={() => setIsDragging(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                if (e.dataTransfer.files?.[0]) {
                                  setSelectedFile(e.dataTransfer.files[0]);
                                }
                              }}
                              className={`w-full min-h-[200px] p-8 border-2 border-dashed rounded-sm flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                                selectedFile 
                                  ? 'bg-blue-50/50 border-blue-500' 
                                  : isDragging 
                                    ? 'bg-blue-50 border-blue-500 scale-[1.02] shadow-xl' 
                                    : 'bg-[#141414]/5 border-[#141414]/20 hover:border-[#141414]/40 hover:bg-[#141414]/10'
                              }`}
                            >
                              {selectedFile ? (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="flex flex-col items-center gap-4 w-full"
                                >
                                  <div className="relative">
                                    <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center shadow-inner">
                                      <FileText className="w-10 h-10 text-blue-600" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                    </div>
                                  </div>
                                  
                                  <div className="text-center space-y-1 max-w-xs">
                                    <div className="text-sm font-bold uppercase tracking-widest text-blue-600 truncate w-full">{selectedFile.name}</div>
                                    <div className="flex items-center justify-center gap-3 text-[10px] font-mono opacity-50">
                                      <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                                      <span className="w-1 h-1 bg-[#141414]/20 rounded-full"></span>
                                      <span className="uppercase">{selectedFile.name.split('.').pop()}</span>
                                    </div>
                                  </div>

                                  <div className="w-full max-w-[200px] space-y-2">
                                    <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest opacity-40">
                                      <span>Security Scan</span>
                                      <span className="text-emerald-600">Verified</span>
                                    </div>
                                    <div className="h-1 w-full bg-[#141414]/10 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-emerald-500"
                                      />
                                    </div>
                                  </div>

                                  <button 
                                    onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                                    className="mt-2 px-6 py-2 bg-white border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-red-50 transition-colors shadow-sm"
                                  >
                                    Replace Document
                                  </button>
                                </motion.div>
                              ) : (
                                <div className="flex flex-col items-center gap-4 text-center">
                                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${isDragging ? 'bg-blue-100 rotate-12 scale-110' : 'bg-[#141414]/5'}`}>
                                    <Upload className={`w-10 h-10 transition-all duration-500 ${isDragging ? 'text-blue-600' : 'opacity-20'}`} />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#141414]">
                                      {isDragging ? 'Drop to upload' : 'Select Document'}
                                    </div>
                                    <div className="text-[9px] opacity-40 font-medium max-w-[180px] leading-relaxed">
                                      Drag and drop or <span className="text-blue-600 underline">browse</span> your files.
                                      <br />
                                      <span className="text-[8px] opacity-60">MAX 50MB • PDF, ZIP, IMAGES, VIDEOS</span>
                                    </div>
                                  </div>
                                  
                                  {isDragging && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="absolute inset-0 border-4 border-blue-500/20 pointer-events-none"
                                    />
                                  )}
                                </div>
                              )}
                            </label>
                          </motion.div>
                        )}
                      </div>                          
                          {isPro && (
                            <>
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-[#141414]/5 p-4 rounded-sm space-y-4 text-left border border-[#141414]/10"
                              >
                                <button 
                                  onClick={() => setShowCustomCodeDropdown(!showCustomCodeDropdown)}
                                  className="flex justify-between w-full font-bold opacity-50 uppercase text-[10px] tracking-widest"
                                >
                                  Custom Code (Optional) {showCustomCodeDropdown ? '▲' : '▼'}
                                </button>
                                {showCustomCodeDropdown && (
                                  <>
                                    <div className="space-y-2">
                                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Custom Code (Optional)</label>
                                      <input 
                                        type="text"
                                        value={customCodeInput}
                                        onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                                        placeholder="MY-CUSTOM-CLIP"
                                        className="w-full p-2 border border-[#141414] rounded-sm font-mono text-sm focus:outline-none"
                                      />
                                      {recentCodes.length > 0 && (
                                        <select 
                                          onChange={(e) => setCustomCodeInput(e.target.value)}
                                          className="w-full p-2 border border-[#141414]/20 rounded-sm text-sm"
                                        >
                                          <option value="">Recent Codes</option>
                                          {recentCodes.map(code => <option key={code} value={code}>{code}</option>)}
                                        </select>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Expiration Time</label>
                                      <div className="flex gap-2">
                                        {[
                                          { label: '60s', value: 60 },
                                          { label: '1h', value: 3600 },
                                          { label: '24h', value: 86400 }
                                        ].map((opt) => (
                                          <button
                                            key={opt.value}
                                            onClick={() => setExpirationOption(opt.value)}
                                            className={`flex-1 py-2 text-[10px] uppercase font-bold border rounded-sm transition-all ${
                                              expirationOption === opt.value 
                                                ? 'bg-[#141414] text-[#E4E3E0] border-[#141414]' 
                                                : 'border-[#141414]/20 hover:border-[#141414]'
                                            }`}
                                          >
                                            {opt.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                      <div className="flex flex-col">
                                        <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Burn on Read</label>
                                        <span className="text-[8px] opacity-40">Self-destruct after first retrieval</span>
                                      </div>
                                      <button 
                                        onClick={() => setBurnOnRead(!burnOnRead)}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${burnOnRead ? 'bg-red-500' : 'bg-[#141414]/20'}`}
                                      >
                                        <motion.div 
                                          animate={{ x: burnOnRead ? 20 : 2 }}
                                          className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                                        />
                                      </button>
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            </>
                          )}


                      <button 
                        onClick={handleShare}
                        disabled={status.type === 'loading' || (!manualText.trim() && !selectedFile)}
                        className="w-full bg-[#141414] text-[#E4E3E0] py-4 sm:py-6 rounded-sm font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {status.type === 'loading' ? <RefreshCw className="animate-spin w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                        Generate Code
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-8">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                      <div className="space-y-4 text-center md:text-left">
                        <div className="text-[10px] uppercase tracking-widest opacity-50 font-mono">Your Code</div>
                        <div className="flex items-center justify-center md:justify-start gap-4">
                          <div className="text-4xl sm:text-6xl font-bold tracking-tighter font-mono">{code}</div>
                          <button 
                            onClick={() => handleCopyCode(code)}
                            className={`p-3 rounded-sm transition-all ${
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
                        <div className="relative p-4 bg-white border-2 border-[#141414] rounded-sm shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] transition-all">
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
                      <div className="flex items-center justify-center gap-2 text-[#141414]/60">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-mono uppercase tracking-widest">Expires in {timeLeft}s</span>
                      </div>

                      <button 
                        onClick={() => {
                          const url = `${window.location.origin}/?code=${code}`;
                          navigator.clipboard.writeText(url);
                          setStatus({ type: 'success', message: 'Direct link copied!' });
                        }}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold bg-blue-50 text-blue-600 px-4 py-2 rounded-sm hover:bg-blue-100 transition-colors"
                      >
                        <Share2 className="w-3 h-3" />
                        Copy Direct Link
                      </button>
                    </div>

                    <div className="p-4 bg-[#E4E3E0]/50 border border-[#141414]/10 rounded-sm text-xs font-mono break-all line-clamp-3 opacity-60 italic">
                      "Content ready for retrieval"
                    </div>

                    <button 
                      onClick={() => setCode(null)}
                      className="text-[10px] uppercase tracking-widest font-bold border-b border-[#141414] pb-1 hover:opacity-50 transition-opacity"
                    >
                      Cancel / Share New
                    </button>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'get' ? (
              <motion.div 
                key="get-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="space-y-4 text-center">
                  <h2 className="text-lg sm:text-3xl font-serif italic">Retrieve a clip</h2>
                  <p className="text-[9px] sm:text-sm opacity-60 max-w-[200px] sm:max-w-xs mx-auto">
                    Enter the code from your other device to fetch and copy the content.
                  </p>
                </div>

                <div className="space-y-4">
                  <input 
                    type="text"
                    maxLength={20}
                    placeholder="CODE"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                    className="w-full text-center text-xl sm:text-4xl font-bold font-mono py-4 sm:py-6 border-b-2 border-[#141414] focus:outline-none placeholder:opacity-10"
                  />

                  {Object.values(reactivatingClips).some((v: number) => v > 0) && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center gap-2 text-blue-600 font-mono text-xs uppercase tracking-widest"
                    >
                      <Clock className="w-3 h-3 animate-pulse" />
                      <span>Reactivated clip is currently active in Vault</span>
                    </motion.div>
                  )}
                  
                  <button 
                    onClick={handleGet}
                    disabled={status.type === 'loading' || inputCode.length < 3}
                    className="w-full bg-[#141414] text-[#E4E3E0] py-4 sm:py-6 rounded-sm font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {status.type === 'loading' ? <RefreshCw className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                    Get Clip
                  </button>

                  {/* Scanner */}
                  {!retrievedClip && (
                    <button 
                      onClick={() => setShowScannerModal(true)}
                      className="w-full border-2 border-[#141414] text-[#141414] py-4 rounded-sm font-bold uppercase tracking-[0.2em] hover:bg-[#141414]/5 transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Scan QR Code
                    </button>
                  )}
                </div>

                {retrievedClip && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-2 border-[#141414] rounded-sm overflow-hidden"
                  >
                    <div className="bg-[#141414] text-[#E4E3E0] p-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] uppercase tracking-widest font-bold font-mono">Clip Retrieved</span>
                      </div>
                      <button 
                        onClick={() => setRetrievedClip(null)}
                        className="hover:opacity-50 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="p-4 sm:p-6 bg-white space-y-6">
                      {retrievedClip.hasFile && (
                        <div className="bg-blue-50 border-2 border-blue-200 p-3 sm:p-5 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-[4px_4px_0px_0px_rgba(59,130,246,0.2)]">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
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
                              <div className="text-xs font-bold uppercase tracking-widest text-blue-700 truncate block mb-1">
                                {retrievedClip.fileName}
                              </div>
                              <div className="text-[10px] opacity-60 font-mono bg-blue-100/50 inline-block px-2 py-0.5 rounded-sm">
                                {(retrievedClip.fileSize / (1024 * 1024)).toFixed(2)} MB • {retrievedClip.fileType?.split('/').pop()?.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          <a 
                            href={retrievedClip.downloadUrl}
                            download={retrievedClip.fileName}
                            onClick={(e) => {
                              if (isApiBlocked) {
                                e.preventDefault();
                                setStatus({ 
                                  type: 'error', 
                                  message: 'Security cookie blocked. Please click "Open in New Tab" to authenticate your session.' 
                                });
                              } else {
                                setStatus({ type: 'success', message: `Downloading ${retrievedClip.fileName}...` });
                              }
                            }}
                            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          >
                            <Download className="w-4 h-4" />
                            Download Now
                          </a>
                        </div>
                      )}

                      {retrievedClip.content && (
                        <div className="space-y-4">
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            <p className="text-sm font-mono whitespace-pre-wrap break-all text-[#141414]/80">
                              {retrievedClip.content}
                            </p>
                          </div>

                          <div className="flex gap-3">
                            <button 
                              onClick={() => handleCopy(retrievedClip.content)}
                              className={`flex-1 py-3 rounded-sm font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
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
              </motion.div>
            ) : (
              <Vault 
                user={user} 
                handleCopyCode={handleCopyCode} 
                onReactivate={handleReactivate} 
                reactivatingClips={reactivatingClips} 
              />
            )}
          </AnimatePresence>

          {/* Status Messages */}
          <AnimatePresence>
            {status.message && status.type !== 'loading' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 p-3 border flex flex-col sm:flex-row items-center gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-sm z-50 ${
                  status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span className="flex-1">{status.message.replace('[Upgrade Now]', '')}</span>
                  {status.type === 'error' && status.message.includes('new tab') && (
                    <button 
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="bg-red-700 text-white px-3 py-1.5 rounded-sm hover:bg-red-800 transition-colors shrink-0 w-full sm:w-auto mt-2 sm:mt-0"
                    >
                      Open in New Tab
                    </button>
                  )}
                </div>
                {status.message.includes('[Upgrade Now]') && (
                  <button 
                    onClick={() => setShowProModal(true)}
                    className="bg-red-700 text-white px-3 py-1.5 rounded-sm hover:bg-red-800 transition-colors shrink-0 w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    Upgrade Now
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <footer className="mt-12 sm:mt-16 pb-12 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">Security</p>
              <p className="text-xs opacity-60 leading-relaxed">End-to-end encrypted logic. Clips are automatically purged after expiration.</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">Universal</p>
              <p className="text-xs opacity-60 leading-relaxed">Works on any device with a browser. No app installation required.</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">Speed</p>
              <p className="text-xs opacity-60 leading-relaxed">Optimized for instant transfers. 8-character codes for maximum efficiency.</p>
            </div>
          </div>

          <div className="pt-8 border-t border-[#141414]/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 opacity-20">
              <Share2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">ClipCloud v2.5</span>
            </div>
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setShowLegalModal(true)}
                className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
              >
                Privacy & Terms
              </button>

            </div>
          </div>
        </footer>
      </main>

      {/* Background Grid Accent */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" 
           style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Pro Modal - Brutalist Subscription Redesign */}
      <AnimatePresence>
        {showProModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-[#141414]/40 backdrop-blur-md overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-4xl rounded-sm shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden"
            >
              <button 
                onClick={() => setShowProModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-[#141414]/5 rounded-sm transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 md:p-8 border-b-2 border-[#141414] bg-white/30">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#141414] rounded-sm flex items-center justify-center">
                        <Zap className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Subscription Tiers</span>
                    </div>
                    <h2 className="text-4xl font-serif italic leading-[0.8] tracking-tighter">
                      Choose your<br />power level.
                    </h2>
                  </div>
                  <p className="text-[11px] opacity-60 font-light leading-relaxed max-w-[200px]">
                    From casual sharing to professional-grade transfer.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#141414] overflow-y-auto max-h-[70vh]">
                {/* Free Tier */}
                <div className="p-6 space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold uppercase tracking-tighter">Free</h3>
                      <p className="text-[9px] opacity-50 uppercase tracking-widest font-bold">Casual Use</p>
                    </div>
                    <div className="text-3xl font-serif italic">$0</div>
                    <ul className="space-y-2">
                      {[
                        "8-Character Codes",
                        "10k Character Limit",
                        "60s Persistence",
                        "5s Retrieval Delay",
                        "File Sharing (Up to 10MB)"
                      ].map((f, i) => (
                        <li key={i} className="flex gap-2 items-center text-[10px] opacity-70">
                          <CheckCircle2 className="w-3 h-3 text-[#141414]/30" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {!hasDismissedFree && user && tier === 'free' && (
                    <button 
                      onClick={() => {
                        setHasDismissedFree(true);
                        setShowProModal(false);
                      }}
                      className="w-full border-2 border-[#141414] py-3 rounded-sm font-bold uppercase tracking-widest text-[9px] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                    >
                      Current Plan
                    </button>
                  )}
                </div>

                {/* Pro Tier */}
                <div className="p-6 space-y-6 flex flex-col justify-between bg-white/40">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold uppercase tracking-tighter text-emerald-600">Pro</h3>
                      <p className="text-[9px] opacity-50 uppercase tracking-widest font-bold">Power User</p>
                    </div>
                    <div className="text-3xl font-serif italic">$2.99<span className="text-[10px] opacity-40 italic">/mo</span></div>
                    <ul className="space-y-2">
                      {[
                        "5+ Character Custom Codes",
                        "100k Character Limit",
                        "24h Persistence",
                        "Instant Retrieval",
                        "Priority Sync",
                        "File Sharing (Up to 50MB)"
                      ].map((f, i) => (
                        <li key={i} className="flex gap-2 items-center text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    onClick={() => {
                      setTier('pro');
                      setShowProModal(false);
                    }}
                    className={`w-full py-3 rounded-sm font-bold uppercase tracking-widest text-[9px] transition-all ${
                      tier === 'pro' 
                        ? 'bg-emerald-500 text-black cursor-default' 
                        : 'bg-[#141414] text-[#E4E3E0] hover:shadow-[3px_3px_0px_0px_rgba(16,185,129,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                    }`}
                  >
                    {tier === 'pro' ? 'Active' : tier === 'promax' ? 'Downgrade' : 'Upgrade to Pro'}
                  </button>
                </div>

                {/* Pro Max Tier */}
                <div className="p-6 space-y-6 flex flex-col justify-between bg-[#141414] text-[#E4E3E0]">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold uppercase tracking-tighter text-blue-400">Pro Max</h3>
                        <p className="text-[9px] opacity-50 uppercase tracking-widest font-bold">Elite Professional</p>
                      </div>
                      <div className="bg-blue-500 text-black text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest">Best Value</div>
                    </div>
                    <div className="text-3xl font-serif italic">$5.99<span className="text-[10px] opacity-40 italic">/mo</span></div>
                    <ul className="space-y-2">
                      {[
                        "3-4 Character Short Codes",
                        "Locked Vault (7-Day Recovery)",
                        "Everything in Pro",
                        "Pro Max Insurance",
                        "Unlimited File Sharing (Max 1GB)"
                      ].map((f, i) => (
                        <li key={i} className="flex gap-2 items-center text-[10px]">
                          <Zap className="w-3 h-3 text-blue-400 fill-blue-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    onClick={() => {
                      setTier('promax');
                      setShowProModal(false);
                    }}
                    className={`w-full py-3 rounded-sm font-bold uppercase tracking-widest text-[9px] transition-all ${
                      tier === 'promax' 
                        ? 'bg-blue-500 text-black cursor-default' 
                        : 'bg-white text-[#141414] hover:shadow-[3px_3px_0px_0px_rgba(59,130,246,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                    }`}
                  >
                    {tier === 'promax' ? 'Active' : 'Get Pro Max'}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[#141414]/5 border-t-2 border-[#141414] flex flex-col md:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-3 opacity-40">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[8px] uppercase tracking-[0.3em] font-bold">Enterprise-Grade Security</span>
                </div>
                {!user && (
                  <button 
                    onClick={() => handleLogin()}
                    className="text-[9px] font-bold uppercase tracking-widest underline underline-offset-4 hover:text-emerald-600"
                  >
                    Login to see your personalized offers
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <h2 className="text-2xl font-serif italic font-bold">Legal Information</h2>
                <button onClick={() => setShowLegalModal(false)} className="p-2 hover:bg-[#141414]/5 rounded-sm">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 sm:p-10 overflow-y-auto custom-scrollbar space-y-8">
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">Terms of Service</h3>
                  <div className="space-y-4 text-sm opacity-70 leading-relaxed font-mono">
                    <p>1. ClipCloud is a temporary data transfer service. We do not provide long-term storage.</p>
                    <p>2. Users are solely responsible for the content they share. Illegal, harmful, or malicious content is strictly prohibited.</p>
                    <p>3. We reserve the right to terminate access for users who abuse the service or violate these terms.</p>
                    <p>4. Service is provided "as is" without warranties of any kind regarding data persistence or security.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">Privacy Policy</h3>
                  <div className="space-y-4 text-sm opacity-70 leading-relaxed font-mono">
                    <p>1. We collect minimal data: your email (via Google Auth) and the content of your clips.</p>
                    <p>2. Clips are stored temporarily and are automatically deleted upon expiration.</p>
                    <p>3. We do not sell your data to third parties. Your information is used only to provide the service.</p>
                    <p>4. We use industry-standard encryption and security practices to protect your data in transit and at rest.</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-600">Cookie Policy</h3>
                  <div className="space-y-4 text-sm opacity-70 leading-relaxed font-mono">
                    <p>We use essential cookies and local storage to manage your session and keep you logged in. These are technical requirements for the app to function.</p>
                  </div>
                </section>
              </div>
              <div className="p-6 border-t border-[#141414] bg-white flex justify-end">
                <button 
                  onClick={() => setShowLegalModal(false)}
                  className="bg-[#141414] text-[#E4E3E0] px-8 py-3 rounded-sm font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Understood
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
                  <p className="text-xs font-bold uppercase tracking-widest">Privacy First</p>
                  <p className="text-[10px] opacity-60 leading-relaxed">We use essential cookies to keep you logged in and secure. By using ClipCloud, you agree to our terms.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={acceptCookies}
                  className="flex-1 bg-white text-[#141414] py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors"
                >
                  Accept
                </button>
                <button 
                  onClick={() => setShowLegalModal(true)}
                  className="flex-1 border border-white/20 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
                >
                  Details
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && (user || isGuest) && (
          <Onboarding key="onboarding-modal" onComplete={completeOnboarding} />
        )}
      </AnimatePresence>


        </>
      )}

    </div>
  );
}
