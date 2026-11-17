import React from 'react';
import { Zap, CheckCircle2, RefreshCw, BarChart2, Inbox, ShieldCheck, Check, X } from 'lucide-react';
import { LanguageCode, translations } from '../utils/i18n';
import { FaqAccordion, FaqItem } from './FaqAccordion';

interface PricingPageProps {
  onBackToApp: () => void;
  onTryCollectionBox?: () => void;
  onNavigateToProduct: () => void;
  onUpgrade: (priceId: string) => void;
  onRestorePurchases: () => void;
  tier: 'free' | 'pro' | 'promax';
  currentLang?: LanguageCode;
}

const PRICING_FAQS: FaqItem[] = [
  {
    id: 'contributors-free',
    category: 'Collection Boxes',
    question: 'Do contributors uploading to my Collection Box need a paid plan or account?',
    answer:
      'No. Contributors never need a Sendarro account or subscription. You share the 8-character code or QR link, and anyone can submit files to your box immediately.',
  },
  {
    id: 'trial-box-details',
    category: 'Free Trial',
    question: 'What is included in the Free Trial Collection Box?',
    answer:
      'Every signed-in Google account receives 1 Free Trial Collection Box supporting up to 5 contributor submissions over a 24-hour window. When you need unlimited drop boxes, auto-closing deadlines, or batch exports, upgrade to Pro Max.',
  },
  {
    id: 'pro-vs-promax',
    category: 'Plan Differences',
    question: 'What is the difference between Pro ($4.99/mo) and Pro Max ($9.99/mo)?',
    answer:
      'Pro focuses on high-capacity single transfers: 500 MB Cloudflare R2 file limits, 100,000-character clips, custom alias codes, and 24-hour clip expiry. Pro Max adds Unlimited Collection Drop Boxes, 2 GB uploads, auto-closing deadlines, 1-click ZIP / Google Drive / Dropbox batch export, and the 7-Day Locked Vault.',
  },
  {
    id: 'billing-restore',
    category: 'Billing & Stripe',
    question: 'Can I cancel anytime or restore an active subscription?',
    answer:
      'Yes. Subscriptions are billed monthly through Stripe and can be canceled anytime. If you signed in on a new device or browser, click Sync Subscription below to restore your Pro or Pro Max tier immediately.',
  },
];

export const PricingPage: React.FC<PricingPageProps> = ({
  onBackToApp,
  onTryCollectionBox,
  onNavigateToProduct,
  onUpgrade,
  onRestorePurchases,
  tier,
  currentLang = 'en',
}) => {
  const t = translations[currentLang] || translations.en;

  const handleStartCollectionTrial = () => {
    if (onTryCollectionBox) {
      onTryCollectionBox();
    } else {
      onBackToApp();
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F3F0] text-[#141414] font-sans selection:bg-[#141414] selection:text-white pt-10 sm:pt-14 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12 sm:space-y-16">
        {/* Hero Section */}
        <section aria-labelledby="pricing-hero-heading" className="space-y-4 text-center max-w-3xl mx-auto">
          <p className="text-xs font-mono text-neutral-600 flex flex-wrap items-center justify-center gap-2">
            <span className="font-semibold text-[#141414]">Transparent Monthly Billing</span>
            <span aria-hidden="true">·</span>
            <span>1 Free Trial Collection Box Included</span>
            <span aria-hidden="true">·</span>
            <span>Contributors Never Pay</span>
          </p>
          <h1
            id="pricing-hero-heading"
            className="text-3xl sm:text-5xl font-serif italic font-bold tracking-tight text-[#141414] leading-tight [text-wrap:balance]"
          >
            Simple plans built around Collection Drop Boxes
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Start free with instant transfers and 1 Trial Collection Box, move to Pro for 500 MB file beaming, or choose Pro Max for unlimited Collection Boxes, batch cloud export, and the 7-Day Locked Vault.
          </p>
        </section>

        {/* Pricing Cards Grid */}
        <section aria-label="Subscription plans" className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* Free Tier */}
          <div className="bg-white border-2 border-[#141414] p-6 sm:p-7 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-[#141414]/15">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-wider text-[#141414]">Free</h2>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Guest sharing &amp; 1 Trial Box</p>
                </div>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-[#141414] tabular-nums">$0</span>
              </div>
              <ul className="space-y-2.5 text-xs font-mono text-neutral-700 pt-1">
                <li className="flex items-start gap-2">
                  <Inbox className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>1 Free Trial Collection Box</strong> (up to 5 submissions, 24h open)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="tabular-nums">10 MB</strong> file transfer ceiling (no guest login)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="tabular-nums">10,000</strong> characters &amp; QR code beaming
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Multi-file ZIP download &amp; Burn-on-Read</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={handleStartCollectionTrial}
              className={`w-full min-h-[44px] py-3 px-4 rounded-sm font-mono font-bold uppercase tracking-wider text-xs transition-all cursor-pointer whitespace-nowrap ${
                tier === 'free'
                  ? 'bg-[#141414] text-[#E4E3E0]'
                  : 'border-2 border-[#141414] text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]'
              }`}
            >
              {tier === 'free' ? 'Current Plan · Try Box' : 'Start Free'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-white border-2 border-[#141414] p-6 sm:p-7 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-[#141414]/15">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#141414]">
                    <span>Pro</span> <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                  </h2>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">Large files &amp; daily transfers</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#141414] tabular-nums">
                    $4.99
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-500 block">
                    / month
                  </span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs font-mono text-neutral-700 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="tabular-nums">500 MB</strong> file ceiling via Cloudflare R2
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="tabular-nums">100,000</strong> characters per clip
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Custom alias codes &amp; 15m–24h clip expiry</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Includes 1 Free Trial Collection Box</span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onUpgrade('https://buy.stripe.com/test_5kQ4gz8Yycn1dzN8nebwk00')}
              className={`w-full min-h-[44px] py-3 px-4 rounded-sm font-mono font-bold uppercase tracking-wider text-xs transition-all cursor-pointer whitespace-nowrap ${
                tier === 'pro'
                  ? 'bg-emerald-500 text-[#141414] cursor-default border border-[#141414]'
                  : 'bg-[#141414] text-white hover:bg-emerald-600'
              }`}
            >
              {tier === 'pro' ? 'Active Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          {/* Pro Max Tier — Flagship Collection Drop Box Plan */}
          <div className="bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] p-6 sm:p-7 rounded-sm shadow-[8px_8px_0px_0px_rgba(16,185,129,1)] flex flex-col justify-between space-y-6 relative">
            <div className="absolute -top-3.5 left-5 bg-emerald-400 text-[#141414] text-[10px] font-bold font-mono uppercase tracking-widest px-3 py-0.5 border border-[#141414] whitespace-nowrap">
              Collection Flagship
            </div>
            <div className="space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-neutral-800 pt-1">
                <div>
                  <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
                    <span>Pro Max</span> <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">Full Collection Drop Boxes</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
                    $9.99
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-400 block">
                    / month
                  </span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs font-mono text-neutral-200 pt-1">
                <li className="flex items-start gap-2">
                  <Inbox className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Unlimited Collection Boxes</strong> &amp; submissions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white tabular-nums">2 GB</strong> direct R2 file ceiling
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Auto-closing submission deadlines</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>1-click ZIP, Google Drive folders &amp; Dropbox</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">7-Day Locked Vault</strong> &amp; 15m link reactivation
                  </span>
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => onUpgrade('https://buy.stripe.com/test_6oU14ngr072HdzN6f6bwk01')}
              className={`w-full min-h-[44px] py-3 px-4 rounded-sm font-mono font-bold uppercase tracking-wider text-xs transition-all cursor-pointer whitespace-nowrap ${
                tier === 'promax'
                  ? 'bg-emerald-400 text-[#141414] cursor-default'
                  : 'bg-emerald-400 text-[#141414] hover:bg-emerald-300'
              }`}
            >
              {tier === 'promax' ? 'Active Plan' : t.goProMax}
            </button>
          </div>
        </section>

        {/* Detailed Tier Matrix: Free vs Pro vs Pro Max */}
        <section
          aria-labelledby="tier-matrix-heading"
          className="bg-white border-2 border-[#141414] p-6 sm:p-10 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-xs font-mono text-neutral-500">Exact Plan Breakdown</p>
              <h2
                id="tier-matrix-heading"
                className="text-2xl font-serif italic font-bold text-[#141414] tracking-tight"
              >
                Collection Boxes, Vault &amp; Transfer Limits by Tier
              </h2>
            </div>
            <button
              type="button"
              onClick={onNavigateToProduct}
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414] underline underline-offset-4 hover:text-emerald-700 cursor-pointer self-start sm:self-auto whitespace-nowrap"
            >
              Explore Collection Workflows
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm font-mono">
              <thead>
                <tr className="border-b-2 border-[#141414]">
                  <th className="p-3.5 bg-neutral-50 font-bold uppercase tracking-wider">Capability</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Free ($0)</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Pro ($4.99)</th>
                  <th className="p-3.5 bg-emerald-50 font-bold uppercase tracking-wider text-emerald-950">
                    Pro Max ($9.99)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/15">
                <tr>
                  <td className="p-3.5 font-bold text-[#141414]">Collection Drop Boxes</td>
                  <td className="p-3.5 text-neutral-700 tabular-nums">1 Trial Box (5 submissions)</td>
                  <td className="p-3.5 text-neutral-700 tabular-nums">1 Trial Box (5 submissions)</td>
                  <td className="p-3.5 bg-emerald-50/70 font-bold text-emerald-950">
                    Unlimited Boxes &amp; Submissions
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#141414]">Contributor Login Required?</td>
                  <td className="p-3.5 text-neutral-700">Never (0-login upload)</td>
                  <td className="p-3.5 text-neutral-700">Never (0-login upload)</td>
                  <td className="p-3.5 bg-emerald-50/70 font-bold text-emerald-950">
                    Never (0-login upload)
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#141414]">Auto-Closing Deadlines</td>
                  <td className="p-3.5 text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Fixed 24h trial
                    </span>
                  </td>
                  <td className="p-3.5 text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Fixed 24h trial
                    </span>
                  </td>
                  <td className="p-3.5 bg-emerald-50/70 font-bold text-emerald-950">
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Custom Date &amp; Time
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#141414]">Batch Export (ZIP / Drive / Dropbox)</td>
                  <td className="p-3.5 text-neutral-500">Single-file downloads</td>
                  <td className="p-3.5 text-neutral-500">Single-file downloads</td>
                  <td className="p-3.5 bg-emerald-50/70 font-bold text-emerald-950">
                    1-Click ZIP, Drive Folders &amp; Dropbox
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#141414]">7-Day Locked Vault &amp; Reactivation</td>
                  <td className="p-3.5 text-neutral-500">No</td>
                  <td className="p-3.5 text-neutral-500">No</td>
                  <td className="p-3.5 bg-emerald-50/70 font-bold text-emerald-950">
                    Yes (7d safety net + 15m restore)
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#141414]">Max File Size (Cloudflare R2)</td>
                  <td className="p-3.5 text-neutral-700 tabular-nums">10 MB</td>
                  <td className="p-3.5 text-neutral-900 font-bold tabular-nums">500 MB</td>
                  <td className="p-3.5 bg-emerald-50/70 font-bold text-emerald-950 tabular-nums">2 GB</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#141414]">Max Text / Code Characters</td>
                  <td className="p-3.5 text-neutral-700 tabular-nums">10,000</td>
                  <td className="p-3.5 text-neutral-900 font-bold tabular-nums">100,000</td>
                  <td className="p-3.5 bg-emerald-50/70 font-bold text-emerald-950 tabular-nums">
                    100,000
                  </td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#141414]">Custom Aliases &amp; 24h Expiry</td>
                  <td className="p-3.5 text-neutral-500">Random 8-char (60s guest)</td>
                  <td className="p-3.5 text-neutral-900 font-bold">Yes (15m / 30m / 1h / 24h)</td>
                  <td className="p-3.5 bg-emerald-50/70 font-bold text-emerald-950">
                    Yes (15m / 30m / 1h / 24h)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Comparison Against Alternatives */}
        <section
          aria-labelledby="alternatives-heading"
          className="bg-white border-2 border-[#141414] p-6 sm:p-10 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-6"
        >
          <h2
            id="alternatives-heading"
            className="text-2xl font-serif italic font-bold text-[#141414] flex items-center gap-3"
          >
            <BarChart2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <span>{t.comparisonTitle}</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm font-mono">
              <thead>
                <tr className="border-b-2 border-[#141414]">
                  <th className="p-3.5 bg-neutral-50 font-bold uppercase tracking-wider">Feature</th>
                  <th className="p-3.5 bg-emerald-50 font-bold uppercase tracking-wider text-emerald-950">
                    Sendarro
                  </th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">Pastebin</th>
                  <th className="p-3.5 font-bold uppercase tracking-wider">AirDrop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/15">
                <tr>
                  <td className="p-3.5 font-bold text-[#141414]">Zero-Login Collection Drop Boxes</td>
                  <td className="p-3.5 bg-emerald-50/70 text-emerald-950 font-bold">
                    Yes (1 Free Trial + Unlimited Pro Max)
                  </td>
                  <td className="p-3.5 text-neutral-600">No</td>
                  <td className="p-3.5 text-neutral-600">No</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#141414]">Batch ZIP / Drive / Dropbox Export</td>
                  <td className="p-3.5 bg-emerald-50/70 text-emerald-950 font-bold">Yes (1-Click)</td>
                  <td className="p-3.5 text-neutral-600">No</td>
                  <td className="p-3.5 text-neutral-600">No</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#141414]">File Size Ceiling</td>
                  <td className="p-3.5 bg-emerald-50/70 text-emerald-950 font-bold tabular-nums">
                    500 MB (Pro) / 2 GB (Pro Max)
                  </td>
                  <td className="p-3.5 text-neutral-600">No File Hosting</td>
                  <td className="p-3.5 text-neutral-600">Same-Room Only</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-bold text-[#141414]">Cross-Platform Browser Access</td>
                  <td className="p-3.5 bg-emerald-50/70 text-emerald-950 font-bold">
                    Yes (Windows, Mac, iOS, Android)
                  </td>
                  <td className="p-3.5 text-neutral-600">Yes</td>
                  <td className="p-3.5 text-neutral-600">Apple Only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing FAQ Dropdown Accordion */}
        <FaqAccordion
          title="Pricing & Collection FAQ"
          subtitle="Answers on contributor access, the Free Trial Collection Box, Pro vs Pro Max limits, and Stripe billing."
          items={PRICING_FAQS}
          defaultOpenId="pro-vs-promax"
        />

        {/* Restore Purchases / Sync Bar */}
        <div className="bg-white border-2 border-[#141414] p-5 sm:p-6 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#141414]">
              Already have a subscription?
            </h3>
            <p className="text-xs text-neutral-600 font-mono">
              Sync with Stripe to restore your Pro or Pro Max status on this device.
            </p>
          </div>
          <button
            type="button"
            onClick={onRestorePurchases}
            className="w-full sm:w-auto min-h-[40px] bg-[#141414] text-white px-5 py-2.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.restorePurchases}</span>
          </button>
        </div>
      </div>
    </main>
  );
};
