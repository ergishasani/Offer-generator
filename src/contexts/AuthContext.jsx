// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,         // ← make sure this is imported
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { auth, googleProvider /*, appleProvider */ } from "../services/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1) Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2) Email/Password Registration
  function registerWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // 3) Email/Password Sign‐In
  function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // 4) Sign in with Google (switch to popup)
  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  // 5) (Optional) Sign in with Apple, if you have appleProvider configured:
  // function loginWithApple() {
  //   return signInWithPopup(auth, appleProvider);
  // }

  // 6) Sign out
  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    // loginWithApple,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
