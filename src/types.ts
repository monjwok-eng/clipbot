import { Timestamp } from 'firebase/firestore';

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
}

export interface Bundle {
  id: string;
  name: string;
  clipIds: string[];
  ownerUid: string;
  createdAt: Timestamp;
}
