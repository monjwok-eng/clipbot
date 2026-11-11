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

export const IntegrationModal: React.FC<IntegrationModalProps> = ({ isOpen, onClose, service, onIntegrate }) => {
  if (!isOpen) return null;

  const serviceName = service === 'drive' ? 'Google Drive' : service === 'dropbox' ? 'Dropbox' : 'Cloud';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/40 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 0 }}
            className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-sm rounded-sm p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-[#141414]/5 rounded-sm transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-white border border-[#141414]/15 shadow-sm flex items-center justify-center">
                {service === 'drive' && <GoogleDriveIcon className="w-7 h-7" />}
                {service === 'dropbox' && <DropboxIcon className="w-7 h-7" />}
              </div>

              <div>
                <h2 className="text-xl font-bold uppercase tracking-widest text-[#141414]">Connect {serviceName}</h2>
                <p className="text-[11px] uppercase font-bold tracking-wider text-neutral-600 mt-1">Sendarro Cloud Integration</p>
              </div>

              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                Linking your {serviceName} account allows Sendarro to browse and select files for your clipboard. Only files you explicitly select will be attached.
              </p>

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 py-1.5 px-3 rounded-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted & Privacy First</span>
              </div>

              <div className="space-y-2 pt-1">
                <button 
                  onClick={onIntegrate}
                  className="w-full bg-[#141414] text-[#E4E3E0] py-3.5 rounded-sm font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  Connect & Select Files
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-2 text-xs uppercase font-bold tracking-wider text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
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
