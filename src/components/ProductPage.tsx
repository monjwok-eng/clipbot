import React from 'react';
import { Zap, Upload, Lock, ShieldCheck, HelpCircle } from 'lucide-react';
import { LanguageCode, translations } from '../utils/i18n';

interface ProductPageProps {
  onBackToApp: () => void;
  onNavigateToPricing: () => void;
  onOpenAuth: () => void;
  currentLang?: LanguageCode;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  onBackToApp,
  onNavigateToPricing,
  onOpenAuth,
  currentLang = 'en'
}) => {
  const t = translations[currentLang] || translations.en;

  return (
    <div className="min-h-screen bg-[#F4F3F0] text-[#141414] font-sans selection:bg-[#141414] selection:text-white pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12 sm:space-y-16">

        {/* Hero Section */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#141414] rounded-none text-xs font-mono font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Universal Clipboard Protocol v2.5</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif italic font-bold tracking-tight text-[#141414] leading-tight">
            {t.product}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
            {t.heroSubtitle}
          </p>
        </div>

        {/* Core Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          <div className="bg-white border-2 border-[#141414] p-6 sm:p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="w-10 h-10 bg-[#141414] text-white rounded-none flex items-center justify-center border border-[#141414]">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#141414]">8-Digit High-Entropy Beaming</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-mono">
              Every clip generates an optimized 8-character secure code or instant QR code. No apps, bluetooth pairing, or account log-ins necessary on the receiving device.
            </p>
          </div>

          <div className="bg-white border-2 border-[#141414] p-6 sm:p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="w-10 h-10 bg-[#141414] text-white rounded-none flex items-center justify-center border border-[#141414]">
              <Upload className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#141414]">Multi-File Payload Stream</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-mono">
              Transfer documents, design mocks, PDFs, and large archives up to 500MB (Pro) and 2GB (Pro Max) via direct Cloudflare R2 streaming, with one-click ZIP packaging and cloud storage integration.
            </p>
          </div>

          <div className="bg-white border-2 border-[#141414] p-6 sm:p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="w-10 h-10 bg-[#141414] text-white rounded-none flex items-center justify-center border border-[#141414]">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#141414]">{t.securityTitle}</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-mono">
              {t.securityDesc}
            </p>
          </div>

          <div className="bg-white border-2 border-[#141414] p-6 sm:p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="w-10 h-10 bg-[#141414] text-white rounded-none flex items-center justify-center border border-[#141414]">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-[#141414]">Locked Vault & Team Inboxes</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-mono">
              Pro Max members enjoy a 7-day safety net in their Locked Vault, allowing expired clip reactivation and multi-contributor team drop boxes.
            </p>
          </div>

        </div>

        {/* FAQ Section */}
        <div className="bg-white border-2 border-[#141414] p-8 sm:p-12 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-8">
            <h2 className="text-2xl font-serif italic font-bold text-[#141414] flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-emerald-600" />
              {t.faqTitle}
            </h2>
            <div className="space-y-6">
                <div className="space-y-2 border-b border-[#141414]/10 pb-4">
                    <h4 className="text-sm font-bold text-[#141414]">{t.faqQ1}</h4>
                    <p className="text-xs sm:text-sm text-neutral-600 font-mono leading-relaxed">
                        {t.faqA1}
                    </p>
                </div>
                <div className="space-y-2 border-b border-[#141414]/10 pb-4">
                    <h4 className="text-sm font-bold text-[#141414]">Is Sendarro really free to use?</h4>
                    <p className="text-xs sm:text-sm text-neutral-600 font-mono leading-relaxed">
                        Yes! You can start sharing text and files immediately as a guest. Our Free tier provides instant, secure transfers without requiring an account. We offer Pro plans for users needing longer persistence, larger file sizes, and advanced team collaboration tools.
                    </p>
                </div>
                <div className="space-y-2 border-b border-[#141414]/10 pb-4">
                    <h4 className="text-sm font-bold text-[#141414]">How secure are my shared files?</h4>
                    <p className="text-xs sm:text-sm text-neutral-600 font-mono leading-relaxed">
                        Security is our priority. All transfers are end-to-end encrypted. Clips and files are stored temporarily on secure servers and are automatically purged upon expiration, ensuring your data never lingers longer than necessary.
                    </p>
                </div>
                <div className="space-y-2 border-b border-[#141414]/10 pb-4">
                    <h4 className="text-sm font-bold text-[#141414]">Can I use Sendarro on mobile and desktop?</h4>
                    <p className="text-xs sm:text-sm text-neutral-600 font-mono leading-relaxed">
                        Absolutely. Sendarro is a browser-based Universal Clipboard Protocol. It works seamlessly on any device with a modern browser, eliminating the need for app installations or complex Bluetooth pairing.
                    </p>
                </div>
            </div>
        </div>

        {/* Bottom Call-to-Action */}
        <div className="bg-[#141414] text-[#E4E3E0] p-8 sm:p-12 rounded-sm border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,0.4)] text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-serif italic font-bold tracking-tight">{t.heroTitle}</h2>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto font-mono">
            {t.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <button 
              onClick={onBackToApp}
              className="bg-emerald-500 text-[#141414] px-6 py-3.5 rounded-sm font-bold uppercase tracking-wider text-xs hover:bg-emerald-400 transition-colors cursor-pointer border border-[#141414]"
            >
              {t.startSharing}
            </button>
            <button 
              onClick={onNavigateToPricing}
              className="border border-[#E4E3E0] text-white px-6 py-3.5 rounded-sm font-bold uppercase tracking-wider text-xs hover:bg-white hover:text-[#141414] transition-colors cursor-pointer"
            >
              {t.pricing}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
