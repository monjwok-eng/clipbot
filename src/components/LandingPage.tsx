import React, { useState, useEffect } from 'react';
import { SendarroLogo } from './SendarroLogo';
import { 
  Share2, 
  Zap, 
  HelpCircle, 
  Copy, 
  Check, 
  Laptop, 
  Smartphone, 
  Code2, 
  FileText, 
  Link as LinkIcon, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Clock,
  Lock,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onLogin: () => void;
  onGuest: () => void;
  onHowItWorks?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onGuest, onHowItWorks }) => {
  // Interactive Live Demo Simulator State
  const [demoTab, setDemoTab] = useState<'code' | 'text' | 'link' | 'custom'>('code');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [customText, setCustomText] = useState('');
  const [demoCode, setDemoCode] = useState('7X9K2P');
  const [countdown, setCountdown] = useState(58);

  // Simulated countdown for the ephemeral demo clip
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut listener for power users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'g' || e.key === 'G') {
        onGuest();
      } else if (e.key === 'l' || e.key === 'L') {
        onLogin();
      } else if (e.key === 'h' || e.key === 'H' || e.key === '?') {
        if (onHowItWorks) onHowItWorks();
        else onGuest();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGuest, onLogin, onHowItWorks]);

  const handleCopyDemoCode = () => {
    try {
      navigator.clipboard.writeText(demoCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getDemoContent = () => {
    switch (demoTab) {
      case 'code':
        return `// Send encrypted payload to another device\nconst clip = await clipcloud.sync({\n  secret: "sk_live_948f2",\n  burnOnRead: true,\n  ttl: "60s"\n});`;
      case 'text':
        return `Design Team Sync notes:\n• Finalized cross-platform clipboard specs\n• Wi-Fi passcode: Studio-5GHz / pass991\n• Presentation deck in Figma folder`;
      case 'link':
        return `https://www.figma.com/design/clipcloud-v2/specs?node-id=402-instant-transfer`;
      case 'custom':
        return customText.trim() || 'Type anything above to test live device sync...';
    }
  };

  const handleCopyContent = () => {
    try {
      navigator.clipboard.writeText(getDemoContent());
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#E4E3E0] flex flex-col justify-between p-4 sm:p-6 md:p-8 overflow-y-auto font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Background Architectural Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.22]" 
        style={{
          backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} 
      />

      {/* Modern Top Precision Micro-Bar */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-[#141414]/15 text-xs text-neutral-600">
        <div className="flex items-center gap-3 font-mono tracking-tight text-[11px] sm:text-xs">
          <span className="font-bold uppercase tracking-wider text-[#141414]">Sendarro // Relay</span>
          <span className="text-neutral-400">·</span>
          <span className="hidden sm:inline">Peer-to-Peer In-Memory Transport</span>
          <span className="hidden sm:inline text-neutral-400">·</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Sync Active
          </span>
        </div>

        <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-neutral-500">
          <span>Shortcuts:</span>
          <span className="bg-white border border-[#141414]/20 px-1.5 py-0.5 rounded text-[10px] text-[#141414] font-bold">[G] Guest</span>
          <span className="bg-white border border-[#141414]/20 px-1.5 py-0.5 rounded text-[10px] text-[#141414] font-bold">[L] Login</span>
        </div>
      </div>

      {/* Main Grid Hero Section */}
      <div className="relative z-10 max-w-6xl w-full mx-auto grid lg:grid-cols-12 gap-8 lg:gap-12 items-center py-6 sm:py-10 my-auto">
        
        {/* Left Column: Brand, Headline, Value Prop & Modern Interactive Live Demo */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          
          {/* Brand & Headline */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <SendarroLogo className="h-10 sm:h-12 md:h-14 max-h-14" />
            </div>

            <h2 className="text-4xl sm:text-6xl md:text-7xl font-sans font-extrabold leading-tight tracking-tight text-slate-900">
              Seamless<br />Sharing.
            </h2>
          </div>

          <p className="text-sm md:text-base text-slate-600 font-normal leading-relaxed max-w-xl">
            The universal clipboard for your workspace. Share text, code, and links across devices instantly.
          </p>

          {/* Interactive Live Demo / Live Clipboard Simulator */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {/* Simulator Header */}
            <div className="bg-[#141414] text-[#E4E3E0] px-4 py-2.5 flex items-center justify-between border-b border-[#141414]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></div>
                <span className="ml-2 text-xs font-mono tracking-wider font-semibold uppercase text-neutral-300">Live Clipboard Simulation</span>
              </div>

              {/* Simulated Code Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">Access Code:</span>
                <button
                  onClick={handleCopyDemoCode}
                  className="bg-[#242424] hover:bg-[#303030] border border-neutral-700 text-neutral-200 px-2 py-0.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy Access Code"
                >
                  <span className="text-emerald-400">#{demoCode}</span>
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                </button>
              </div>
            </div>

            {/* Interactive Mode Tabs */}
            <div className="flex border-b border-[#141414]/15 bg-neutral-100 px-3 py-1.5 gap-2 items-center overflow-x-auto">
              <span className="text-[10px] uppercase font-bold text-neutral-500 font-mono tracking-wider mr-1">Preview:</span>
              <button
                onClick={() => setDemoTab('code')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                  demoTab === 'code' 
                    ? 'bg-[#141414] text-white shadow-xs font-bold' 
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Code
              </button>
              <button
                onClick={() => setDemoTab('text')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                  demoTab === 'text' 
                    ? 'bg-[#141414] text-white shadow-xs font-bold' 
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Notes
              </button>
              <button
                onClick={() => setDemoTab('link')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                  demoTab === 'link' 
                    ? 'bg-[#141414] text-white shadow-xs font-bold' 
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Figma URL
              </button>
              <button
                onClick={() => setDemoTab('custom')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                  demoTab === 'custom' 
                    ? 'bg-[#141414] text-white shadow-xs font-bold' 
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Try Live
              </button>
            </div>

            {/* Custom Input (if user wants to test typing their own content) */}
            {demoTab === 'custom' && (
              <div className="p-3 bg-white border-b border-[#141414]/15 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type anything to test instant transfer..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="flex-1 bg-neutral-50 border border-neutral-300 rounded px-3 py-1.5 text-xs text-[#141414] focus:outline-none focus:border-[#141414] font-mono"
                />
                <button
                  onClick={() => {
                    setDemoCode(Math.random().toString(36).substring(2, 8).toUpperCase());
                  }}
                  className="bg-[#141414] text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  Clip
                </button>
              </div>
            )}

            {/* Content Display */}
            <div className="p-4 relative">
              <pre className="text-xs sm:text-sm font-mono text-[#141414] whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-36 custom-scrollbar bg-white/70 p-3 rounded border border-neutral-200/70">
                {getDemoContent()}
              </pre>

              <button
                onClick={handleCopyContent}
                className="absolute top-6 right-6 p-1.5 bg-white border border-[#141414] rounded hover:bg-[#141414] hover:text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-bold font-mono"
                title="Copy demo snippet"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 text-[10px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Telemetry Footer with Animated Device Bridge */}
            <div className="bg-neutral-100/90 border-t border-[#141414]/15 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600 font-mono">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-neutral-700" />
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="h-0.5 w-6 bg-emerald-500/50"></span>
                  <ArrowRight className="w-3 h-3 text-emerald-600 -ml-1" />
                </div>
                <Smartphone className="w-4 h-4 text-neutral-700" />
                <span className="text-[11px] font-semibold text-neutral-800 ml-1">Synced in 24ms</span>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-neutral-500">
                  <Clock className="w-3 h-3" />
                  Auto-destruct: <strong className="text-neutral-800 font-bold tabular-nums">{countdown}s</strong>
                </span>
                <span className="text-neutral-300">·</span>
                <span className="flex items-center gap-1 text-neutral-600 font-medium">
                  <Lock className="w-3 h-3 text-neutral-500" />
                  E2E Encrypted
                </span>
              </div>
            </div>
          </div>

          {/* Clean Editorial Micro-Features Strip */}
          <div className="pt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-neutral-700">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant 8-char Code or QR</span>
            </div>
            <span aria-hidden="true" className="text-neutral-400">·</span>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Burn On Read & Self-Destruct</span>
            </div>
            <span aria-hidden="true" className="text-neutral-400">·</span>
            <div className="flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Mac · Windows · iOS · Android</span>
            </div>
          </div>

        </div>

        {/* Right Column: Original Core Action Card (Fully Preserved + Elevated) */}
        <div className="lg:col-span-5">
          <div className="bg-white border-2 border-[#141414] p-6 sm:p-8 rounded-md shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] md:shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] space-y-6 md:space-y-7 relative">
            
            {/* Corner Decorative Crosshair Accents */}
            <div className="absolute top-2 left-2 text-[#141414]/30 font-mono text-[9px] pointer-events-none">+</div>
            <div className="absolute top-2 right-2 text-[#141414]/30 font-mono text-[9px] pointer-events-none">+</div>
            <div className="absolute bottom-2 left-2 text-[#141414]/30 font-mono text-[9px] pointer-events-none">+</div>
            <div className="absolute bottom-2 right-2 text-[#141414]/30 font-mono text-[9px] pointer-events-none">+</div>

            {/* Header Badge in Card */}
            <div className="flex items-center justify-between border-b border-[#141414]/15 pb-4">
              <div>
                <h3 className="text-base font-bold uppercase tracking-wider text-[#141414]">Get Started</h3>
                <p className="text-xs text-neutral-500">Select an access mode to begin sharing</p>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest bg-[#141414] text-[#E4E3E0] px-2 py-0.5 rounded font-bold">v2.4</span>
            </div>

            {/* Primary Action 1: Login with Google */}
            <div className="space-y-3">
              <button 
                onClick={onLogin}
                className="w-full bg-[#141414] text-[#E4E3E0] py-4 md:py-5 px-4 rounded-md font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-between gap-3 text-xs md:text-sm cursor-pointer shadow-[3px_3px_0px_0px_rgba(20,20,20,0.2)] group"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                  <span>Login with Google</span>
                </div>
                <span className="font-mono text-[10px] text-neutral-400 border border-neutral-700 px-1.5 py-0.5 rounded">
                  [L]
                </span>
              </button>
              
              <div className="flex items-center justify-between text-xs text-neutral-600 px-1">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Unlock 100k chars & 24h persistence
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#141414]/15"></div>
              </div>
              <span className="relative px-4 bg-white text-xs uppercase tracking-wider text-neutral-500 font-bold font-mono">Or</span>
            </div>

            {/* Primary Action 2: Continue as Guest */}
            <div className="space-y-3">
              <button 
                onClick={onGuest}
                className="w-full border-2 border-[#141414] text-[#141414] bg-neutral-50 hover:bg-[#141414] hover:text-[#E4E3E0] py-4 md:py-5 px-4 rounded-md font-bold uppercase tracking-[0.2em] active:scale-[0.98] transition-all flex items-center justify-between gap-3 text-xs md:text-sm cursor-pointer group shadow-[3px_3px_0px_0px_rgba(20,20,20,0.15)]"
              >
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Continue as Guest</span>
                </div>
                <span className="font-mono text-[10px] text-neutral-500 group-hover:text-neutral-400 border border-[#141414]/30 px-1.5 py-0.5 rounded">
                  [G]
                </span>
              </button>

              <div className="flex items-center justify-between text-xs text-neutral-600 px-1">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-neutral-600">
                  Limited to 10k chars & 60s clips
                </span>
                <span className="text-[10px] font-mono text-neutral-400">No account required</span>
              </div>
            </div>

            {/* Quick Feature Comparison Matrix (Clean, unboxed & informative) */}
            <div className="pt-2 border-t border-[#141414]/10 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-[11px] text-neutral-600 py-1 border-b border-neutral-100">
                <span className="text-neutral-500">Ephemeral Transfers:</span>
                <span className="font-bold text-[#141414]">Free / Instant (Guest)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-600 py-1">
                <span className="text-neutral-500">Persistent Cloud Vault:</span>
                <span className="font-bold text-[#141414]">Google Account</span>
              </div>
            </div>

            {/* How it works Button */}
            <div className="pt-2 flex justify-center border-t border-[#141414]/15">
              <button 
                onClick={() => {
                  if (onHowItWorks) {
                    onHowItWorks();
                  } else {
                    onGuest();
                  }
                }}
                className="text-xs uppercase tracking-wider font-bold text-neutral-600 hover:text-neutral-950 transition-colors flex items-center gap-2 cursor-pointer py-1 px-3 rounded hover:bg-neutral-100"
              >
                <HelpCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-700" />
                How it works
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Modern Bottom Precision Protocol Footer */}
      <div className="relative z-10 w-full max-w-6xl mx-auto pt-4 border-t border-[#141414]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 font-mono">
        <div className="uppercase tracking-[0.2em] font-semibold text-center sm:text-left">
          Universal Clipboard Protocol v2.4
        </div>
        <div className="flex items-center gap-4 text-[11px] text-neutral-500">
          <span>End-to-End Encrypted</span>
          <span className="text-neutral-300">·</span>
          <span>Zero Server Footprint</span>
          <span className="text-neutral-300">·</span>
          <span>Fast Handoff</span>
        </div>
      </div>
    </div>
  );
};
