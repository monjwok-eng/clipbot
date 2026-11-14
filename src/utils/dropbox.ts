declare const window: any;

export interface PickedDropboxFile {
  name: string;
  link: string;
  bytes: number;
  icon?: string;
  thumbnailLink?: string;
  file?: File;
}

export const DEFAULT_DROPBOX_APP_KEY = 'j9s5gbr2hthi45j';

// Loads the official Dropbox Chooser script
export function loadDropboxScript(appKey?: string): Promise<void> {
  const effectiveKey = (appKey && appKey.trim()) || (import.meta as any).env?.VITE_DROPBOX_APP_KEY || DEFAULT_DROPBOX_APP_KEY;
  return new Promise((resolve, reject) => {
    if (window.Dropbox && window.Dropbox.choose) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('dropboxjs');
    if (existingScript) {
      if (window.Dropbox && window.Dropbox.choose) {
        resolve();
        return;
      }
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.id = 'dropboxjs';
    script.type = 'text/javascript';
    script.src = 'https://www.dropbox.com/static/api/2/dropins.js';
    script.setAttribute('data-app-key', effectiveKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Dropbox Chooser script'));
    document.body.appendChild(script);
  });
}

// Launch the Dropbox Chooser
export async function openDropboxChooser(
  appKey: string = DEFAULT_DROPBOX_APP_KEY,
  onSelect: (files: PickedDropboxFile[]) => void,
  onCancel?: () => void,
  onError?: (err: any) => void
): Promise<void> {
  const effectiveKey = (appKey && appKey.trim()) || (import.meta as any).env?.VITE_DROPBOX_APP_KEY || DEFAULT_DROPBOX_APP_KEY;
  try {
    await loadDropboxScript(effectiveKey);

    if (!window.Dropbox || !window.Dropbox.choose) {
      throw new Error('Dropbox Chooser could not be initialized');
    }

    window.Dropbox.choose({
      success: async (files: any[]) => {
        const pickedFiles: PickedDropboxFile[] = [];

        for (const f of files) {
          try {
            // Attempt to fetch file bytes to create a native File for Sendarro upload
            const res = await fetch(f.link);
            if (res.ok) {
              const blob = await res.blob();
              const nativeFile = new File([blob], f.name, { type: blob.type || 'application/octet-stream' });
              pickedFiles.push({
                name: f.name,
                link: f.link,
                bytes: f.bytes || blob.size,
                icon: f.icon,
                thumbnailLink: f.thumbnailLink,
                file: nativeFile,
              });
            } else {
              pickedFiles.push({
                name: f.name,
                link: f.link,
                bytes: f.bytes || 0,
                icon: f.icon,
                thumbnailLink: f.thumbnailLink,
              });
            }
          } catch (fetchErr) {
            console.warn('Could not fetch Dropbox file bytes directly, attaching link:', fetchErr);
            pickedFiles.push({
              name: f.name,
              link: f.link,
              bytes: f.bytes || 0,
              icon: f.icon,
              thumbnailLink: f.thumbnailLink,
            });
          }
        }

        onSelect(pickedFiles);
      },
      cancel: () => {
        if (onCancel) onCancel();
      },
      linkType: 'direct', // Direct link for downloads
      multiselect: true,
      folderselect: false,
    });
  } catch (err: any) {
    console.error('Dropbox Chooser error:', err);
    if (onError) onError(err);
  }
}

export interface DropboxSaveFile {
  url: string;
  filename: string;
}

// Launch the official Dropbox Saver Drop-in to save files cloud-to-cloud directly to Dropbox
export async function openDropboxSaver(
  appKey: string = DEFAULT_DROPBOX_APP_KEY,
  files: DropboxSaveFile[],
  callbacks?: {
    onSuccess?: () => void;
    onProgress?: (progress: number) => void;
    onCancel?: () => void;
    onError?: (errorMessage: string) => void;
  }
): Promise<void> {
  if (!files || files.length === 0) {
    callbacks?.onError?.('No files available to save to Dropbox.');
    return;
  }

  const effectiveKey = (appKey && appKey.trim()) || (import.meta as any).env?.VITE_DROPBOX_APP_KEY || DEFAULT_DROPBOX_APP_KEY;

  try {
    if (!window.Dropbox || !window.Dropbox.save) {
      await loadDropboxScript(effectiveKey);
    }

    if (!window.Dropbox || !window.Dropbox.save) {
      throw new Error('Dropbox Saver could not be initialized');
    }

    window.Dropbox.save({
      files,
      success: () => {
        callbacks?.onSuccess?.();
      },
      progress: (progress: number) => {
        callbacks?.onProgress?.(progress);
      },
      cancel: () => {
        callbacks?.onCancel?.();
      },
      error: (errorMessage: string) => {
        callbacks?.onError?.(errorMessage || 'Failed to save files to Dropbox.');
      },
    });
  } catch (err: any) {
    console.error('Dropbox Saver error:', err);
    callbacks?.onError?.(err?.message || 'Could not launch Dropbox Saver.');
  }
}

