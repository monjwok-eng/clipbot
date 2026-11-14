import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file'
];

// In-memory cache for the OAuth access token
let cachedAccessToken: string | null = null;

// Clear cached token if user logs out
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

export const connectGoogleDrive = async (forceAccountSelect = false): Promise<string> => {
  const provider = new GoogleAuthProvider();
  DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));

  if (forceAccountSelect) {
    provider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'online'
    });
  } else {
    provider.setCustomParameters({
      access_type: 'online'
    });
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive access token.');
    }
    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (error: any) {
    console.error('Google Drive auth error:', error);
    throw error;
  }
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
