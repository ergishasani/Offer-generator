// src/contexts/AuthContext.jsx

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { auth, googleProvider } from "../services/firebase";

const AuthContext = createContext();

/**
 * Custom hook to grab the AuthContext value.
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider wraps your entire app (or at least 
 * the portion that needs authentication).
 * It keeps track of currentUser and exposes:
 *   - registerWithEmail(email, password)
 *   - loginWithEmail(email, password)
 *   - loginWithGoogle()
 *   - logout()
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Register a new account via email & password.
   * Returns a Promise.
   */
  function registerWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  /**
   * Log in with email & password.
   * Returns a Promise.
   */
  function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  /**
   * Log in with Google (popup).
   * Returns a Promise.
   */
  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  /**
   * Log out the current user.
   * Returns a Promise.
   */
  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Don’t render children until we know auth state */}
      {!loading && children}
    </AuthContext.Provider>
  );
}
