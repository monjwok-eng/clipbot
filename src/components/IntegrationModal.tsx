import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { GoogleDriveIcon, DropboxIcon, ICloudIcon } from './CloudIcons';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: string | null;
  onIntegrate: () => void;
}

export const IntegrationModal: React.FC<IntegrationModalProps> = ({ isOpen, onClose, service, onIntegrate }) => {
  if (!isOpen) return null;

  const serviceName = service === 'drive' ? 'Google Drive' : service === 'dropbox' ? 'Dropbox' : 'iCloud';

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
            exit={{ scale: 0.95, y: 20 }}
            className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-sm rounded-sm p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-[#141414]/5 rounded-sm transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-white border border-[#141414]/15 shadow-sm flex items-center justify-center">
                {service === 'drive' && <GoogleDriveIcon className="w-7 h-7" />}
                {service === 'dropbox' && <DropboxIcon className="w-7 h-7" />}
                {service === 'icloud' && <ICloudIcon className="w-8 h-8" />}
              </div>

              <div>
                <h2 className="text-xl font-bold uppercase tracking-widest">Connect {serviceName}</h2>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1">ClipCloud Integration</p>
              </div>

              <p className="text-xs opacity-60 leading-relaxed font-light">
                Linking your {serviceName} account allows ClipCloud to browse and select files for your clipboard. We only access the specific files you choose to share.
              </p>

              <div className="space-y-2 pt-2">
                <button 
                  onClick={onIntegrate}
                  className="w-full bg-[#141414] text-[#E4E3E0] py-3.5 rounded-sm font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-2"
                >
                  Integrate to ClipCloud
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-2 text-[10px] uppercase font-bold tracking-widest opacity-50 hover:opacity-100 transition-opacity"
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
