import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
  }
}

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file'
];

// In-memory cache for the Drive-only OAuth access token (never stored in localStorage)
let cachedAccessToken: string | null = null;
let gsiLoadPromise: Promise<void> | null = null;

// Clear cached Drive token if the main Sendarro user signs out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setDriveAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
};

export const clearDriveAccessToken = (): void => {
  cachedAccessToken = null;
};

/**
 * Loads Google Identity Services (GIS) script dynamically.
 * Using GIS initTokenClient keeps Google Drive OAuth completely separate
 * from Firebase Auth so switching Drive accounts never changes the main Sendarro user.
 */
export const loadGsiScript = (): Promise<void> => {
  if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  if (gsiLoadPromise) {
    return gsiLoadPromise;
  }

  gsiLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      const checkReady = () => {
        if (window.google?.accounts?.oauth2) {
          resolve();
        } else {
          setTimeout(checkReady, 50);
        }
      };
      checkReady();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.oauth2) {
        resolve();
      } else {
        gsiLoadPromise = null;
        reject(new Error('Google Identity Services failed to initialize.'));
      }
    };
    script.onerror = () => {
      gsiLoadPromise = null;
      reject(new Error('Failed to load Google Identity Services script.'));
    };
    document.head.appendChild(script);
  });

  return gsiLoadPromise;
};

export const connectGoogleDrive = async (forceAccountSelect = false): Promise<string> => {
  await loadGsiScript();

  const clientId = (firebaseConfig as { oAuthClientId?: string }).oAuthClientId;
  if (!clientId) {
    throw new Error('Google OAuth Client ID is not configured.');
  }

  return new Promise<string>((resolve, reject) => {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPES.join(' '),
        callback: (tokenResponse: any) => {
          if (tokenResponse?.error) {
            const err: any = new Error(tokenResponse.error_description || tokenResponse.error);
            if (tokenResponse.error === 'access_denied') {
              err.code = 'auth/popup-closed-by-user';
            }
            reject(err);
            return;
          }
          if (!tokenResponse?.access_token) {
            reject(new Error('Failed to obtain Google Drive access token.'));
            return;
          }
          cachedAccessToken = tokenResponse.access_token;
          resolve(tokenResponse.access_token);
        },
        error_callback: (err: any) => {
          const isClosed = err?.type === 'popup_closed';
          const isBlocked = err?.type === 'popup_failed_to_open';
          const msg = isClosed
            ? 'Google Drive authorization popup was closed.'
            : isBlocked
              ? 'Popup blocked by browser. Please allow popups to connect Google Drive.'
              : err?.message || 'Google Drive authorization failed.';
          const errorObj: any = new Error(msg);
          if (isClosed) {
            errorObj.code = 'auth/popup-closed-by-user';
          }
          reject(errorObj);
        }
      });

      tokenClient.requestAccessToken({
        prompt: forceAccountSelect ? 'select_account' : '',
        hint: !forceAccountSelect ? auth.currentUser?.email || undefined : undefined
      });
    } catch (err) {
      reject(err);
    }
  });
};

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  iconLink?: string;
  modifiedTime?: string;
  webViewLink?: string;
  starred?: boolean;
  shared?: boolean;
  fileExtension?: string;
}

export const listGoogleDriveFiles = async (
  token: string,
  searchQuery: string = ''
): Promise<DriveFileItem[]> => {
  let q = "trashed = false and mimeType != 'application/vnd.google-apps.folder'";
  if (searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('pageSize', '60');
  url.searchParams.set(
    'fields',
    'nextPageToken,files(id,name,mimeType,size,thumbnailLink,iconLink,modifiedTime,webViewLink,starred,shared,fileExtension)'
  );
  url.searchParams.set('q', q);
  url.searchParams.set('orderBy', 'modifiedTime desc');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('Google Drive session expired. Please reconnect.');
    }
    throw new Error(errData.error?.message || 'Failed to list Google Drive files.');
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    size: f.size,
    thumbnailLink: f.thumbnailLink,
    iconLink: f.iconLink,
    modifiedTime: f.modifiedTime,
    webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    starred: Boolean(f.starred),
    shared: Boolean(f.shared),
    fileExtension: f.fileExtension
  }));
};

/**
 * Downloads or exports a file from Google Drive and returns a native File object.
 * Uses /api/export-drive-file first to prevent CORS issues and corrupted exports.
 */
export const downloadDriveFile = async (
  token: string,
  driveFile: DriveFileItem
): Promise<File> => {
  try {
    const exportRes = await fetch('/api/export-drive-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId: driveFile.id,
        accessToken: token,
        mimeType: driveFile.mimeType,
        fileName: driveFile.name
      })
    });

    if (exportRes.ok) {
      const blob = await exportRes.blob();
      const serverFileName = exportRes.headers.get('X-File-Name')
        ? decodeURIComponent(exportRes.headers.get('X-File-Name')!)
        : driveFile.name;
      const serverFileType =
        exportRes.headers.get('X-File-Type') ||
        exportRes.headers.get('Content-Type') ||
        driveFile.mimeType;

      return new File([blob], serverFileName, { type: serverFileType });
    }
  } catch (err) {
    console.warn('Server export route fallback to direct Drive API:', err);
  }

  let downloadUrl: string;
  let finalFileName = driveFile.name;
  let finalMimeType = driveFile.mimeType;

  if (driveFile.mimeType === 'application/vnd.google-apps.document') {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document`;
    if (!finalFileName.toLowerCase().endsWith('.docx')) finalFileName = `${driveFile.name}.docx`;
    finalMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (driveFile.mimeType === 'application/vnd.google-apps.spreadsheet') {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
    if (!finalFileName.toLowerCase().endsWith('.xlsx')) finalFileName = `${driveFile.name}.xlsx`;
    finalMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (driveFile.mimeType === 'application/vnd.google-apps.presentation') {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=application/vnd.openxmlformats-officedocument.presentationml.presentation`;
    if (!finalFileName.toLowerCase().endsWith('.pptx')) finalFileName = `${driveFile.name}.pptx`;
    finalMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  } else if (driveFile.mimeType === 'application/vnd.google-apps.drawing') {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=application/pdf`;
    if (!finalFileName.toLowerCase().endsWith('.pdf')) finalFileName = `${driveFile.name}.pdf`;
    finalMimeType = 'application/pdf';
  } else {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media`;
  }

  const res = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to download "${driveFile.name}" from Google Drive.`);
  }

  const blob = await res.blob();
  return new File([blob], finalFileName, { type: finalMimeType || blob.type });
};
