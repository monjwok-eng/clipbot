import React from 'react';
import { Zap, CheckCircle2, RefreshCw } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F4F3F0] text-[#141414] font-sans selection:bg-[#141414] selection:text-white pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-14">

        {/* Hero Section */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#141414] rounded-none text-xs font-mono font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Pricing Tiers</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif italic font-bold tracking-tight text-[#141414] leading-tight">
            Simple, Transparent Plans
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed">
            Start free with instant guest codes or upgrade for 100k limits, custom aliases, and team vaults.
          </p>
        </div>

        {/* Pricing Cards Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* Free Tier */}
          <div className="bg-white border-2 border-[#141414] p-6 sm:p-7 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-[#141414]/15">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-wider text-[#141414]">Free Guest</h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Instant guest sharing</p>
                </div>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-[#141414]">$0</span>
              </div>

              <ul className="space-y-3 text-xs font-mono text-neutral-700">
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
                  <span>Direct browser retrieval</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onBackToApp}
              className={`w-full min-h-[44px] py-3 px-4 rounded-sm font-bold uppercase tracking-wider text-xs transition-all cursor-pointer ${
                tier === 'free' 
                  ? 'bg-[#141414] text-[#E4E3E0]' 
                  : 'border-2 border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]'
              }`}
            >
              {tier === 'free' ? 'Current Plan' : 'Get Started Free'}
            </button>
          </div>

          {/* Pro Tier (Featured Accent) */}
          <div className="bg-white border-2 border-[#141414] p-6 sm:p-7 rounded-sm shadow-[8px_8px_0px_0px_rgba(16,185,129,1)] flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3.5 left-5 bg-emerald-500 text-[#141414] text-[10px] font-bold font-mono uppercase tracking-widest px-3 py-0.5 rounded-none border border-[#141414]">
              Most Popular
            </div>
            <div className="space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-[#141414]/15 pt-1">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#141414]">
                    <span>Pro</span>
                    <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Power creators & devs</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#141414]">$4.99</span>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-500 block">/ month</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs font-mono text-neutral-800">
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
                  <span>File sharing up to 50MB</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onUpgrade('https://buy.stripe.com/test_5kQ4gz8Yycn1dzN8nebwk00')}
              className={`w-full min-h-[44px] py-3 px-4 rounded-sm font-bold uppercase tracking-wider text-xs transition-all cursor-pointer ${
                tier === 'pro'
                  ? 'bg-emerald-500 text-[#141414] cursor-default border border-[#141414]'
                  : 'bg-[#141414] text-white hover:bg-emerald-600 hover:text-white'
              }`}
            >
              {tier === 'pro' ? 'Active Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Pro Max Tier */}
          <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] p-6 sm:p-7 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,0.4)] flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-neutral-700">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
                    <span>Pro Max</span>
                    <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">Teams & Power Workflows</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-white">$9.99</span>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-400 block">/ month</span>
                </div>
              </div>

              <ul className="space-y-3 text-xs font-mono text-neutral-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3-4 Character short codes</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Collection Drop Box (Team Inbox)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Locked Vault (7-Day Recovery)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Cloud Integrations (Drive & Dropbox)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Priority file stream</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onUpgrade('https://buy.stripe.com/test_6oU14ngr072HdzN6f6bwk01')}
              className={`w-full min-h-[44px] py-3 px-4 rounded-sm font-bold uppercase tracking-wider text-xs transition-all cursor-pointer ${
                tier === 'promax'
                  ? 'bg-emerald-400 text-[#141414] cursor-default'
                  : 'bg-white text-[#141414] hover:bg-emerald-400 transition-colors'
              }`}
            >
              {tier === 'promax' ? 'Active Plan' : 'Get Pro Max'}
            </button>
          </div>

        </div>

        {/* Restore Purchases / Sync Bar */}
        <div className="bg-white border-2 border-[#141414] p-5 sm:p-6 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#141414]">Already have a subscription?</h4>
            <p className="text-xs text-neutral-600 font-mono">Sync your account with Stripe to instantly restore your Pro or Pro Max status.</p>
          </div>
          <button 
            onClick={onRestorePurchases}
            className="w-full sm:w-auto min-h-[40px] bg-[#141414] text-white px-5 py-2.5 rounded-sm font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restore Purchases</span>
          </button>
        </div>

      </div>
    </div>
  );
};
