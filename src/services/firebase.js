// src/services/firebase.js

// 1) IMPORT THE FUNCTIONS YOU NEED
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 2) YOUR WEB APP'S FIREBASE CONFIG (keep these values secret in a real repo!)
const firebaseConfig = {
  apiKey: "AIzaSyBpTHo5QWn4CunTGuVVcD_f5Zzr3eQY060",
  authDomain: "offer-generator-57aea.firebaseapp.com",
  projectId: "offer-generator-57aea",
  storageBucket: "offer-generator-57aea.appspot.com",
  messagingSenderId: "925289056145",
  appId: "1:925289056145:web:b1b5e3902756c15cdf3c30",
  measurementId: "G-QSSEYJL003"
};

// 3) INITIALIZE APP + ANALYTICS
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 4) AUTH INSTANCE
export const auth = getAuth(app);

// 5) FIRESTORE INSTANCE
export const db = getFirestore(app);

// 6) STORAGE INSTANCE
export const storage = getStorage(app);

// 7) OAUTH PROVIDERS
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider("apple.com");

// (Optional) If you need analytics elsewhere:
export { analytics, app };
