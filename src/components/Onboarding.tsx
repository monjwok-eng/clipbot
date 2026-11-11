import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, 
  ArrowRight, 
  CheckCircle2, 
  Smartphone,
  Laptop,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { LanguageCode, translations } from '../utils/i18n';

interface OnboardingProps {
  onComplete: () => void;
  currentLang?: LanguageCode;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, currentLang = 'en' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const t = translations[currentLang] || translations.en;

  const steps = [
    {
      title: t.onboardingTitle1,
      description: t.onboardingDesc1,
      icon: <Share2 className="w-8 h-8" />,
      color: "bg-[#141414]",
      accent: "text-white"
    },
    {
      title: t.onboardingTitle2,
      description: t.onboardingDesc2,
      icon: <Smartphone className="w-8 h-8" />,
      color: "bg-emerald-500",
      accent: "text-black"
    },
    {
      title: t.onboardingTitle3,
      description: t.onboardingDesc3,
      icon: <Laptop className="w-8 h-8" />,
      color: "bg-blue-500",
      accent: "text-white"
    },
    {
      title: t.onboardingTitle4,
      description: t.onboardingDesc4,
      icon: <Lock className="w-8 h-8" />,
      color: "bg-amber-500",
      accent: "text-black"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-[#141414]/90 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#E4E3E0] border border-[#141414] max-w-lg w-full rounded-md shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden flex flex-col"
      >
        {/* Progress Bar */}
        <div className="flex h-2 bg-[#141414]/10">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 transition-all duration-500 ${i <= currentStep ? 'bg-[#141414]' : ''}`}
            />
          ))}
        </div>

        <div className="p-8 sm:p-12 space-y-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-center"
            >
              <div className={`w-16 h-16 ${steps[currentStep].color} ${steps[currentStep].accent} rounded-md flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]`}>
                {steps[currentStep].icon}
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-serif italic font-bold leading-tight text-[#141414]">
                  {steps[currentStep].title}
                </h2>
                <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
                  {steps[currentStep].description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={nextStep}
              className="w-full bg-[#141414] text-[#E4E3E0] py-4 rounded-md font-bold uppercase tracking-[0.2em] hover:bg-[#141414]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  {t.startSharing}
                </>
              ) : (
                <>
                  {t.nextStep}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            {currentStep < steps.length - 1 && (
              <button 
                onClick={onComplete}
                className="text-xs uppercase tracking-wider font-semibold text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
              >
                {t.skipTutorial}
              </button>
            )}
          </div>
        </div>

        <div className="p-4 bg-[#141414]/5 border-t border-[#141414]/10 flex justify-between items-center">
          <div className="flex items-center gap-2 text-neutral-600">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
            <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-700">{t.encryptedProtocol}</span>
          </div>
          <span className="text-xs font-mono font-semibold text-neutral-700">0{currentStep + 1} / 0{steps.length}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
