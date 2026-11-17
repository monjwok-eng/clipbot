import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FaqAccordionProps {
  title?: string;
  subtitle?: string;
  items: FaqItem[];
  defaultOpenId?: string | null;
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({
  title = 'Frequently Asked Questions',
  subtitle,
  items,
  defaultOpenId = null,
}) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      aria-labelledby="faq-section-heading"
      className="bg-white border-2 border-[#141414] rounded-sm shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] overflow-hidden"
    >
      <div className="p-6 sm:p-10 border-b-2 border-[#141414] bg-[#F9F9F8] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-neutral-600">
            <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Questions &amp; Answers</span>
          </div>
          <h2
            id="faq-section-heading"
            className="text-2xl sm:text-3xl font-serif italic font-bold text-[#141414] tracking-tight"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-600 max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        <div className="text-[11px] font-mono text-neutral-500 tabular-nums shrink-0">
          {items.length} topics
        </div>
      </div>

      <div className="divide-y divide-[#141414]/15">
        {items.map((item, idx) => {
          const isOpen = openId === item.id;
          const panelId = `faq-panel-${item.id}`;
          const buttonId = `faq-btn-${item.id}`;
          const indexLabel = String(idx + 1).padStart(2, '0');

          return (
            <div key={item.id} className="transition-colors hover:bg-[#F9F9F8]/70">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 sm:px-10 py-5 flex items-center justify-between gap-4 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#141414]"
              >
                <div className="flex items-baseline gap-3 sm:gap-4 min-w-0">
                  <span className="font-mono text-xs font-bold text-neutral-400 tabular-nums shrink-0">
                    {indexLabel}.
                  </span>
                  <div className="space-y-1 min-w-0">
                    <span className="block text-sm sm:text-base font-bold text-[#141414] leading-snug">
                      {item.question}
                    </span>
                    {item.category && (
                      <span className="block text-[11px] font-mono text-neutral-500">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  aria-hidden="true"
                  className={`w-8 h-8 border border-[#141414] rounded-sm flex items-center justify-center shrink-0 transition-colors duration-150 ${
                    isOpen
                      ? 'bg-[#141414] text-white'
                      : 'bg-white text-[#141414]'
                  }`}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-150 ${
                      isOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </span>
              </button>

              {isOpen && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="px-6 sm:px-10 pb-6 pl-12 sm:pl-18 pr-6 sm:pr-20"
                >
                  <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed max-w-3xl">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
