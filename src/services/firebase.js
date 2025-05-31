// src/services/firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Auth, Firestore, and Storage instances for use elsewhere
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// (Optional) You can also export analytics if you plan to use it:
export { analytics };
