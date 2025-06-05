// src/services/firebase.js

// 1) IMPORT THE FUNCTIONS YOU NEED FROM THE SDKS YOU NEED
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 2) YOUR WEB APP'S FIREBASE CONFIGURATION
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpTHo5QWn4CunTGuVVcD_f5Zzr3eQY060",
  authDomain: "offer-generator-57aea.firebaseapp.com",
  projectId: "offer-generator-57aea",
  storageBucket: "offer-generator-57aea.appspot.com",
  messagingSenderId: "925289056145",
  appId: "1:925289056145:web:b1b5e3902756c15cdf3c30",
  measurementId: "G-QSSEYJL003"
};

// 3) INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 4) AUTHENTICATION INSTANCE
export const auth = getAuth(app);

// 5) FIRESTORE INSTANCE
export const db = getFirestore(app);

// 6) STORAGE INSTANCE
export const storage = getStorage(app);

// 7) OAUTH PROVIDERS
//
// Google provider (for “Sign in with Google”)
export const googleProvider = new GoogleAuthProvider();

// Apple provider (for “Sign in with Apple”)
// NOTE: You must have enabled “Apple” in Firebase Console → Authentication → Sign‐in method,
// and configured your Apple Service ID / Key / Redirect URI in your Apple Developer account.
export const appleProvider = new OAuthProvider("apple.com");

// (Optional) You can also export analytics if you plan to use it elsewhere
export { analytics };
