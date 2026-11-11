import React from 'react';
import { Zap, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F4F3F0] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white pt-20 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">

        {/* Top Mobile-Friendly Navigation Header */}
        <div className="flex items-center justify-between border-b border-neutral-300 pb-4">
          <button
            onClick={onBackToApp}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-800 hover:text-black transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to App</span>
          </button>

          <button
            onClick={onNavigateToProduct}
            className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-600 hover:text-neutral-900 underline underline-offset-4 transition-colors cursor-pointer"
          >
            Product Tour
          </button>
        </div>

        {/* Hero Banner */}
        <div className="space-y-4 sm:space-y-6 text-center max-w-3xl mx-auto pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-neutral-300 rounded-full text-xs font-mono uppercase tracking-wider font-semibold shadow-xs">
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Transparent Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 leading-tight">
            Simple Pricing.<br />Maximum Speed.
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-neutral-600 leading-relaxed font-normal px-2">
            Choose the plan that fits your workflow. Start free or upgrade to Pro & Pro Max for 100k limits, custom aliases, and vault persistence.
          </p>
        </div>

        {/* Pricing Cards Grid (Mobile Stacked, Desktop 3-Col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* Free Tier */}
          <div className="bg-white border-2 border-neutral-900 p-6 sm:p-8 rounded-xl shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-neutral-200">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-neutral-900">Free Guest</h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Instant guest sharing</p>
                </div>
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">$0</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm font-mono text-neutral-700">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>8-Character secure codes</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>10,000 character limit</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>Up to 10MB file transfers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>Fast direct retrieval</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onBackToApp}
              className={`w-full min-h-[48px] py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-xs transition-all cursor-pointer ${
                tier === 'free' 
                  ? 'bg-neutral-900 text-white' 
                  : 'border-2 border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white'
              }`}
            >
              {tier === 'free' ? 'Current Plan' : 'Get Started Free'}
            </button>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="bg-white border-2 border-emerald-500 p-6 sm:p-8 rounded-xl shadow-[6px_6px_0px_0px_rgba(16,185,129,1)] flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3.5 left-6 bg-emerald-500 text-neutral-950 text-[10px] font-bold font-mono uppercase tracking-widest px-3 py-1 rounded-full shadow-xs">
              ★ Most Popular
            </div>
            <div className="space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-emerald-100 pt-1">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wider flex items-center gap-1.5 text-neutral-900">
                    <span>Pro</span>
                    <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Power creators & developers</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">$4.99</span>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-500 block">/ month</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm font-mono text-neutral-800">
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
                  <span>Burn-on-Read self destruction</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>File Sharing up to 50MB</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onUpgrade('https://buy.stripe.com/test_5kQ4gz8Yycn1dzN8nebwk00')}
              className={`w-full min-h-[48px] py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-xs transition-all cursor-pointer ${
                tier === 'pro'
                  ? 'bg-emerald-500 text-neutral-950 cursor-default'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
              }`}
            >
              {tier === 'pro' ? 'Active Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Pro Max Tier */}
          <div className="bg-neutral-900 text-white border-2 border-neutral-900 p-6 sm:p-8 rounded-xl shadow-[6px_6px_0px_0px_rgba(59,130,246,1)] flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-neutral-800">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-400">
                    <span>Pro Max</span>
                    <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">Teams, Classrooms & Teams</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white">$9.99</span>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-400 block">/ month</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm font-mono text-neutral-300">
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
                  <span>Google Drive & Cloud Integrations</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0" />
                  <span>Unlimited priority file stream</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onUpgrade('https://buy.stripe.com/test_6oU14ngr072HdzN6f6bwk01')}
              className={`w-full min-h-[48px] py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-xs transition-all cursor-pointer ${
                tier === 'promax'
                  ? 'bg-blue-500 text-neutral-950 cursor-default'
                  : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm'
              }`}
            >
              {tier === 'promax' ? 'Active Plan' : 'Get Pro Max'}
            </button>
          </div>

        </div>

        {/* Restore Purchases / Sync Bar */}
        <div className="bg-white border-2 border-neutral-900 p-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-900">Already have a subscription?</h4>
            <p className="text-xs text-neutral-600 font-mono">Sync with Stripe to instantly restore your Pro or Pro Max account access.</p>
          </div>
          <button 
            onClick={onRestorePurchases}
            className="w-full sm:w-auto min-h-[44px] bg-neutral-900 text-white px-6 py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restore Purchases</span>
          </button>
        </div>

      </div>
    </div>
  );
};
