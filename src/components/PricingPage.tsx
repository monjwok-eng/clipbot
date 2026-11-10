import React from 'react';
import { Share2, Zap, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface PricingPageProps {
  onBackToApp: () => void;
  onNavigateToProduct: () => void;
  onUpgrade: (priceId: string) => void;
  onRestorePurchases: () => void;
  tier: 'free' | 'pro' | 'promax';
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onBackToApp,
  onNavigateToProduct,
  onUpgrade,
  onRestorePurchases,
  tier
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white pt-24 pb-20 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-16">

        {/* Hero */}
        <div className="space-y-6 text-center max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-mono uppercase tracking-wider font-semibold shadow-xs">
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            Transparent Pricing Tiers
          </div>
          <h1 className="text-4xl sm:text-6xl font-sans font-extrabold tracking-tight text-slate-900 leading-tight">
            Simple Pricing.<br />Maximum Power.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Choose the plan that fits your workflow. Start free instantly or upgrade to Pro & Pro Max for massive limits, custom aliases, and team vaults.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          
          {/* Free Tier */}
          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900">Free Guest</h3>
                  <p className="text-xs text-slate-500 font-mono">Instant single-device access</p>
                </div>
                <span className="text-2xl font-sans font-extrabold text-slate-900">$0</span>
              </div>

              <ul className="space-y-3 text-xs font-mono text-slate-600 pt-4 border-t border-slate-100">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>8-Character secure codes</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>10,000 character limit</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Up to 10MB file transfers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>60-second fast purge</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onBackToApp}
              className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer ${
                tier === 'free' 
                  ? 'bg-slate-900 text-white' 
                  : 'border border-slate-300 hover:bg-slate-900 hover:text-white text-slate-800'
              }`}
            >
              {tier === 'free' ? 'Current Plan' : 'Get Started Free'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-white border-2 border-emerald-500/80 p-8 rounded-2xl shadow-md flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3.5 left-6 bg-emerald-500 text-slate-950 text-[10px] font-bold font-mono uppercase tracking-widest px-3 py-0.5 rounded-full shadow-xs">
              Most Popular
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-900">
                    <span>Pro</span>
                    <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">For power developers & creators</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-sans font-extrabold text-slate-900">$4.99</span>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500 block">/ month</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs font-mono text-slate-600 pt-4 border-t border-slate-100">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>100,000</strong> character limit</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>24-Hour clip persistence</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom code aliases (e.g. MY-CLIP)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Burn on Read self-destruction</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>File Sharing up to 50MB</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onUpgrade('https://buy.stripe.com/test_5kQ4gz8Yycn1dzN8nebwk00')}
              className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider text-xs transition-all cursor-pointer ${
                tier === 'pro'
                  ? 'bg-emerald-500 text-slate-950 cursor-default'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
              }`}
            >
              {tier === 'pro' ? 'Active Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Pro Max Tier */}
          <div className="bg-slate-900 text-white border border-slate-800 p-8 rounded-2xl shadow-lg flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-400">
                    <span>Pro Max</span>
                    <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">Teams, Classrooms & Elite Use</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-sans font-extrabold">$9.99</span>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 block">/ month</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs font-mono text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />
                  <span>3-4 Character short codes</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />
                  <span>Collection Drop Box (Team Inbox)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />
                  <span>Locked Vault (7-Day Recovery)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />
                  <span>Google Drive & Cloud Sync</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />
                  <span>Unlimited priority file stream</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onUpgrade('https://buy.stripe.com/test_6oU14ngr072HdzN6f6bwk01')}
              className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider text-xs transition-all cursor-pointer ${
                tier === 'promax'
                  ? 'bg-blue-500 text-slate-950 cursor-default'
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm'
              }`}
            >
              {tier === 'promax' ? 'Active Plan' : 'Get Pro Max'}
            </button>
          </div>

        </div>

        {/* Restore Purchases / FAQ bar */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">Already purchased a subscription?</h4>
            <p className="text-xs text-slate-500 font-mono">Sync your account with Stripe to instantly restore your Pro or Pro Max status.</p>
          </div>
          <button 
            onClick={onRestorePurchases}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            Restore Purchases
          </button>
        </div>

      </div>
    </div>
  );
};
