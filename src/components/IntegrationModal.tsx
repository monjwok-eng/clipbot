import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck } from 'lucide-react';
import { GoogleDriveIcon, DropboxIcon } from './CloudIcons';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: string | null;
  onIntegrate: () => void;
}

export const IntegrationModal: React.FC<IntegrationModalProps> = ({
  isOpen,
  onClose,
  service,
  onIntegrate
}) => {
  const serviceName =
    service === 'drive' ? 'Google Drive' : service === 'dropbox' ? 'Dropbox' : 'Cloud Storage';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#141414]/45 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F4F3F0] border-2 border-[#141414] w-full max-w-sm rounded-sm p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-[#141414]/5 rounded-sm transition-colors text-[#141414] cursor-pointer"
              title="Close"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-5 text-center pt-1">
              <div className="w-12 h-12 mx-auto rounded-sm bg-white border border-[#141414]/15 flex items-center justify-center">
                {service === 'drive' && <GoogleDriveIcon className="w-6 h-6" />}
                {service === 'dropbox' && <DropboxIcon className="w-6 h-6" />}
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-serif italic font-bold text-[#141414]">
                  Connect {serviceName}
                </h2>
                <p className="text-xs font-mono text-neutral-500">
                  Sendarro Cloud Integration
                </p>
              </div>

              <p className="text-xs text-neutral-700 leading-relaxed">
                Authorize {serviceName} to browse and attach files to your clip. Only items you explicitly select are shared.
              </p>

              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-600 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Read-only selection · Encrypted transfer</span>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={onIntegrate}
                  className="w-full min-h-[44px] bg-[#141414] text-white py-2.5 px-4 rounded-sm font-medium text-xs hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  Continue with {serviceName}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full min-h-[40px] py-2 text-xs font-medium text-neutral-600 hover:text-[#141414] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
