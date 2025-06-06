// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider /*, appleProvider */ } from "../services/firebase";

const AuthContext = createContext();

/**
 * Custom hook for consuming AuthContext.
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider wraps around your app (or the part that needs auth).
 * It provides:
 *   - currentUser
 *   - registerWithEmail
 *   - loginWithEmail
 *   - loginWithGoogle
 *   - logout
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1) Listen for Firebase Auth state changes (login/logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2) Email & Password registration
  function registerWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // 3) Email & Password login
  function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // 4) Google popup login
  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  // 5) (Optional) Apple popup login, if configured
  // function loginWithApple() {
  //   return signInWithPopup(auth, appleProvider);
  // }

  // 6) Logout
  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    // loginWithApple,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Do not render children until we know if a user is logged in */}
      {!loading && children}
    </AuthContext.Provider>
  );
}
