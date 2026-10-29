import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Get Firestore instance with the specific database ID
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-c46308a5-897a-47fe-949e-b4690a70eabe');

// Get Auth instance
export const auth = getAuth(app);

// Get Storage instance
export const storage = getStorage(app);
