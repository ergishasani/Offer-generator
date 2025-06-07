// src/components/RequireAdmin.jsx
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

const ADMIN_UID = "YOUR_ADMIN_UID";

export default function RequireAdmin({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return null;            // or a spinner
  if (currentUser.uid !== ADMIN_UID) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
