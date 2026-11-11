import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { GoogleDriveIcon, DropboxIcon, ICloudIcon } from './CloudIcons';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: string | null;
  onIntegrate: (customKey?: string) => void;
}

export const IntegrationModal: React.FC<IntegrationModalProps> = ({ isOpen, onClose, service, onIntegrate }) => {
  const [dropboxKey, setDropboxKey] = useState<string>(() => {
    return localStorage.getItem('sendarro_dropbox_key') || (import.meta as any).env?.VITE_DROPBOX_APP_KEY || 'j9s5gbr2hthi45j';
  });

  if (!isOpen) return null;

  const serviceName = service === 'drive' ? 'Google Drive' : service === 'dropbox' ? 'Dropbox' : 'iCloud';

  const handleConfirm = () => {
    const keyToUse = dropboxKey.trim() || 'j9s5gbr2hthi45j';
    if (service === 'dropbox' && keyToUse) {
      localStorage.setItem('sendarro_dropbox_key', keyToUse);
    }
    onIntegrate(keyToUse);
  };

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
              className="absolute top-4 right-4 p-2 hover:bg-[#141414]/5 rounded-sm transition-colors cursor-pointer"
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
                <h2 className="text-xl font-bold uppercase tracking-widest text-[#141414]">Connect {serviceName}</h2>
                <p className="text-[11px] uppercase font-bold tracking-wider text-neutral-600 mt-1">Sendarro Integration</p>
              </div>

              <p className="text-xs text-neutral-700 leading-relaxed font-normal">
                Linking your {serviceName} account allows Sendarro to browse and select files for your clipboard. We only access the specific files you choose to share.
              </p>

              {service === 'dropbox' && (
                <div className="space-y-1.5 text-left bg-white/70 p-3 border border-[#141414]/15 rounded-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-700">
                      Dropbox App Key
                    </label>
                    <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-xs border border-emerald-300">
                      CONFIGURED
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="j9s5gbr2hthi45j"
                    value={dropboxKey}
                    onChange={(e) => setDropboxKey(e.target.value)}
                    className="w-full p-2 border border-[#141414] rounded-sm font-mono text-xs bg-white text-[#141414] focus:outline-none"
                  />
                  <p className="text-[9px] text-neutral-500 font-mono">
                    Official App Key connected. Click below to browse and select files.
                  </p>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button 
                  onClick={handleConfirm}
                  className="w-full bg-[#141414] text-[#E4E3E0] py-3.5 rounded-sm font-bold uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  Integrate to Sendarro
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
