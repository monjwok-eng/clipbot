import React from 'react';
import { Zap, CheckCircle2, RefreshCw, BarChart2 } from 'lucide-react';
import { LanguageCode, translations } from '../utils/i18n';

interface PricingPageProps {
  onBackToApp: () => void;
  onNavigateToProduct: () => void;
  onUpgrade: (priceId: string) => void;
  onRestorePurchases: () => void;
  tier: 'free' | 'pro' | 'promax';
  currentLang?: LanguageCode;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onBackToApp,
  onNavigateToProduct,
  onUpgrade,
  onRestorePurchases,
  tier,
  currentLang = 'en'
}) => {
  const t = translations[currentLang] || translations.en;

  return (
    <div className="min-h-screen bg-[#F4F3F0] text-[#141414] font-sans selection:bg-[#141414] selection:text-white pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-14">

        {/* Hero Section */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#141414] rounded-none text-xs font-mono font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>{t.pricing}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif italic font-bold tracking-tight text-[#141414] leading-tight">
            Simple, Transparent Plans
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed">
            {t.heroSubtitle}
          </p>
        </div>

        {/* Pricing Cards Grid */}
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
              {/* ... features list ... */}
            </div>
            <button onClick={onBackToApp} className={`w-full min-h-[44px] py-3 px-4 rounded-sm font-bold uppercase tracking-wider text-xs transition-all cursor-pointer ${tier === 'free' ? 'bg-[#141414] text-[#E4E3E0]' : 'border-2 border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]'}`}>
              {tier === 'free' ? 'Current Plan' : 'Get Started Free'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-white border-2 border-[#141414] p-6 sm:p-7 rounded-sm shadow-[8px_8px_0px_0px_rgba(16,185,129,1)] flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3.5 left-5 bg-emerald-500 text-[#141414] text-[10px] font-bold font-mono uppercase tracking-widest px-3 py-0.5 rounded-none border border-[#141414]">Most Popular</div>
            <div className="space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-[#141414]/15 pt-1">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#141414]">
                    <span>Pro</span> <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Power creators & devs</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#141414]">$4.99</span>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-500 block">/ month</span>
                </div>
              </div>
            </div>
            <button onClick={() => onUpgrade('https://buy.stripe.com/test_5kQ4gz8Yycn1dzN8nebwk00')} className={`w-full min-h-[44px] py-3 px-4 rounded-sm font-bold uppercase tracking-wider text-xs transition-all cursor-pointer ${tier === 'pro' ? 'bg-emerald-500 text-[#141414] cursor-default border border-[#141414]' : 'bg-[#141414] text-white hover:bg-emerald-600 hover:text-white'}`}>
              {tier === 'pro' ? 'Active Plan' : t.upgrade}
            </button>
          </div>

          {/* Pro Max Tier */}
          <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] p-6 sm:p-7 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,0.4)] flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-neutral-700">
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
                    <span>Pro Max</span> <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">Teams & Power Workflows</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-white">$9.99</span>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-400 block">/ month</span>
                </div>
              </div>
              <p className="text-xs text-blue-300 font-mono">{t.compProMaxDesc}</p>
            </div>
            <button onClick={() => onUpgrade('https://buy.stripe.com/test_6oU14ngr072HdzN6f6bwk01')} className={`w-full min-h-[44px] py-3 px-4 rounded-sm font-bold uppercase tracking-wider text-xs transition-all cursor-pointer ${tier === 'promax' ? 'bg-emerald-400 text-[#141414] cursor-default' : 'bg-white text-[#141414] hover:bg-emerald-400 transition-colors'}`}>
              {tier === 'promax' ? 'Active Plan' : t.goProMax}
            </button>
          </div>

        </div>

        {/* Comparison Section */}
        <div className="bg-white border-2 border-[#141414] p-8 sm:p-12 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-8">
            <h2 className="text-2xl font-serif italic font-bold text-[#141414] flex items-center gap-3">
                <BarChart2 className="w-6 h-6 text-emerald-600" />
                {t.comparisonTitle}
            </h2>
            <div className="grid md:grid-cols-3 gap-6 text-xs sm:text-sm font-mono text-neutral-700 leading-relaxed">
                <div className="p-4 border border-[#141414]/10 bg-neutral-50">{t.compPastebin}</div>
                <div className="p-4 border border-[#141414]/10 bg-neutral-50">{t.compAirDrop}</div>
                <div className="p-4 border border-[#141414]/10 bg-neutral-50">{t.compSendAnywhere}</div>
            </div>
        </div>

        {/* Restore Purchases / Sync Bar */}
        <div className="bg-white border-2 border-[#141414] p-5 sm:p-6 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-[#141414]">Already have a subscription?</h4>
            <p className="text-xs text-neutral-600 font-mono">Sync with Stripe to instantly restore your Pro or Pro Max status.</p>
          </div>
          <button onClick={onRestorePurchases} className="w-full sm:w-auto min-h-[40px] bg-[#141414] text-white px-5 py-2.5 rounded-sm font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.restorePurchases}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
