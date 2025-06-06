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
      navigate("/login"); // ← send the user to /login after logging out
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="navbar">
      {/* Left side: App name/logo */}
      <div className="navbar-left">
        <Link to="/offers" className="navbar-logo">
          MyOffersApp
        </Link>
      </div>

      {/* Center: Only show navigation links if user is logged in */}
      {currentUser && (
        <div className="navbar-center">
          <ul className="nav-links">
            <li>
              <Link to="/offers" className="nav-link">
                Offers
              </Link>
            </li>
            <li>
              <Link to="/offers/new" className="nav-link">
                New Offer
              </Link>
            </li>
            <li>
              <Link to="/products" className="nav-link">
                Products
              </Link>
            </li>
            <li>
              <Link to="/catalog" className="nav-link">
                Catalog
              </Link>
            </li>
            <li>
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
            </li>
          </ul>
        </div>
      )}

      {/* Right side: either show email+logout or a “Log in” button */}
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
