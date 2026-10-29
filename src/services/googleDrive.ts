import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file'
];

// In-memory cache for the OAuth access token (per security requirements)
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

export const connectGoogleDrive = async (): Promise<string> => {
  const provider = new GoogleAuthProvider();
  DRIVE_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({
    prompt: 'consent',
    access_type: 'online'
  });

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
}

export const listGoogleDriveFiles = async (
  token: string,
  searchQuery: string = ''
): Promise<DriveFileItem[]> => {
  let q = "trashed = false";
  if (searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('pageSize', '40');
  url.searchParams.set(
    'fields',
    'nextPageToken,files(id,name,mimeType,size,thumbnailLink,iconLink,modifiedTime)'
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
    modifiedTime: f.modifiedTime
  }));
};

/**
 * Downloads a file from Google Drive and returns a native File object
 * ready for ClipCloud upload and sharing.
 */
export const downloadDriveFile = async (
  token: string,
  driveFile: DriveFileItem
): Promise<File> => {
  let downloadUrl: string;
  let finalFileName = driveFile.name;
  let finalMimeType = driveFile.mimeType;

  // Handle Google Docs / Sheets / Slides export
  if (driveFile.mimeType === 'application/vnd.google-apps.document') {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=application/pdf`;
    finalFileName = `${driveFile.name}.pdf`;
    finalMimeType = 'application/pdf';
  } else if (driveFile.mimeType === 'application/vnd.google-apps.spreadsheet') {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=application/pdf`;
    finalFileName = `${driveFile.name}.pdf`;
    finalMimeType = 'application/pdf';
  } else if (driveFile.mimeType === 'application/vnd.google-apps.presentation') {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=application/pdf`;
    finalFileName = `${driveFile.name}.pdf`;
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
