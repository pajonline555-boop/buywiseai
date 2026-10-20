import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "build-fallback-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "pajonline-shopping.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://pajonline-shopping-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pajonline-shopping",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "pajonline-shopping.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "226689194744",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:226689194744:web:0fd2ce3c17575df609790d",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-YX4V21WF2F"
};

// Initialize Firebase with build-time resilience
let app: any;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (e) {
  app = getApps()[0];
}

let auth: any;
try {
  auth = getAuth(app);
} catch (e) {
  console.warn("[Firebase Auth Build Init Notice]:", e);
}

let db: any;
try {
  db = getFirestore(app);
} catch (e) {
  console.warn("[Firestore Build Init Notice]:", e);
}

const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
