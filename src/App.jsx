// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import SignInPage from "./pages/SignInPage";
import ProfilePage from "./pages/ProfilePage";
import OfferFormPage from "./pages/OfferFormPage";

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/signin" />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/signin" element={<SignInPage />} />

          {/* Private */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/offers/:offerId?"
            element={
              <PrivateRoute>
                <OfferFormPage />
              </PrivateRoute>
            }
          />

          {/* Catch‐all redirects */}
          <Route
            path="*"
            element={
              <RequireRedirect />
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Redirect helper: if auth, → /offers/new, else → /signin
function RequireRedirect() {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/offers/new" /> : <Navigate to="/signin" />;
}
// This component handles the redirection logic based on authentication state