// src/contexts/AuthContext.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  getIdTokenResult,
} from "firebase/auth";

import { auth, googleProvider } from "../services/firebase";

const AuthContext = createContext();

/** 
 * Custom hook to grab the AuthContext value.
 * Will throw if used outside of <AuthProvider>
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

/**
 * Wrap your app in <AuthProvider> so you can:
 *  - access currentUser (with .admin flag)
 *  - call registerWithEmail, loginWithEmail, loginWithGoogle, logout
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // force-refresh token to get latest custom claims
        const tokenResult = await getIdTokenResult(user, true);
        // attach an `admin` boolean flag
        user.admin = !!tokenResult.claims.admin;
      }
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- auth action helpers ---
  function registerWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,        // includes .admin flag
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* only render once we've determined auth state */}
      {!loading && children}
    </AuthContext.Provider>
  );
}
