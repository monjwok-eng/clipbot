import React from 'react';
import { SendarroLogo } from './SendarroLogo';
import { 
  Share2, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Upload, 
  QrCode, 
  FileText, 
  CheckCircle2, 
  HelpCircle, 
  LogIn, 
  User as UserIcon,
  Copy,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { User } from 'firebase/auth';

interface MainLandingPageProps {
  onNavigateToAuth: () => void;
  onNavigateToShare: () => void;
  onNavigateToProduct: () => void;
  onNavigateToPricing: () => void;
  onOpenHowItWorks: () => void;
  onOpenLegal: () => void;
  onUpgradeClick: () => void;
  user: User | null;
  isGuest: boolean;
  tier: 'free' | 'pro' | 'promax';
}

export const MainLandingPage: React.FC<MainLandingPageProps> = ({
  onNavigateToAuth,
  onNavigateToShare,
  onNavigateToProduct,
  onNavigateToPricing,
  onOpenHowItWorks,
  onOpenLegal,
  onUpgradeClick,
  user,
  isGuest,
  tier
}) => {
  const isAuthenticated = Boolean(user || isGuest);
  const isPro = tier === 'pro' || tier === 'promax';
  const isProMax = tier === 'promax';

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0] flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#E4E3E0]/95 backdrop-blur-md border-b border-[#141414] px-4 sm:px-8 py-3.5 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <SendarroLogo className="h-10 sm:h-12 md:h-14 max-h-14" />
          </div>

          <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 font-serif italic text-base sm:text-lg font-medium text-neutral-950 tracking-wide">
            <button onClick={onNavigateToShare} className="hover:text-black transition-colors cursor-pointer">Transfer</button>
            <button onClick={onNavigateToProduct} className="hover:text-black transition-colors cursor-pointer">Product</button>
            <button onClick={onNavigateToPricing} className="hover:text-black transition-colors cursor-pointer">Pricing</button>
            <a href="#features" className="hover:text-black transition-colors not-italic font-sans text-xs uppercase tracking-widest font-bold text-neutral-700">Features</a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={onNavigateToShare}
                  className="bg-[#141414] text-[#E4E3E0] px-4 sm:px-5 py-2 sm:py-2.5 rounded-sm font-bold uppercase tracking-[0.15em] text-xs hover:bg-[#141414]/90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] cursor-pointer"
                >
                  <span>Go to Sharing App</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={onNavigateToAuth}
                  className="hidden sm:flex border border-[#141414] text-[#141414] px-4 py-2 rounded-sm font-bold uppercase tracking-wider text-xs hover:bg-[#141414]/5 transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={onNavigateToAuth}
                  className="bg-[#141414] text-[#E4E3E0] px-4 sm:px-5 py-2 sm:py-2.5 rounded-sm font-bold uppercase tracking-[0.15em] text-xs hover:bg-[#141414]/90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Start Sharing</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24 max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#141414] rounded-sm text-[11px] font-mono uppercase tracking-widest font-semibold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Universal Clipboard Protocol • No Apps Needed
            </div>

            <div className="space-y-3">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-serif italic tracking-tighter leading-[0.88] text-[#141414]">
                Seamless<br />Sharing.
              </h1>
              <p className="text-base sm:text-xl text-neutral-700 font-normal leading-relaxed max-w-xl pt-2">
                The universal clipboard for your workspace. Beam text snippets, code, and files between phones, laptops, and tablets in seconds.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={onNavigateToShare}
                className="bg-[#141414] text-[#E4E3E0] px-6 sm:px-8 py-4 sm:py-4.5 rounded-sm font-bold uppercase tracking-[0.2em] text-xs sm:text-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] transition-all flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] cursor-pointer"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Launch Sharing Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onNavigateToAuth}
                className="border-2 border-[#141414] bg-white text-[#141414] px-6 sm:px-8 py-4 sm:py-4.5 rounded-sm font-bold uppercase tracking-[0.2em] text-xs sm:text-sm hover:bg-[#141414]/5 transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Login & Guest Options</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-mono font-medium text-neutral-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Free Guest Session</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Instant QR & 8-Digit Codes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Auto-Purge Security</span>
              </div>
            </div>
          </div>

          {/* Interactive Hero Visual Mockup */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white border-2 border-[#141414] rounded-sm p-6 sm:p-7 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] space-y-5">
              <div className="flex items-center justify-between border-b border-[#141414]/15 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400 border border-[#141414]"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400 border border-[#141414]"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400 border border-[#141414]"></div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-600 ml-1">Live Beamer</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 rounded-xs">
                  Active
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
                  <span>Transfer Code</span>
                  <span>Expires in 59s</span>
                </div>
                <div className="p-4 bg-[#F9F9F8] border border-[#141414] rounded-sm flex items-center justify-between">
                  <span className="text-2xl sm:text-3xl font-mono font-extrabold tracking-widest text-[#141414]">
                    7K9R2M8P
                  </span>
                  <div className="p-2 bg-[#141414] text-[#E4E3E0] rounded-xs shadow-sm">
                    <Copy className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-sm space-y-1.5 text-left">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider font-mono">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Annual_Design_Review.pdf</span>
                </div>
                <div className="flex justify-between text-[11px] font-mono text-blue-800">
                  <span>14.8 MB • Multi-file payload</span>
                  <span className="font-bold">100% Streamed</span>
                </div>
                <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-full"></div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3 text-xs font-mono text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-neutral-700" />
                  Burn on read ready
                </span>
                <button
                  onClick={onNavigateToShare}
                  className="text-xs font-bold uppercase tracking-wider underline hover:text-[#141414] transition-colors cursor-pointer"
                >
                  Try It Live →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="border-t-2 border-[#141414] bg-white py-16 sm:py-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-3 text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.25em] font-mono font-bold text-neutral-500">
              Architecture & Features
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif italic font-bold tracking-tight text-[#141414]">
              Engineered for Zero Friction
            </h2>
            <p className="text-neutral-700 text-sm sm:text-base leading-relaxed">
              Forget emailing files to yourself or setting up messy shared folders. Sendarro is your ephemeral lightning beam.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="border border-[#141414] p-6 sm:p-7 rounded-sm bg-[#E4E3E0]/40 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-4 text-left">
              <div className="w-10 h-10 bg-[#141414] rounded-sm flex items-center justify-center text-white">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-[#141414]">8-Digit Beaming</h3>
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-mono">
                Generate high-entropy shortcodes and high-density QR codes to pull text and files on any computer without logging into anything.
              </p>
            </div>

            <div className="border border-[#141414] p-6 sm:p-7 rounded-sm bg-[#E4E3E0]/40 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-4 text-left">
              <div className="w-10 h-10 bg-[#141414] rounded-sm flex items-center justify-center text-white">
                <Upload className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-[#141414]">Multi-File Payload</h3>
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-mono">
                Drop archives, code snippets, high-resolution imagery, and PDFs with real-time byte telemetry up to 2GB per bundle.
              </p>
            </div>

            <div className="border border-[#141414] p-6 sm:p-7 rounded-sm bg-[#E4E3E0]/40 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-4 text-left">
              <div className="w-10 h-10 bg-[#141414] rounded-sm flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-[#141414]">Ephemeral Privacy</h3>
              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-mono">
                Clips expire automatically in 60s, 1h, or 24h. Toggle Burn on Read to delete payloads the exact instant they are downloaded.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full border-t border-[#141414]">
        <div className="space-y-12">
          <div className="space-y-3 text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.25em] font-mono font-bold text-neutral-500">
              3 Simple Steps
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif italic font-bold tracking-tight text-[#141414]">
              How Sharing Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white border-2 border-[#141414] p-6 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold bg-[#141414] text-white px-2 py-0.5 rounded-xs">STEP 01</span>
                <FileText className="w-5 h-5 text-neutral-600" />
              </div>
              <h3 className="text-base font-bold uppercase tracking-wider text-[#141414]">Input Content</h3>
              <p className="text-xs text-neutral-700 leading-relaxed font-mono">
                Paste your text, code snippets, or drag and drop any file attachments right into the sharing box.
              </p>
            </div>

            <div className="bg-white border-2 border-[#141414] p-6 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold bg-[#141414] text-white px-2 py-0.5 rounded-xs">STEP 02</span>
                <QrCode className="w-5 h-5 text-neutral-600" />
              </div>
              <h3 className="text-base font-bold uppercase tracking-wider text-[#141414]">Generate Code</h3>
              <p className="text-xs text-neutral-700 leading-relaxed font-mono">
                Click Generate Code. You immediately get an 8-character code and QR code with a countdown timer.
              </p>
            </div>

            <div className="bg-white border-2 border-[#141414] p-6 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold bg-[#141414] text-white px-2 py-0.5 rounded-xs">STEP 03</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold uppercase tracking-wider text-[#141414]">Retrieve Anywhere</h3>
              <p className="text-xs text-neutral-700 leading-relaxed font-mono">
                Open Sendarro on your other device, switch to GET, enter the code or scan the QR, and download instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tiers & Comparison Section */}
      <section id="tiers" className="border-t-2 border-[#141414] bg-[#F4F3F0] py-16 sm:py-20 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-3 text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.25em] font-mono font-bold text-neutral-500">
              Access Levels
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif italic font-bold tracking-tight text-[#141414]">
              Choose Your Power
            </h2>
            <p className="text-neutral-700 text-sm sm:text-base leading-relaxed">
              Start free as a guest with zero registration, or sign in to unlock massive character limits, custom aliases, and Pro Max tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {/* Free Guest */}
            <div className="bg-white border-2 border-[#141414] p-6 sm:p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-wider">Free Guest</h3>
                    <p className="text-xs text-neutral-600 font-mono">Instant single-device access</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#141414]/10 px-2 py-1 rounded-xs">
                    $0
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs font-mono text-neutral-700 pt-2 border-t border-[#141414]/15">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>10,000 character limit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Up to 10MB file transfers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>60s fast-purge clips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No registration required</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onNavigateToAuth}
                className="w-full border-2 border-[#141414] py-3 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors cursor-pointer"
              >
                Use as Guest
              </button>
            </div>

            {/* Pro */}
            <div className="bg-white border-2 border-[#141414] p-6 sm:p-8 rounded-sm shadow-[8px_8px_0px_0px_rgba(16,185,129,1)] flex flex-col justify-between space-y-6 relative">
              <div className="absolute -top-3 left-6 bg-emerald-500 text-black text-[10px] font-bold font-mono uppercase tracking-widest px-2.5 py-0.5 border border-[#141414]">
                Popular Choice
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span>Pro</span>
                      <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                    </h3>
                    <p className="text-xs text-neutral-600 font-mono">Sign in with Google</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-1 rounded-xs">
                    $2.99 / mo
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs font-mono text-neutral-700 pt-2 border-t border-[#141414]/15">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>500MB</strong> file upload ceiling (R2)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>100,000</strong> character limit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>24-Hour clip persistence</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Custom code aliases &amp; Burn on Read</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onNavigateToAuth}
                className="w-full bg-[#141414] text-[#E4E3E0] py-3 rounded-sm font-bold uppercase tracking-widest text-xs hover:bg-[#141414]/90 transition-colors shadow-sm cursor-pointer"
              >
                Sign In with Google
              </button>
            </div>

            {/* Pro Max */}
            <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] p-6 sm:p-8 rounded-sm shadow-[8px_8px_0px_0px_rgba(59,130,246,1)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-400">
                      <span>Pro Max</span>
                      <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />
                    </h3>
                    <p className="text-xs text-neutral-400 font-mono">Teams, Classrooms & Power Users</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-blue-900/60 text-blue-200 border border-blue-500 px-2 py-1 rounded-xs">
                    $7.99 / mo
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs font-mono text-neutral-300 pt-2 border-t border-white/20">
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />
                    <span><strong>2GB</strong> file upload ceiling via R2</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />
                    <span><strong>Collection Boxes</strong> + Deadlines &amp; ZIP</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />
                    <span>7-Day Locked Vault recovery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />
                    <span>Google Drive & Cloud Integrations</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onUpgradeClick}
                className="w-full bg-blue-500 hover:bg-blue-400 text-black py-3 rounded-sm font-bold uppercase tracking-widest text-xs transition-colors cursor-pointer"
              >
                Get Pro Max
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t-2 border-[#141414] bg-[#E4E3E0] py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-600">
          <div className="flex items-center gap-2">
            <img src="/sendarro-logo.png" alt="Sendarro" className="h-5 object-contain" />
            <span>• Universal Clipboard Protocol v2.4</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenLegal} className="hover:text-neutral-950 underline cursor-pointer">
              Terms & Privacy
            </button>
            <button onClick={onOpenHowItWorks} className="hover:text-neutral-950 underline cursor-pointer">
              How It Works
            </button>
            <button onClick={onNavigateToAuth} className="hover:text-neutral-950 underline cursor-pointer">
              Login / Guest Page
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
