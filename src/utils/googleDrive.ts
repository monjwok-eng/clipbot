import { getDriveAccessToken as getCachedServiceToken, connectGoogleDrive } from '../services/googleDrive';

declare const google: any;
declare const gapi: any;

// Load the Google API script dynamically
export function loadGapiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof gapi !== 'undefined' && gapi.load) {
      gapi.load('picker', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gapi.load('picker', () => resolve());
    };
    script.onerror = () => reject(new Error('Failed to load Google API script'));
    document.body.appendChild(script);
  });
}

// Get or request Google OAuth access token with Drive scopes (decoupled from Firebase Auth)
export async function getDriveAccessToken(): Promise<string> {
  const existing = getCachedServiceToken();
  if (existing) {
    return existing;
  }
  return connectGoogleDrive(false);
}

export interface PickedDriveFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  url?: string;
  file?: File;
}

// Google Workspace document export configurations
const GOOGLE_DOCS_EXPORT_MAP: Record<string, { mimeType: string; ext: string }> = {
  'application/vnd.google-apps.document': {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ext: '.docx',
  },
  'application/vnd.google-apps.spreadsheet': {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ext: '.xlsx',
  },
  'application/vnd.google-apps.presentation': {
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ext: '.pptx',
  },
  'application/vnd.google-apps.drawing': {
    mimeType: 'application/pdf',
    ext: '.pdf',
  },
};

// Launch the Google Drive Picker UI
export async function openGoogleDrivePicker(
  onSelect: (file: PickedDriveFile) => void,
  onError: (err: any) => void
): Promise<void> {
  try {
    await loadGapiScript();
    const accessToken = await getDriveAccessToken();

    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const pickerCallback = async (data: any) => {
      if (data.action === google.picker.Action.PICKED) {
        const doc = data.docs[0];
        const fileId = doc.id;
        const fileName = doc.name || 'document';
        const mimeType = doc.mimeType || 'application/octet-stream';

        try {
          const exportRes = await fetch('/api/export-drive-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileId,
              accessToken,
              mimeType,
              fileName,
            }),
          });

          if (exportRes.ok) {
            const blob = await exportRes.blob();
            const serverFileName = exportRes.headers.get('X-File-Name')
              ? decodeURIComponent(exportRes.headers.get('X-File-Name')!)
              : fileName;
            const serverFileType = exportRes.headers.get('X-File-Type')
              || exportRes.headers.get('Content-Type')
              || mimeType;

            const nativeFile = new File([blob], serverFileName, { type: serverFileType });
            onSelect({
              id: fileId,
              name: serverFileName,
              mimeType: serverFileType,
              sizeBytes: blob.size,
              file: nativeFile,
            });
            return;
          }

          const errJson = await exportRes.json().catch(() => ({}));
          throw new Error(errJson.error || 'Failed to export document from Google Drive');
        } catch (fetchErr: any) {
          console.error('Direct media download failed:', fetchErr);
          onError(fetchErr);
        }
      }
    };

    const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false);

    const picker = new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setCallback(pickerCallback)
      .setOrigin(pickerOrigin)
      .setTitle('Select a document from Google Drive')
      .build();

    picker.setVisible(true);
  } catch (err: any) {
    console.error('Google Picker error:', err);
    onError(err);
  }
}
