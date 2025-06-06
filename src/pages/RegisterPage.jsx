// src/pages/RegisterPage.jsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "../assets/styles/pages/_registerPage.scss";

export default function RegisterPage() {
  const { currentUser, registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to home (or offers page)
  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  // Basic email validation (very simple)
  const isValidEmail = (str) => /\S+@\S+\.\S+/.test(str);

  // Handle registration form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1) Basic client‐side validation
    if (!email.trim() || !password || !passwordConfirm) {
      return setError("Please fill in all fields.");
    }
    if (!isValidEmail(email.trim())) {
      return setError("Please enter a valid email address.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (password !== passwordConfirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      // 2) Attempt registration
      await registerWithEmail(email.trim(), password);
      // onAuthStateChanged → currentUser will be set → useEffect will redirect
    } catch (err) {
      console.error("Registration error:", err);
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists.");
          break;
        case "auth/weak-password":
          setError("Password is too weak.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        default:
          setError("Failed to create an account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Optional: “Continue with Google” in the register form
  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      // onAuthStateChanged → currentUser → redirect
    } catch (err) {
      console.error("Google Sign-In error:", err);
      if (err.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized for Google sign-in. Please add your Netlify domain in Firebase Console.");
      } else {
        setError("Failed to sign in with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-container">
      <div className="register-card">
        <h2 className="register-title">Create Your Account</h2>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="field-group">
            <label htmlFor="register-email">Email Address</label>
            <input
              id="register-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              placeholder="Enter a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="register-passwordConfirm">Confirm Password</label>
            <input
              id="register-passwordConfirm"
              type="password"
              placeholder="Repeat your password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? "Registering…" : "Register"}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <button
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <img
            src="/google-icon.svg"
            alt="Google icon"
            className="google-icon"
          />
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        <p className="login-link">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </div>
    </div>
  );
}
