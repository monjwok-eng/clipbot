import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Get Firestore instance with the specific database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Get Auth instance
export const auth = getAuth(app);
