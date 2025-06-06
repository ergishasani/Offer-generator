// src/components/NavBar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import "../assets/styles/components/_navBar.scss";

export default function NavBar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login"); // <— now navigates to the real /login route
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="navbar">
      <Link to="/offers/new" className="navbar-logo">
        MyOffersApp
      </Link>

      <div className="navbar-right">
        {currentUser ? (
          <>
            <span className="navbar-user">Hi, {currentUser.email}</span>
            <button onClick={handleLogout} className="btn-logout">
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-login">
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
