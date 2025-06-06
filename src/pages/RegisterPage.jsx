// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "../assets/styles/pages/_registerPage.scss";

export default function RegisterPage() {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper: Validate email format (basic)
  const isValidEmail = (email) => {
    // Very simple regex for demonstration; adjust as needed
    return /\S+@\S+\.\S+/.test(email);
  };

  // Main submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1) Basic client‐side validation
    if (!email.trim() || !password || !passwordConfirm) {
      return setError("Please fill in all fields.");
    }
    if (!isValidEmail(email)) {
      return setError("Please enter a valid email address.");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (password !== passwordConfirm) {
      return setError("Passwords do not match.");
    }

    try {
      setLoading(true);
      // 2) Attempt registration
      await registerWithEmail(email, password);
      // 3) Redirect on success
      navigate("/");
    } catch (err) {
      // 4) Show any Firebase error message
      console.error("Registration error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Optional: “Continue with Google” handler
  const handleGoogleSignIn = async () => {
    setError("");
    try {
      setLoading(true);
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      console.error("Google Sign‐In error:", err);
      setError(err.message);
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
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="passwordConfirm">Confirm Password</label>
            <input
              id="passwordConfirm"
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
            src="/google‐icon.svg"
            alt="Google icon"
            className="google‐icon"
          />
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        <p className="login‐link">
          Already have an account?{" "}
          <Link to="/login">Log in here</Link>
        </p>
      </div>
    </div>
  );
}
