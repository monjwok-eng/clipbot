import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Share2, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  X,
  Smartphone,
  Laptop,
  Lock
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "The Universal Clipboard",
    description: "ClipCloud is designed for instant data transfer between your devices. No accounts, no cables, no friction.",
    icon: <Share2 className="w-8 h-8" />,
    color: "bg-[#141414]",
    accent: "text-white"
  },
  {
    title: "Step 1: Share",
    description: "Paste text or upload files on one device. We generate a unique 8-character code instantly.",
    icon: <Smartphone className="w-8 h-8" />,
    color: "bg-emerald-500",
    accent: "text-black"
  },
  {
    title: "Step 2: Get",
    description: "Enter that code on any other device to retrieve your content. It's that simple.",
    icon: <Laptop className="w-8 h-8" />,
    color: "bg-blue-500",
    accent: "text-white"
  },
  {
    title: "Security & Privacy",
    description: "Clips are temporary. Free clips vanish in 60s. Pro clips last 24h. Everything is purged automatically.",
    icon: <Lock className="w-8 h-8" />,
    color: "bg-amber-500",
    accent: "text-black"
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

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
        className="bg-[#E4E3E0] border-2 border-[#141414] max-w-lg w-full rounded-sm shadow-[16px_16px_0px_0px_rgba(20,20,20,1)] overflow-hidden flex flex-col"
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
              <div className={`w-16 h-16 ${steps[currentStep].color} ${steps[currentStep].accent} rounded-sm flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]`}>
                {steps[currentStep].icon}
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-serif italic font-bold leading-tight">
                  {steps[currentStep].title}
                </h2>
                <p className="text-sm sm:text-base opacity-70 leading-relaxed font-mono">
                  {steps[currentStep].description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="pt-4 flex flex-col gap-3">
            <button 
              onClick={nextStep}
              className="w-full bg-[#141414] text-[#E4E3E0] py-4 rounded-sm font-bold uppercase tracking-[0.2em] hover:bg-[#141414]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Start Sharing
                </>
              ) : (
                <>
                  Next Step
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            {currentStep < steps.length - 1 && (
              <button 
                onClick={onComplete}
                className="text-[10px] uppercase tracking-widest font-bold opacity-40 hover:opacity-100 transition-opacity"
              >
                Skip Tutorial
              </button>
            )}
          </div>
        </div>

        <div className="p-4 bg-[#141414]/5 border-t border-[#141414]/10 flex justify-between items-center">
          <div className="flex items-center gap-2 opacity-30">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[8px] uppercase tracking-widest font-bold">Encrypted Protocol</span>
          </div>
          <span className="text-[10px] font-mono opacity-30">0{currentStep + 1} / 0{steps.length}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};
