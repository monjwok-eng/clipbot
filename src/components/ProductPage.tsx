import React from 'react';
import { Share2, Zap, ShieldCheck, Upload, QrCode, FileText, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

interface ProductPageProps {
  onBackToApp: () => void;
  onNavigateToPricing: () => void;
  onOpenAuth: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  onBackToApp,
  onNavigateToPricing,
  onOpenAuth
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white pt-24 pb-20 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto space-y-16">

        {/* Hero */}
        <div className="space-y-6 text-center max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-mono uppercase tracking-wider font-semibold shadow-xs">
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            Universal Clipboard Protocol v2.5
          </div>
          <h1 className="text-4xl sm:text-6xl font-sans font-extrabold tracking-tight text-slate-900 leading-tight">
            The Product
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Sendarro is engineered to eliminate friction in cross-device workflows. Beam text, code snippets, and multi-file packages instantly with 8-character codes or high-density QR codes.
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">8-Digit High-Entropy Beaming</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-mono">
              Every clip generates an optimized 8-character secure code or instant QR code. No apps, bluetooth pairing, or account log-ins necessary on the receiving device.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Multi-File Payload Stream</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-mono">
              Transfer archives, design mocks, PDFs, and code repositories up to 50MB per bundle with live byte progress telemetry and ultra-fast storage integration.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Burn on Read & Expiration</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-mono">
              Set exact expiration timers (60s, 1h, 24h) or activate Burn on Read mode so files and clips self-destruct the exact moment they are opened.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Locked Vault & Recovery</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-mono">
              Pro Max members enjoy a 7-day safety net in their Locked Vault, allowing expired clip reactivation and team collection drop boxes.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-slate-900 text-white p-8 sm:p-12 rounded-2xl shadow-xl text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-sans font-bold tracking-tight">Ready to experience instant beaming?</h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto font-mono">
            Jump into the sharing workspace instantly as a guest or sign in to unlock Pro power features.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <button 
              onClick={onBackToApp}
              className="bg-emerald-500 text-slate-950 px-6 py-3.5 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              Launch App Now
            </button>
            <button 
              onClick={onNavigateToPricing}
              className="border border-slate-700 text-white px-6 py-3.5 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Explore Pricing
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
