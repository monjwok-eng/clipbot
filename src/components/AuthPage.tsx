import React from 'react';
import { SendarroLogo } from './SendarroLogo';
import { 
  Share2, 
  Zap, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';
import { User } from 'firebase/auth';

interface AuthPageProps {
  onLogin: () => void;
  onGuest: () => void;
  onNavigateToMain: () => void;
  onNavigateToShare: () => void;
  onOpenHowItWorks: () => void;
  onOpenTerms: () => void;
  onLogout?: () => void;
  user: User | null;
  isGuest: boolean;
  tier: 'free' | 'pro' | 'promax';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLogin,
  onGuest,
  onNavigateToMain,
  onNavigateToShare,
  onOpenHowItWorks,
  onOpenTerms,
  onLogout,
  user,
  isGuest,
  tier
}) => {
  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0] flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between pb-6">
        <button
          onClick={onNavigateToMain}
          className="flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider font-bold text-neutral-700 hover:text-neutral-950 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Main Page</span>
        </button>

        <div className="flex items-center gap-2">
          <SendarroLogo className="h-10 sm:h-12 md:h-14 max-h-14" />
        </div>

        <button
          onClick={onNavigateToShare}
          className="text-xs uppercase tracking-wider font-bold text-neutral-700 hover:text-neutral-950 underline underline-offset-4 cursor-pointer hidden sm:block"
        >
          Open Sharing Page
        </button>
      </header>

      {/* Main Auth Container */}
      <main className="max-w-4xl w-full mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center my-auto py-6 sm:py-10">
        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <SendarroLogo className="h-10 sm:h-12 md:h-14 max-h-14" />
            </div>
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-serif italic leading-[0.85] tracking-tighter text-[#141414]">
              Seamless<br />Sharing.
            </h2>
          </div>
          <p className="text-sm sm:text-lg text-neutral-700 font-normal leading-relaxed max-w-md">
            The universal clipboard for your workspace. Share text, code, and links across devices instantly.
          </p>

          <div className="hidden md:flex flex-col gap-2 pt-2 text-xs font-mono text-neutral-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-neutral-800" />
              <span>Zero-knowledge temporary transfer</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>No software or browser extension required</span>
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-[#141414] p-6 sm:p-8 rounded-md shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] md:shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] space-y-6">
          {user ? (
            /* Logged-in state view */
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-sm space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Signed In to Sendarro</span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-10 h-10 rounded-sm border border-[#141414]" />
                  ) : (
                    <div className="w-10 h-10 rounded-sm bg-[#141414] text-white flex items-center justify-center font-bold">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#141414] truncate">{user.displayName || 'Google User'}</p>
                    <p className="text-xs text-neutral-600 font-mono truncate">{user.email}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-[#141414] text-white rounded-xs">
                    {tier.toUpperCase()}
                  </span>
                </div>
              </div>

              <button
                onClick={onNavigateToShare}
                className="w-full bg-[#141414] text-[#E4E3E0] py-4 rounded-md font-bold uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs sm:text-sm cursor-pointer shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]"
              >
                <span>Continue to Sharing App</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 flex justify-between items-center text-xs">
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="font-bold text-red-700 hover:text-red-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
                <button
                  onClick={onNavigateToMain}
                  className="font-bold text-neutral-600 hover:text-neutral-950 underline cursor-pointer"
                >
                  View Main Landing
                </button>
              </div>
            </div>
          ) : (
            /* Auth Options Card */
            <>
              <div className="space-y-3">
                <button 
                  onClick={onLogin}
                  className="w-full bg-[#141414] text-[#E4E3E0] py-4 sm:py-5 rounded-md font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs sm:text-sm cursor-pointer shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  <span>Login with Google</span>
                </button>
                <p className="text-[11px] sm:text-xs text-center text-neutral-600 font-semibold uppercase tracking-wider">
                  Unlock 100k chars & 24h persistence
                </p>
              </div>

              <div className="relative flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#141414]/20"></div>
                </div>
                <span className="relative px-4 bg-white text-xs uppercase tracking-wider text-neutral-500 font-bold">Or</span>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={onGuest}
                  className="w-full border-2 border-[#141414] bg-white text-[#141414] py-4 sm:py-5 rounded-md font-bold uppercase tracking-[0.2em] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all flex items-center justify-center gap-3 text-xs sm:text-sm cursor-pointer shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]"
                >
                  <span>Continue as Guest</span>
                </button>
                <p className="text-[11px] sm:text-xs text-center text-neutral-600 font-semibold uppercase tracking-wider">
                  Limited to 10k chars & 60s clips
                </p>
              </div>

              <div className="pt-2 flex flex-col items-center gap-2.5">
                <button 
                  onClick={onOpenHowItWorks}
                  className="text-xs uppercase tracking-wider font-bold text-neutral-600 hover:text-neutral-950 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-700" />
                  <span>How it works</span>
                </button>

                <p className="text-[10px] text-neutral-500 text-center font-mono">
                  By continuing, you agree to our{' '}
                  <button onClick={onOpenTerms} className="underline font-bold text-neutral-800 cursor-pointer">
                    terms and conditions
                  </button>
                  .
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs uppercase tracking-[0.3em] font-semibold text-neutral-500">
        Universal Clipboard Protocol v2.4
      </footer>
    </div>
  );
};
