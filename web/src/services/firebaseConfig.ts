import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForProductionDemo12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "naryad-ai-kostanai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "naryad-ai-kostanai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "naryad-ai-kostanai.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "109823471029",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:109823471029:web:a8d9b1c2e3f4"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

export function isFirebaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_FIREBASE_API_KEY);
}
