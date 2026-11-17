import React from 'react';
import {
  Zap,
  Inbox,
  FolderArchive,
  Clock,
  ShieldCheck,
  ArrowRight,
  Lock,
  Check,
  QrCode,
} from 'lucide-react';
import { LanguageCode, translations } from '../utils/i18n';
import { FaqAccordion, FaqItem } from './FaqAccordion';

interface ProductPageProps {
  onBackToApp: () => void;
  onTryCollectionBox?: () => void;
  onNavigateToPricing: () => void;
  onOpenAuth: () => void;
  currentLang?: LanguageCode;
}

const PRODUCT_FAQS: FaqItem[] = [
  {
    id: 'collection-no-login',
    category: 'Collection Drop Boxes',
    question: 'How do Sendarro Collection Boxes work without contributor logins?',
    answer:
      'When you create a Collection Box, Sendarro generates a dedicated 8-character code and shareable QR link. Anyone with that code can open the box, type their name, and upload files straight from desktop or mobile without creating an account.',
  },
  {
    id: 'collection-free-trial',
    category: 'Collection Drop Boxes · Free Trial',
    question: 'Can I try a Collection Box before upgrading to Pro Max?',
    answer:
      'Yes. Sign in with Google to get 1 Free Trial Collection Box supporting up to 5 contributor submissions over a 24-hour window. When you need unlimited drop boxes, auto-closing deadlines, and 1-click batch exports, you can upgrade to Pro Max anytime.',
  },
  {
    id: 'collection-exports',
    category: 'Batch Export · ZIP, Google Drive & Dropbox',
    question: 'How do 1-click ZIP, Google Drive, and Dropbox exports organize submissions?',
    answer:
      'On Pro Max, every submission inside a Collection Box can be bundled into a single ZIP download, streamed straight into Google Drive automatically sorted into folders by contributor name, or saved to Dropbox with one click.',
  },
  {
    id: 'vault-recovery',
    category: '7-Day Locked Vault',
    question: 'What happens when a Collection Box deadline or transfer link expires?',
    answer:
      'Standard guest clips purge automatically upon expiration. Pro Max protects expired Collection Boxes and file transfers inside your 7-Day Locked Vault, allowing you to review collected submissions and reactivate expired links for 15 minutes whenever a teammate misses the window.',
  },
  {
    id: 'limits-sizes',
    category: 'Transfer Limits',
    question: 'What file sizes and character limits does Sendarro support?',
    answer:
      'Free Guest transfers support up to 10 MB per file and 10,000 characters. Pro raises the ceiling to 500 MB via Cloudflare R2 and 100,000 characters with custom aliases. Pro Max increases direct R2 uploads to 2 GB per file.',
  },
  {
    id: 'security-burn',
    category: 'Security & Privacy',
    question: 'How does Burn-on-Read and automatic expiration protect sensitive data?',
    answer:
      'All transfers travel over encrypted HTTPS and signed storage URLs. Enabling Burn-on-Read permanently deletes single-use clips immediately after first retrieval, while timed clips auto-purge once their countdown expires.',
  },
];

export const ProductPage: React.FC<ProductPageProps> = ({
  onBackToApp,
  onTryCollectionBox,
  onNavigateToPricing,
  currentLang = 'en',
}) => {
  const t = translations[currentLang] || translations.en;

  const handleTryCollections = () => {
    if (onTryCollectionBox) {
      onTryCollectionBox();
    } else {
      onBackToApp();
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F3F0] text-[#141414] font-sans selection:bg-[#141414] selection:text-white pt-10 sm:pt-14 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-14 sm:space-y-20">
        {/* Hero Split Section — Collection Drop Boxes Front and Center */}
        <section
          aria-labelledby="product-hero-heading"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch"
        >
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6 py-2">
            <div className="space-y-5">
              <p className="text-xs font-mono text-neutral-600 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#141414]">Collection Drop Boxes</span>
                <span aria-hidden="true">·</span>
                <span>Zero Contributor Login</span>
                <span aria-hidden="true">·</span>
                <span>Instant 8-Char Transfers</span>
              </p>

              <h1
                id="product-hero-heading"
                className="text-4xl sm:text-5xl lg:text-6xl font-serif italic font-bold tracking-tight text-[#141414] leading-[1.05] [text-wrap:balance]"
              >
                Collect files from anyone into one organized inbox.
              </h1>

              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed max-w-2xl">
                Stop chasing screenshots across group chats, email threads, and messy shared links. Create a Sendarro Collection Box with one 8-character code—students, clients, or teammates drop files without signing in, and you export everything in one click.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleTryCollections}
                  className="bg-[#141414] text-white px-6 py-3.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs hover:bg-neutral-800 transition-colors cursor-pointer inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]"
                >
                  <Inbox className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Try 1 Free Collection Box</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={onNavigateToPricing}
                  className="border-2 border-[#141414] bg-white text-[#141414] px-6 py-3.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs hover:bg-[#141414] hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Compare Plans
                </button>
              </div>

              <p className="text-xs font-mono text-neutral-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>1 Free Trial Box (up to 5 submissions)</span>
                <span aria-hidden="true">·</span>
                <span>Up to 2 GB via Cloudflare R2</span>
                <span aria-hidden="true">·</span>
                <span>No app install required</span>
              </p>
            </div>
          </div>

          {/* Right Column: Editorial Collection Inbox Blueprint */}
          <div className="lg:col-span-5 bg-white border-2 border-[#141414] rounded-sm shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between overflow-hidden">
            <div className="bg-[#141414] text-white px-5 py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-mono text-neutral-400">Collection Drop Box</p>
                <p className="text-sm font-bold truncate">Q4 Design &amp; Client Assets</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-sm font-mono text-xs font-bold tracking-widest text-emerald-400 shrink-0 tabular-nums">
                BOX-84K9
              </div>
            </div>

            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-600 pb-2 border-b border-[#141414]/15">
                  <span>Contributor Submissions</span>
                  <span className="font-bold text-[#141414] tabular-nums">3 received · 60.5 MB</span>
                </div>

                <div className="divide-y divide-[#141414]/10 border border-[#141414]/15 rounded-sm bg-[#F9F9F8]">
                  <div className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#141414] truncate">Maya Lin</p>
                      <p className="text-[11px] font-mono text-neutral-500 truncate">
                        brand-deck.pdf · logo-pack.zip
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-700 tabular-nums shrink-0">
                      18.4 MB
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#141414] truncate">David Okafor</p>
                      <p className="text-[11px] font-mono text-neutral-500 truncate">
                        shoot-raw-selects.zip
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-700 tabular-nums shrink-0">
                      34.2 MB
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#141414] truncate">Sofia Alvarez</p>
                      <p className="text-[11px] font-mono text-neutral-500 truncate">
                        signed-agreement.pdf
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-700 tabular-nums shrink-0">
                      7.9 MB
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#141414]/15 space-y-2">
                <p className="text-[11px] font-mono text-neutral-500">
                  1-Click Batch Export Destinations (Pro Max)
                </p>
                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] font-bold">
                  <div className="py-2 px-2 bg-[#F4F3F0] border border-[#141414]/20 rounded-sm whitespace-nowrap">
                    Bulk ZIP
                  </div>
                  <div className="py-2 px-2 bg-[#F4F3F0] border border-[#141414]/20 rounded-sm whitespace-nowrap">
                    Google Drive
                  </div>
                  <div className="py-2 px-2 bg-[#F4F3F0] border border-[#141414]/20 rounded-sm whitespace-nowrap">
                    Dropbox
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Step Workflow Strip */}
        <section aria-labelledby="workflow-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-2 border-[#141414] pb-4">
            <div>
              <p className="text-xs font-mono text-neutral-600">How Collection Boxes Work</p>
              <h2
                id="workflow-heading"
                className="text-2xl sm:text-3xl font-serif italic font-bold text-[#141414] tracking-tight"
              >
                From intake request to organized folder in three steps
              </h2>
            </div>
            <p className="text-xs font-mono text-neutral-600 shrink-0">
              Built for classrooms, agencies, events &amp; teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-2 border-[#141414] p-6 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-3">
              <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
                01. Create &amp; Share Code
              </span>
              <h3 className="text-lg font-bold text-[#141414]">Open a Collection Box</h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Start with 1 Free Trial Collection Box (up to 5 submissions, 24h open window) or create unlimited boxes with custom deadlines on Pro Max.
              </p>
            </div>

            <div className="bg-white border-2 border-[#141414] p-6 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-3">
              <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
                02. Zero-Login Uploads
              </span>
              <h3 className="text-lg font-bold text-[#141414]">Contributors Drop Files</h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Share the 8-character code or QR link. Anyone uploads assignments, photos, or project files from any browser without making an account.
              </p>
            </div>

            <div className="bg-white border-2 border-[#141414] p-6 rounded-sm shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-3">
              <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
                03. Organized Export
              </span>
              <h3 className="text-lg font-bold text-[#141414]">Save Everything in 1 Click</h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Submissions stay grouped by contributor name. Pro Max exports the entire box to ZIP, Google Drive subfolders, or Dropbox immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Asymmetric Capability Bento Grid */}
        <section aria-labelledby="capabilities-heading" className="space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-mono text-neutral-600">Platform Capabilities</p>
            <h2
              id="capabilities-heading"
              className="text-2xl sm:text-3xl font-serif italic font-bold text-[#141414] tracking-tight"
            >
              Built for group intake and fast peer-to-peer transfers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Marquee Feature: Collection Drop Boxes */}
            <div className="md:col-span-7 bg-[#141414] text-[#E4E3E0] border-2 border-[#141414] p-6 sm:p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,0.3)] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-emerald-500 text-[#141414] rounded-sm flex items-center justify-center">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <h3 className="text-xl sm:text-2xl font-serif italic font-bold text-white">
                  Collection Drop Boxes &amp; Batch Cloud Sync
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  Receive multiple submissions under one code with live submission counts, optional auto-closing deadlines, and contributor-sorted exports to Google Drive, Dropbox, or a single ZIP archive.
                </p>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 border-t border-neutral-800 text-xs font-mono text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>1 Free Trial Box on signed-in accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Auto-closing deadline countdowns</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Google Drive contributor subfolders</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>One-click Download All as ZIP</span>
                </li>
              </ul>
            </div>

            {/* Feature 2: 7-Day Locked Vault */}
            <div className="md:col-span-5 bg-white border-2 border-[#141414] p-6 sm:p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-[#141414] text-white rounded-sm flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold tracking-tight text-[#141414]">
                  7-Day Locked Vault Safety Net
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Need files from an expired link or closed Collection Box? Pro Max holds expired clips in your private Locked Vault for 7 days and lets you reactivate any link for 15 minutes in one click.
                </p>
              </div>
              <p className="text-[11px] font-mono text-neutral-500 pt-3 border-t border-[#141414]/15 tabular-nums">
                Pro Max Exclusive · 7-day retention · 15m reactivation
              </p>
            </div>

            {/* Feature 3: Instant 8-Char & QR Beaming */}
            <div className="md:col-span-5 bg-white border-2 border-[#141414] p-6 sm:p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] space-y-4">
              <div className="w-10 h-10 bg-[#141414] text-white rounded-sm flex items-center justify-center">
                <QrCode className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-[#141414]">
                8-Character &amp; QR Universal Clipboard
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                Move code snippets, notes, or files up to 2 GB via Cloudflare R2 direct streaming across Mac, Windows, iOS, and Android—without pairing Bluetooth or installing native apps.
              </p>
            </div>

            {/* Feature 4: Burn-on-Read & Custom Aliases */}
            <div className="md:col-span-7 bg-white border-2 border-[#141414] p-6 sm:p-8 rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-[#141414] text-white rounded-sm flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-[#141414]">
                  Burn-on-Read Privacy
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Mark sensitive credentials or one-time files to self-destruct immediately after the recipient opens them once.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 bg-[#141414] text-white rounded-sm flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold tracking-tight text-[#141414]">
                  Custom Aliases &amp; Expiry
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  Pro and Pro Max let you choose memorable codes like TEAM-SYNC and set transfer lifetimes from 15 minutes up to 24 hours.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Dropdown FAQ Section */}
        <FaqAccordion
          title={t.faqTitle}
          subtitle="Clear answers about Collection Drop Boxes, zero-login uploads, cloud exports, and storage limits."
          items={PRODUCT_FAQS}
          defaultOpenId="collection-no-login"
        />

        {/* Bottom Conversion Banner */}
        <section className="bg-[#141414] text-[#E4E3E0] p-8 sm:p-12 rounded-sm border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,0.35)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-serif italic font-bold tracking-tight text-white [text-wrap:balance]">
              Ready to launch your first Collection Drop Box?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Sign in with Google for 1 Free Trial Collection Box (up to 5 submissions), or start transferring text and files right away as a guest.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={handleTryCollections}
              className="bg-emerald-500 text-[#141414] px-6 py-3.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs hover:bg-emerald-400 transition-colors cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
            >
              <Zap className="w-4 h-4 shrink-0" />
              <span>{t.startSharing}</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToPricing}
              className="border border-[#E4E3E0] text-white px-6 py-3.5 rounded-sm font-mono font-bold uppercase tracking-wider text-xs hover:bg-white hover:text-[#141414] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {t.pricing}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};
