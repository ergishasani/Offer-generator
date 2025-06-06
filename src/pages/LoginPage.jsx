// src/pages/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import "../assets/styles/pages/_loginPage.scss";

export default function LoginPage() {
  const { currentUser, loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // If already logged in, go straight to /offers/new
  useEffect(() => {
    if (currentUser) {
      navigate("/offers/new");
    }
  }, [currentUser, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginWithEmail(email, password);
      // onAuthStateChanged → currentUser updates → useEffect redirects to /offers/new
    } catch (err) {
      setError("Failed to sign in with email/password.");
      console.error(err);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await loginWithGoogle();
      // signInWithPopup auto‐resolves to a user credential. onAuthStateChanged → redirect.
    } catch (err) {
      setError("Failed to sign in with Google.");
      console.error(err);
    }
  };

  return (
    <div className="login-page">
      <h2>Sign In</h2>

      {error && <p className="error-text">{error}</p>}

      <form onSubmit={handleEmailLogin} className="login-form">
        <div className="field-group">
          <label className="label">Email</label>
          <input
            type="email"
            className="input full-width"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field-group">
          <label className="label">Password</label>
          <input
            type="password"
            className="input full-width"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary">
          Sign in with Email
        </button>
      </form>

      <hr />

      <button onClick={handleGoogleLogin} className="btn-primary google-btn">
        Sign in with Google
      </button>
    </div>
  );
}
