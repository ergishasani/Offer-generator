// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/AuthContext";
import NavBar from "./components/NavBar";

// --- IMPORT YOUR PAGES ---
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

import ProductsPage from "./pages/ProductsPage";
import ProductEditPage from "./pages/ProductEditPage";

import OfferFormPage from "./pages/OfferFormPage";
import ProductCatalogEditPage from "./pages/CatalogPage";
import OffersPage from "./pages/OffersPage";

// --- IMPORT ADMIN PAGES ---
import AdminPanel from "./pages/AdminPanel";
import AdminOffers from "./pages/AdminOffers";
import AdminUsers from "./pages/AdminUsers";
// ← NEW import:
import AdminCatalogEditor from "./pages/AdminCatalogEditor";

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser?.admin ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* always show nav */}
        <NavBar />

        <Routes>
          {/* ───────────── PUBLIC ───────────── */}
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/products" replace />} />

          {/* ─────────── PRIVATE (requires auth) ─────────── */}
          <Route
            path="/offers"
            element={
              <PrivateRoute>
                <OffersPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/offers/:offerId"
            element={
              <PrivateRoute>
                <OfferFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/catalog"
            element={
              <PrivateRoute>
                <ProductCatalogEditPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/products"
            element={
              <PrivateRoute>
                <ProductsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/products/:productId/edit"
            element={
              <PrivateRoute>
                <ProductEditPage />
              </PrivateRoute>
            }
          />

          {/* ─────────── ADMIN (requires admin claim) ─────────── */}
          {/** Consume useAuth() *inside* AuthProvider **/
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
          }
          {/** Manage Offers */}
          <Route
            path="/admin/offers"
            element={
              <AdminRoute>
                <AdminOffers />
              </AdminRoute>
            }
          />
          {/** Manage Users */}
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          {/** ─── NEW: Global Catalog Editor for Admins ─── */}
          <Route
            path="/admin/catalog"
            element={
              <AdminRoute>
                <AdminCatalogEditor />
              </AdminRoute>
            }
          />

          {/* catch‐all */}
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
