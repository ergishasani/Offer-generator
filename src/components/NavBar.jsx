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
      navigate("/signin");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <nav className="nav-bar">
      <div className="nav-left">
        <Link to="/offers/new" className="nav-brand">
          Offer Generator
        </Link>
        <Link to="/offers/new" className="nav-link">
          New Offer
        </Link>
        <Link to="/profile" className="nav-link">
          Profile
        </Link>
      </div>
      <div className="nav-right">
        {currentUser && (
          <span className="user-email">{currentUser.email}</span>
        )}
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </nav>
  );
}
