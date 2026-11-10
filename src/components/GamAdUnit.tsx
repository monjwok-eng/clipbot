import React, { useState } from 'react';
import { ExternalLink, Info, Zap, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';

interface GamAdUnitProps {
  isPro?: boolean;
  onUpgrade?: () => void;
  className?: string;
}

export const GamAdUnit: React.FC<GamAdUnitProps> = ({
  isPro = false,
  onUpgrade,
  className = ''
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [previewMode, setPreviewMode] = useState(!isPro);
  const [adLoaded, setAdLoaded] = useState(true);

  // Creative HTML payload rendered inside the safeframe iframe to guarantee 
  // high-definition visual rendering even in sandbox/local preview environments
  const creativeSrcDoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(145deg, #18191c 0%, #0d0e11 100%);
          color: #f1f1f1;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          user-select: none;
        }
        .ad-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.08);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9ca3af;
          width: fit-content;
        }
        .hero {
          margin-top: 16px;
        }
        .sponsor-tag {
          font-size: 11px;
          color: #10b981;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .headline {
          font-size: 26px;
          line-height: 1.15;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }
        .headline span {
          background: linear-gradient(90deg, #38bdf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .desc {
          font-size: 13px;
          color: #9ca3af;
          line-height: 1.5;
          margin-bottom: 20px;
        }
        .graphic-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .stat-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 600;
        }
        .stat-value {
          font-family: monospace;
          font-size: 12px;
          color: #38bdf8;
          font-weight: 700;
        }
        .cta-btn {
          display: block;
          width: 100%;
          background: #3b82f6;
          color: #ffffff;
          text-align: center;
          padding: 14px 16px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .cta-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }
        .footer-note {
          text-align: center;
          font-size: 10px;
          color: #6b7280;
          margin-top: 14px;
        }
      </style>
    </head>
    <body>
      <div>
        <div class="ad-badge">
          <span>● Google Ad</span>
          <span>• 300x562</span>
        </div>
        <div class="hero">
          <div class="sponsor-tag">Developer Infrastructure</div>
          <div class="headline">Fast, Serverless <span>Edge Sync</span></div>
          <p class="desc">Instantly distribute assets, real-time channels, and database state to 300+ edge locations worldwide.</p>
        </div>
        <div class="graphic-card">
          <div class="stat-row">
            <span class="stat-label">Latency</span>
            <span class="stat-value">&lt; 12ms Global</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Throughput</span>
            <span class="stat-value">100 GB/s</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Encryption</span>
            <span class="stat-value">AES-256-GCM</span>
          </div>
        </div>
      </div>
      <div>
        <a href="https://google.com" target="_blank" rel="noopener" class="cta-btn">
          Explore Free Tier →
        </a>
        <div class="footer-note">Ads by Google Ad Manager • AdChoices</div>
      </div>
    </body>
    </html>
  `;

  // If user is Pro and hasn't toggled preview on, show ad-free experience card
  if (isPro && !previewMode) {
    return (
      <aside aria-label="Ad Space (Pro Member)" className={`w-full ${className}`}>
        <div className="border-2 border-[#141414] bg-white rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#141414]/15">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-emerald-500 rounded-sm flex items-center justify-center text-black">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs uppercase tracking-widest font-bold text-[#141414]">
                Ad-Free Active
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm font-bold">
              PRO PERK
            </span>
          </div>

          <p className="text-xs text-neutral-700 leading-relaxed font-normal">
            As a Pro subscriber, third-party advertisements and tracker frames are silenced on your workspace.
          </p>

          <button
            onClick={() => setPreviewMode(true)}
            className="w-full border border-[#141414] py-2.5 px-3 rounded-sm text-xs font-bold uppercase tracking-wider text-neutral-700 hover:text-neutral-950 hover:bg-[#141414]/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Ad Slot Layout
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="Advertisement Space" className={`w-full ${className}`}>
      {/* Outer Brutalist Frame */}
      <div className="border-2 border-[#141414] bg-white rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] overflow-hidden">
        {/* Ad Header Bar */}
        <div className="bg-[#141414] text-[#E4E3E0] px-3.5 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold">
              Advertisement
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-1 hover:bg-white/10 rounded-sm text-[#E4E3E0] transition-colors cursor-pointer"
              title="Ad Info / AdChoices"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {isPro && (
              <button
                onClick={() => setPreviewMode(false)}
                className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Hide Preview"
              >
                <EyeOff className="w-3 h-3" />
                Hide
              </button>
            )}

            {!isPro && onUpgrade && (
              <button
                onClick={onUpgrade}
                className="bg-emerald-500 text-black px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-2.5 h-2.5" />
                No Ads
              </button>
            )}
          </div>
        </div>

        {/* AdChoices & GAM Info Dropdown */}
        {showInfo && (
          <div className="p-3 bg-neutral-100 border-b border-[#141414]/15 text-[11px] text-neutral-700 space-y-1.5 font-mono">
            <div className="font-bold uppercase tracking-wider text-[#141414] flex items-center justify-between">
              <span>Google Ad Manager</span>
              <span className="text-[9px] bg-neutral-200 px-1.5 py-0.5 rounded-sm">UNIT1_0</span>
            </div>
            <p className="text-[10px] leading-relaxed">
              Standard Google SafeFrame ad container slot (UNIT1_0). Free tier transfers are supported by sponsored partner placements.
            </p>
          </div>
        )}

        {/* EXACT GAM CONTAINER REQUESTED BY THE USER */}
        <div
          className="gam-container"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(20, 20, 20, 0.03) 0%, rgba(20, 20, 20, 0.08) 100%)',
            backgroundSize: 'cover',
            transition: 'top 0.2s ease-in-out',
            minHeight: '562px',
            position: 'relative',
            backgroundColor: '#0f1115'
          }}
        >
          <div
            id="div-gpt-ad-1539221224196-0"
            tabIndex={-1}
            data-google-query-id="CLTNv87H-JcDFWmhCgkd_s0YEw"
            style={{
              opacity: 1,
              transition: 'opacity 0.3s ease-in-out',
              pointerEvents: 'auto'
            }}
          >
            <div
              id="google_ads_iframe_21678581572/Web/UNIT1_0__container__"
              style={{
                border: '0pt',
                display: 'inline-block',
                width: '100%',
                height: 'auto'
              }}
            >
              <iframe
                frameBorder="0"
                src="https://7c094465bd5619b17546641cd77f7def.safeframe.googlesyndication.com/safeframe/1-0-45/html/container.html"
                srcDoc={creativeSrcDoc}
                id="google_ads_iframe_21678581572/Web/UNIT1_0"
                title="3rd party ad content"
                name=""
                scrolling="no"
                marginWidth={0}
                marginHeight={0}
                width="0"
                height="562"
                data-is-safeframe="true"
                sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
                allow="private-state-token-redemption"
                aria-label="Advertisement"
                tabIndex={0}
                data-google-container-id="1"
                style={{
                  border: '0px',
                  verticalAlign: 'bottom',
                  minWidth: '100%',
                  display: 'block'
                }}
                data-load-complete="true"
              />
            </div>
          </div>
        </div>

        {/* Bottom Banner Footer with Ad Support Notice */}
        <div className="p-3 bg-[#E4E3E0] border-t border-[#141414] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#141414]">
              ClipCloud Free Sponsored Space
            </div>
            <div className="text-[9px] text-neutral-600 font-mono">
              Upgrade to Pro to remove all ads & unlock 100k clips.
            </div>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="bg-[#141414] text-[#E4E3E0] px-3 py-1.5 rounded-sm font-bold uppercase tracking-widest text-[9px] hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
            >
              Remove Ads
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
