import { Timestamp } from 'firebase/firestore';

export interface ClipFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadUrl: string;
}

export interface ClipData {
  id: string;
  content?: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  authorUid: string | null;
  tier: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  downloadUrl?: string;
  hasFile?: boolean;
  files?: ClipFile[];
  usageMode?: 'single' | 'multi';
  maxRedemptions?: number; // e.g. 1, 2, 5, 10, or -1 (unlimited)
  viewCount?: number;
  burnOnRead?: boolean;
}

export interface Bundle {
  id: string;
  name: string;
  clipIds: string[];
  ownerUid: string;
  createdAt: Timestamp;
}

