/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  serverTimestamp, 
  Timestamp,
  getDocFromServer,
  updateDoc,
  query,
  where,
  onSnapshot,
  collection
} from 'firebase/firestore';
import { db, auth } from './firebase';

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

// --- Constants ---

const EXPIRATION_SECONDS = 60;

// --- Helper Functions ---

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: undefined, // Add auth if needed later
      email: undefined,
      emailVerified: undefined,
      isAnonymous: undefined,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function generateCode(): string {
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const length = 8;
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }
  return result;
}

// --- Components ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'promax' | null>(null);
  const [activeTab, setActiveTab] = useState<'share' | 'get' | 'dashboard'>('share');
  const [code, setCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [inputCode, setInputCode] = useState<string>('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | 'idle', message: string }>({ type: 'idle', message: '' });
  const [retrievedContent, setRetrievedContent] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [manualText, setManualText] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [expirationOption, setExpirationOption] = useState<number>(60);
  const [customCodeInput, setCustomCodeInput] = useState<string>('');
  const [userClips, setUserClips] = useState<any[]>([]);
  
  const isPro = selectedTier === 'pro' || selectedTier === 'promax';
  const isProMax = selectedTier === 'promax';
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setIsGuest(false);
      } else {
        setSelectedTier(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // User clips listener
  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'clips'), where('authorUid', '==', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const clips = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserClips(clips);
      }, (error) => {
        // Only handle if it's a permission error we want to track
        if (error.message.includes('permission')) {
          handleFirestoreError(error, OperationType.LIST, 'clips');
        }
      });
      return () => unsubscribe();
    } else {
      setUserClips([]);
    }
  }, [user]);

  const handleDeleteClip = async (clipId: string) => {
    try {
      await deleteDoc(doc(db, 'clips', clipId));
      setStatus({ type: 'success', message: 'Clip deleted successfully.' });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `clips/${clipId}`);
    }
  };

  const handleReviveClip = async (clipId: string) => {
    if (!isProMax) return;
    
    setStatus({ type: 'loading', message: 'Reviving clip...' });
    try {
      const newExpiry = new Date(Date.now() + 3600 * 1000); // Revive for 1 hour
      await updateDoc(doc(db, 'clips', clipId), {
        expiresAt: Timestamp.fromDate(newExpiry)
      });
      setStatus({ type: 'success', message: 'Clip revived for 1 hour!' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `clips/${clipId}`);
    }
  };

  // Landing Page Component
  const LandingPage = () => (
    <div className="fixed inset-0 z-[100] bg-[#E4E3E0] flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#141414] rounded-sm flex items-center justify-center">
                <Share2 className="text-[#E4E3E0] w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold uppercase tracking-[0.3em]">ClipCloud</h1>
            </div>
            <h2 className="text-6xl md:text-8xl font-serif italic leading-[0.8] tracking-tighter">
              Seamless<br />Sharing.
            </h2>
          </div>
          <p className="text-lg opacity-60 font-light leading-relaxed max-w-sm">
            The universal clipboard for your workspace. Share text, code, and links across devices instantly.
          </p>
        </div>

        <div className="bg-white border-2 border-[#141414] p-8 rounded-sm shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] space-y-8">
          <div className="space-y-4">
            <button 
              onClick={handleLogin}
              className="w-full bg-[#141414] text-[#E4E3E0] py-6 rounded-sm font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Zap className="w-5 h-5 text-emerald-400" />
              Login for Pro
            </button>
            <p className="text-[10px] text-center opacity-40 uppercase tracking-widest">
              100k chars & 24h persistence
            </p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#141414]/10"></div>
            </div>
            <span className="relative px-4 bg-white text-[10px] uppercase tracking-widest opacity-40 font-bold">Or</span>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => {
                setIsGuest(true);
                setSelectedTier('free');
              }}
              className="w-full border-2 border-[#141414] text-[#141414] py-6 rounded-sm font-bold uppercase tracking-[0.2em] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center justify-center gap-3"
            >
              Continue as Guest
            </button>
            <p className="text-[10px] text-center opacity-40 uppercase tracking-widest">
              Free: 10k chars & 60s clips
            </p>
          </div>
          
          <div className="pt-4 border-t border-[#141414]/5">
            <button 
              onClick={() => {
                handleLogin();
                // We'll simulate Pro Max upgrade after login in a real app, 
                // but for now we'll just show the modal after login
              }}
              className="w-full text-[10px] font-bold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
            >
              Interested in Pro Max? View Cloud Features
            </button>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-[10px] uppercase tracking-[0.5em] opacity-20 font-bold">
        Universal Clipboard Protocol v2.4
      </div>
    </div>
  );

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show an error message
        return;
      }
      console.error(err);
      setStatus({ type: 'error', message: 'Login failed. Please try again.' });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsGuest(false);
      setSelectedTier(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Check if onboarding has been seen
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('clipcloud_onboarding_seen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('clipcloud_onboarding_seen', 'true');
    setShowOnboarding(false);
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
    testConnection();
  }, []);

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

  const handleShare = async () => {
    const text = manualText.trim();
    
    if (!text) {
      setStatus({ type: 'error', message: 'Please paste or type some content first.' });
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
      : generateCode();

    if (isPro && customCodeInput.trim() && (newCode.length < 3 || newCode.length > 20)) {
      setStatus({ type: 'error', message: 'Custom code must be 3-20 characters.' });
      return;
    }

    const expirationSeconds = isPro ? expirationOption : 60;
    const expiresAt = new Date(Date.now() + expirationSeconds * 1000);
    // Pro Max gets 7 days vault, others get 0
    const vaultDuration = isProMax ? (7 * 24 * 60 * 60 * 1000) : 0;
    const vaultUntil = new Date(expiresAt.getTime() + vaultDuration);
    
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
    setTimeLeft(expirationSeconds);
    setStatus({ type: 'success', message: 'Clip shared!' });
    const savedText = text;
    setManualText(''); 
    setCustomCodeInput('');

    // Sync to Firestore in background
    const path = `clips/${newCode}`;
    try {
      await setDoc(doc(db, 'clips', newCode), {
        content: savedText,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        vaultUntil: Timestamp.fromDate(vaultUntil),
        authorUid: auth.currentUser?.uid || null
      });
    } catch (err) {
      // Rollback if sync fails
      setCode(null);
      setManualText(savedText);
      setStatus({ type: 'error', message: 'Sync failed. Please try again.' });
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const tryAutoPaste = async () => {
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
      console.error(err);
      setStatus({ type: 'error', message: 'Browser blocked clipboard access. Please paste manually into the box.' });
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleCopyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyCodeSuccess(true);
      setTimeout(() => setCopyCodeSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const handleGet = async () => {
    if (inputCode.length < 3 || inputCode.length > 20) {
      setStatus({ type: 'error', message: 'Please enter a valid code.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Retrieving clip...' });
    const path = `clips/${inputCode}`;
    
    try {
      const docRef = doc(db, 'clips', inputCode);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const now = Timestamp.now();
        const expiresAt = data.expiresAt as Timestamp;
        const vaultUntil = data.vaultUntil as Timestamp;
        
        if (expiresAt.toMillis() < now.toMillis()) {
          // It's expired. Is it in the vault?
          if (vaultUntil && vaultUntil.toMillis() > now.toMillis()) {
            if (isProMax) {
              setStatus({ 
                type: 'error', 
                message: `This clip expired, but it's in your Vault! Pro Max members can revive it from the Cloud Storage tab.` 
              });
            } else {
              setStatus({ 
                type: 'error', 
                message: `This clip expired. Pro Max members can recover expired clips from their Vault. Upgrade to Pro Max to get it back!` 
              });
            }
          } else {
            setStatus({ type: 'error', message: 'This code has expired and is no longer in the vault.' });
            await deleteDoc(docRef);
          }
          return;
        }

        const content = data.content;
        setRetrievedContent(content);
        
        // Delete forever
        await deleteDoc(docRef);
        
        setStatus({ type: 'success', message: 'Clip retrieved! You can now copy it below.' });
        setInputCode('');
      } else {
        setStatus({ type: 'error', message: 'Invalid or expired code.' });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      <AnimatePresence>
        {!user && !isGuest && <LandingPage />}
      </AnimatePresence>

      <AnimatePresence>
        {user && !selectedTier && (
          <div className="fixed inset-0 z-[110] bg-[#141414]/90 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-[#E4E3E0] max-w-2xl w-full p-8 rounded-sm border-2 border-[#141414] shadow-[20px_20px_0px_0px_rgba(20,20,20,0.5)]"
            >
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl font-serif italic">Welcome, {user.displayName?.split(' ')[0]}</h2>
                <p className="text-sm opacity-60 uppercase tracking-widest font-bold">Select your workspace tier</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Free Tier */}
                <button 
                  onClick={() => setSelectedTier('free')}
                  className="p-6 border-2 border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group text-left flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-40 group-hover:opacity-100">Tier 01</div>
                    <h3 className="text-xl font-serif italic">Free</h3>
                    <ul className="text-[10px] space-y-2 opacity-60 group-hover:opacity-100 uppercase tracking-widest font-bold">
                      <li>• 10k Chars</li>
                      <li>• 60s Persistence</li>
                    </ul>
                  </div>
                  <div className="mt-8 text-[10px] font-bold uppercase tracking-widest border-t border-[#141414]/10 group-hover:border-[#E4E3E0]/20 pt-4">Select Free</div>
                </button>

                {/* Pro Tier */}
                <button 
                  onClick={() => setSelectedTier('pro')}
                  className="p-6 border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group text-left flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 group-hover:text-emerald-400">Tier 02</div>
                    <h3 className="text-xl font-serif italic">Pro</h3>
                    <ul className="text-[10px] space-y-2 opacity-60 group-hover:opacity-100 uppercase tracking-widest font-bold">
                      <li>• 100k Chars</li>
                      <li>• 24h Persistence</li>
                      <li>• Custom Codes</li>
                    </ul>
                  </div>
                  <div className="mt-8 text-[10px] font-bold uppercase tracking-widest border-t border-[#141414]/10 group-hover:border-[#E4E3E0]/20 pt-4">Select Pro</div>
                </button>

                {/* Pro Max Tier */}
                <button 
                  onClick={() => setSelectedTier('promax')}
                  className="p-6 border-2 border-[#141414] bg-[#141414] text-[#E4E3E0] hover:scale-[1.02] transition-all group text-left flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Tier 03</div>
                    <h3 className="text-xl font-serif italic">Pro Max</h3>
                    <ul className="text-[10px] space-y-2 opacity-60 uppercase tracking-widest font-bold">
                      <li>• Cloud Storage</li>
                      <li>• Active Tracking</li>
                      <li>• Instant Delete</li>
                    </ul>
                  </div>
                  <div className="mt-8 text-[10px] font-bold uppercase tracking-widest border-t border-[#E4E3E0]/20 pt-4">Select Pro Max</div>
                </button>
              </div>

              <button 
                onClick={handleLogout}
                className="mt-12 w-full text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity"
              >
                Cancel and Logout
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-[#E4E3E0]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#141414] rounded-sm flex items-center justify-center">
            <Share2 className="text-[#E4E3E0] w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">ClipCloud</h1>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {!isProMax && (
                <button 
                  onClick={() => setShowProModal(true)}
                  className="hidden md:flex items-center gap-2 bg-emerald-500 text-black px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95"
                >
                  <Zap className="w-3 h-3" />
                  Upgrade
                </button>
              )}
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none mb-1">{user.displayName}</div>
                <div className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full inline-block ${
                  isProMax ? 'bg-emerald-500 text-black' : isPro ? 'bg-blue-500 text-white' : 'bg-[#141414]/10 text-[#141414]/60'
                }`}>
                  {isProMax ? 'Pro Max' : isPro ? 'Pro' : 'Free'}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border border-[#141414] overflow-hidden">
                <img src={user.photoURL || ''} alt="" referrerPolicy="no-referrer" />
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-[#141414]/5 rounded-sm transition-colors"
                title="Logout"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowProModal(true)}
                className="text-[10px] font-bold uppercase tracking-widest border-b border-[#141414] pb-1 hover:opacity-50 transition-opacity"
              >
                View Tiers
              </button>
              <button 
                onClick={handleLogin}
                className="bg-[#141414] text-[#E4E3E0] px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/90 transition-all active:scale-95"
              >
                Login for Pro
              </button>
            </div>
          )}
          <button 
            onClick={() => setShowOnboarding(true)}
            className="text-[10px] uppercase tracking-widest font-bold border border-[#141414] px-2 py-1 rounded-sm hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
          >
            How it works
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 mt-12">
        {/* Tab Navigation */}
        <div className="flex border border-[#141414] mb-8 overflow-hidden rounded-sm">
          <button 
            onClick={() => { setActiveTab('share'); setStatus({ type: 'idle', message: '' }); }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'share' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
          >
            Share
          </button>
          <button 
            onClick={() => { setActiveTab('get'); setStatus({ type: 'idle', message: '' }); }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'get' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
          >
            Get
          </button>
          {user && (
            <button 
              onClick={() => { 
                if (!isProMax) {
                  setShowProModal(true);
                } else {
                  setActiveTab('dashboard'); 
                  setStatus({ type: 'idle', message: '' }); 
                }
              }}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'dashboard' ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-[#141414]/5'}`}
            >
              {isProMax ? 'Cloud Storage' : '🔒 Cloud Storage'}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="bg-white border border-[#141414] p-8 min-h-[400px] flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            {activeTab === 'share' ? (
              <motion.div 
                key="share-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 text-center"
              >
                {!code ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div className="text-left">
                          <h2 className="text-3xl font-serif italic">Share a clip</h2>
                          <p className="text-sm opacity-60">Paste your content below.</p>
                        </div>
                        {!isProMax && (
                          <button 
                            onClick={() => setShowProModal(true)}
                            className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            Upgrade to Pro Max
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
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
                          className="w-full h-40 p-4 border border-[#141414] rounded-sm font-mono text-sm focus:outline-none focus:ring-1 focus:ring-[#141414]/20 resize-none bg-[#F9F9F8]"
                        />
                        <div className={`absolute bottom-3 left-3 text-[10px] font-mono transition-colors ${
                          manualText.length >= (isPro ? 100000 : 10000) ? 'text-red-500 font-bold' : 'opacity-30'
                        }`}>
                          {manualText.length.toLocaleString()} / {(isPro ? 100000 : 10000).toLocaleString()}
                        </div>
                        <button 
                          onClick={tryAutoPaste}
                          className="absolute bottom-3 right-3 p-2 bg-[#141414] text-[#E4E3E0] rounded-sm hover:opacity-80 transition-opacity flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold"
                          title="Try to paste from clipboard automatically"
                        >
                          <Clipboard className="w-3 h-3" />
                          Auto-Paste
                        </button>
                      </div>

                      {isPro && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-[#141414]/5 p-4 rounded-sm space-y-4 text-left border border-[#141414]/10"
                        >
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Custom Code (Optional)</label>
                            <input 
                              type="text"
                              value={customCodeInput}
                              onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                              placeholder="MY-CUSTOM-CLIP"
                              className="w-full p-2 border border-[#141414] rounded-sm font-mono text-sm focus:outline-none"
                            />
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
                        </motion.div>
                      )}

                      <button 
                        onClick={handleShare}
                        disabled={status.type === 'loading' || !manualText.trim()}
                        className="w-full bg-[#141414] text-[#E4E3E0] py-6 rounded-sm font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {status.type === 'loading' ? <RefreshCw className="animate-spin w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                        Generate Code
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <div className="text-[10px] uppercase tracking-widest opacity-50 font-mono">Your Code</div>
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-6xl font-bold tracking-tighter font-mono">{code}</div>
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
                    
                    <div className="flex items-center justify-center gap-2 text-[#141414]/60">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-mono uppercase tracking-widest">Expires in {timeLeft}s</span>
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
                className="space-y-8"
              >
                <div className="space-y-4 text-center">
                  <h2 className="text-3xl font-serif italic">Retrieve a clip</h2>
                  <p className="text-sm opacity-60 max-w-xs mx-auto">
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
                    className="w-full text-center text-4xl font-bold font-mono py-6 border-b-2 border-[#141414] focus:outline-none placeholder:opacity-10"
                  />
                  
                  <button 
                    onClick={handleGet}
                    disabled={status.type === 'loading' || inputCode.length < 3}
                    className="w-full bg-[#141414] text-[#E4E3E0] py-6 rounded-sm font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {status.type === 'loading' ? <RefreshCw className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                    Get Clip
                  </button>
                </div>

                {retrievedContent && (
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
                        onClick={() => setRetrievedContent(null)}
                        className="hover:opacity-50 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="p-6 bg-white space-y-6">
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        <p className="text-sm font-mono whitespace-pre-wrap break-all text-[#141414]/80">
                          {retrievedContent}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleCopy(retrievedContent)}
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
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="dashboard-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {!isProMax ? (
                  <div className="text-center py-12 space-y-6">
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-[#141414]/5 rounded-2xl flex items-center justify-center mx-auto rotate-3 border border-[#141414]/5">
                        <ShieldCheck className="w-10 h-10 opacity-20" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-serif italic tracking-tighter">Pro Max Exclusive</h2>
                        <p className="text-sm opacity-50 max-w-[240px] mx-auto leading-relaxed">
                          Cloud Storage & Vault Recovery are reserved for Pro Max members.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowProModal(true)}
                      className="group relative bg-[#141414] text-[#E4E3E0] px-10 py-4 rounded-xl font-bold uppercase tracking-[0.3em] text-[10px] hover:scale-105 transition-all shadow-xl active:scale-95 overflow-hidden"
                    >
                      <span className="relative z-10">Upgrade to Pro Max</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 text-center">
                      <h2 className="text-3xl font-serif italic">My Active Clips</h2>
                      <p className="text-sm opacity-60 max-w-xs mx-auto">
                        Manage your currently shared content and codes.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {userClips.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-[#141414]/10 rounded-sm">
                          <p className="text-sm opacity-40 font-mono">No active clips found.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {userClips.map((clip) => {
                            const expiresAt = clip.expiresAt?.toDate();
                            const vaultUntil = clip.vaultUntil?.toDate();
                            const now = new Date();
                            const diff = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)) : 0;
                            const isExpired = diff === 0;
                            const isInVault = vaultUntil && vaultUntil.getTime() > now.getTime();
                            
                            if (isExpired && !isInVault) return null;

                            return (
                              <div key={clip.id} className={`border border-[#141414] p-4 rounded-sm flex items-center justify-between group transition-colors ${isExpired ? 'bg-amber-50/50 border-amber-200' : 'hover:bg-[#141414]/5'}`}>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-3">
                                    <span className={`text-xl font-bold font-mono tracking-tighter ${isExpired ? 'opacity-40' : ''}`}>{clip.id}</span>
                                    {isExpired ? (
                                      <span className="text-[9px] uppercase tracking-widest font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <ShieldCheck className="w-2 h-2" />
                                        In Vault
                                      </span>
                                    ) : (
                                      <span className="text-[9px] uppercase tracking-widest font-bold bg-[#141414] text-[#E4E3E0] px-2 py-0.5 rounded-full">
                                        Active
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] opacity-50 font-mono">
                                    <Clock className="w-3 h-3" />
                                    <span>{isExpired ? 'Expired' : `Expires in ${diff}s`}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isExpired ? (
                                    <button 
                                      onClick={() => handleReviveClip(clip.id)}
                                      className="flex items-center gap-2 bg-emerald-500 text-black px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all"
                                    >
                                      <Zap className="w-3 h-3" />
                                      Revive
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleCopy(clip.content)}
                                      className="p-2 hover:bg-[#141414] hover:text-[#E4E3E0] rounded-sm transition-all"
                                      title="Copy content"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDeleteClip(clip.id)}
                                    className="p-2 hover:bg-red-500 hover:text-white rounded-sm transition-all text-red-500"
                                    title="Delete Now"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Messages */}
          <AnimatePresence>
            {status.message && status.type !== 'loading' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`absolute bottom-4 left-4 right-4 p-3 border flex items-center gap-3 text-xs font-bold uppercase tracking-wider rounded-sm ${
                  status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {status.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <footer className="mt-12 grid grid-cols-3 gap-4 border-t border-[#141414]/10 pt-8">
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest font-bold">Secure</div>
            <p className="text-[10px] opacity-50">Clips are encrypted in transit and deleted immediately after retrieval.</p>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest font-bold">Universal</div>
            <p className="text-[10px] opacity-50">Works on any device with a web browser. No account required.</p>
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest font-bold">Fast</div>
            <p className="text-[10px] opacity-50">Instant codes make sharing seamless across your workspace.</p>
          </div>
        </footer>
      </main>

      {/* Background Grid Accent */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[-1]" 
           style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Pro Modal - Refined Centered Design */}
      <AnimatePresence>
        {showProModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#141414]/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="max-w-5xl w-full bg-[#0A0A0A] text-white rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col md:flex-row relative"
            >
              <button 
                onClick={() => setShowProModal(false)}
                className="absolute top-6 right-6 z-20 p-2 hover:bg-white/10 rounded-full transition-colors group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>

              {/* Left Side: Brand & Tiers */}
              <div className="flex-1 p-8 md:p-12 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-white/10 bg-gradient-to-br from-[#0A0A0A] to-[#111]">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center rotate-3">
                      <Zap className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-60">ClipCloud Premium</span>
                  </div>
                  
                  <h2 className="text-5xl md:text-6xl font-serif italic leading-[0.9] tracking-tighter mb-10">
                    Elevate Your<br />Workflow.
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="p-5 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500">Free Tier</h4>
                        <span className="text-[9px] opacity-30 uppercase tracking-widest">Current</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-serif italic">$0</span>
                        <span className="text-[10px] opacity-30 uppercase tracking-widest">Forever</span>
                      </div>
                      <p className="text-[11px] opacity-40 leading-relaxed">10k characters, 60s persistence. Basic sharing for quick tasks.</p>
                    </div>

                    <div className="p-5 border border-blue-500/20 rounded-2xl bg-blue-500/5 hover:bg-blue-500/10 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl -mr-12 -mt-12" />
                      <div className="flex justify-between items-center mb-2 relative z-10">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-400">Pro Tier</h4>
                        <span className="text-[9px] text-blue-400 font-bold uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded-full">Popular</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2 relative z-10">
                        <span className="text-2xl font-serif italic">$2.99</span>
                        <span className="text-[10px] opacity-30 uppercase tracking-widest">/mo</span>
                      </div>
                      <p className="text-[11px] opacity-40 leading-relaxed">100k characters, 24h persistence, custom codes. For power users.</p>
                    </div>

                    <div className="p-5 border border-emerald-500/30 rounded-2xl bg-emerald-500/5 hover:bg-emerald-500/10 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl -mr-12 -mt-12" />
                      <div className="flex justify-between items-center mb-2 relative z-10">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">Pro Max</h4>
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-full">Ultimate</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-2 relative z-10">
                        <span className="text-2xl font-serif italic">$4.99</span>
                        <span className="text-[10px] opacity-30 uppercase tracking-widest">/mo</span>
                      </div>
                      <p className="text-[11px] opacity-40 leading-relaxed">Cloud Storage, Vault Recovery, Priority Support. The complete suite.</p>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-12 pt-8 border-t border-white/5">
                  <div className="text-[9px] uppercase tracking-[0.3em] opacity-30 mb-3">Powering modern teams</div>
                  <div className="flex gap-6 opacity-20 grayscale text-sm font-serif italic">
                    <span>Designers</span>
                    <span>Developers</span>
                    <span>Writers</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Features & Action */}
              <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-[#050505] relative">
                <div className="max-w-sm mx-auto w-full space-y-10">
                  <div className="space-y-6">
                    {[
                      { icon: <Clock className="w-4 h-4" />, title: "24h Persistence", desc: "Clips that last as long as your workday." },
                      { icon: <FileText className="w-4 h-4" />, title: "100K Characters", desc: "Share entire source files without truncation." },
                      { icon: <Type className="w-4 h-4" />, title: "Custom Codes", desc: "Branded identifiers like 'PROJECT-ALPHA'." },
                      { icon: <ShieldCheck className="w-4 h-4" />, title: "The Vault", desc: "Recover expired clips for up to 7 days." }
                    ].map((feature, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex gap-5 group"
                      >
                        <div className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center shrink-0 group-hover:border-emerald-500/50 transition-colors bg-white/5">
                          {feature.icon}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-[11px] uppercase tracking-widest font-bold text-emerald-500">{feature.title}</h4>
                          <p className="text-xs opacity-40 font-light leading-relaxed">{feature.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-white/10 space-y-6">
                    <div className="flex items-end justify-between">
                      <div className="space-y-0.5">
                        <div className="text-[9px] uppercase tracking-[0.3em] opacity-40">Monthly Plan</div>
                        <div className="text-4xl font-serif italic">$4.99<span className="text-sm opacity-30 not-italic ml-2">/mo</span></div>
                      </div>
                      <div className="text-right">
                        <div className="inline-block px-3 py-1 rounded-full border border-emerald-500/20 text-[9px] uppercase tracking-widest text-emerald-500 font-bold">
                          All Features Included
                        </div>
                      </div>
                    </div>

                    {!user ? (
                      <button 
                        onClick={() => {
                          handleLogin();
                          setShowProModal(false);
                        }}
                        className="w-full bg-emerald-500 text-black py-5 rounded-xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.15)] active:scale-[0.98]"
                      >
                        Login to Upgrade
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedTier('promax');
                          setShowProModal(false);
                          setStatus({ type: 'success', message: 'Pro Max Unlocked! Cloud Storage is now active.' });
                        }}
                        className="w-full bg-emerald-500 text-black py-5 rounded-xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.15)] active:scale-[0.98]"
                      >
                        {isProMax ? 'Already Pro Max' : 'Upgrade to Pro Max'}
                      </button>
                    )}

                    <div className="flex items-center justify-center gap-4 opacity-20">
                      <div className="h-[1px] flex-1 bg-white/20" />
                      <span className="text-[8px] uppercase tracking-[0.4em]">Secure via Stripe</span>
                      <div className="h-[1px] flex-1 bg-white/20" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#141414]/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#E4E3E0] border-2 border-[#141414] max-w-md w-full p-8 rounded-sm shadow-2xl space-y-8"
            >
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 bg-[#141414] rounded-sm flex items-center justify-center mx-auto mb-4">
                  <Share2 className="text-[#E4E3E0] w-6 h-6" />
                </div>
                <h2 className="text-3xl font-serif italic font-bold">Welcome to ClipCloud</h2>
                <p className="text-xs uppercase tracking-widest opacity-60 font-mono">Universal Clipboard</p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center font-mono text-xs shrink-0">01</div>
                  <div className="space-y-1">
                    <p className="font-bold uppercase text-xs tracking-wider">Paste & Share</p>
                    <p className="text-sm opacity-70">Paste any text on your first device to generate a secure 8-character code.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center font-mono text-xs shrink-0">02</div>
                  <div className="space-y-1">
                    <p className="font-bold uppercase text-xs tracking-wider">Retrieve Anywhere</p>
                    <p className="text-sm opacity-70">Enter that code on any other device to instantly fetch your content.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center font-mono text-xs shrink-0">03</div>
                  <div className="space-y-1">
                    <p className="font-bold uppercase text-xs tracking-wider">Secure by Design</p>
                    <p className="text-sm opacity-70">Clips expire in 60 seconds and are permanently deleted after retrieval.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={completeOnboarding}
                className="w-full bg-[#141414] text-[#E4E3E0] py-4 rounded-sm font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Got it, let's go
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
