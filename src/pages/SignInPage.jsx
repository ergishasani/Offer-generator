// src/pages/SignInPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "../assets/styles/pages/_signInPage.scss";

export default function SignInPage() {
  const {
    currentUser,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    loginWithApple,
  } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Navigate to the profile page once a user is authenticated
  useEffect(() => {
    if (currentUser) {
      navigate("/profile");
    }
  }, [currentUser, navigate]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      // After successful email auth, go to profile
      navigate("/profile");
    } catch (err) {
      console.error("Email auth error", err);
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await loginWithGoogle();
      navigate("/profile");
    } catch (err) {
      console.error("Google login error", err);
      setError(err.message);
    }
  };

  const handleApple = async () => {
    setError("");
    try {
      await loginWithApple();
      navigate("/profile");
    } catch (err) {
      console.error("Apple login error", err);
      setError(err.message);
    }
  };

  return (
    <div className="sign-in-page">
      <h2>{isRegister ? "Register" : "Sign In"}</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleEmailSubmit} className="email-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button type="submit" className="btn-primary">
          {isRegister ? "Create Account" : "Sign In"}
        </button>

        <p className="toggle-text">
          {isRegister
            ? "Already have an account?"
            : "New here?"}{" "}
          <button
            type="button"
            className="toggle-btn"
            onClick={() => setIsRegister((prev) => !prev)}
          >
            {isRegister ? "Sign In" : "Register"}
          </button>
        </p>
      </form>

      <hr className="divider" />

      <div className="oauth-buttons">
        <button onClick={handleGoogle} className="btn-oauth google">
          Continue with Google
        </button>
        <button onClick={handleApple} className="btn-oauth apple">
          Continue with Apple
        </button>
      </div>
    </div>
  );
}
