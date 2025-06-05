// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { auth, googleProvider, appleProvider } from "../services/firebase";

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

  // 4) Sign in with Google (Redirect flow)
  function loginWithGoogle() {
    return signInWithRedirect(auth, googleProvider);
  }

  // 5) Sign in with Apple (Redirect flow)
  function loginWithApple() {
    return signInWithRedirect(auth, appleProvider);
  }

  // 6) Sign out
  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    loginWithApple,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
