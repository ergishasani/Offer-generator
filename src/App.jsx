// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
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

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  // If not logged in, redirect to /login
  return currentUser ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* The NavBar will always be rendered; it can read currentUser/logout via useAuth() */}
        <NavBar />

        <Routes>
          {/*─────────────────────────────────────*/}
          {/* 1) PUBLIC ROUTES                     */}
          {/*─────────────────────────────────────*/}

          {/* Login and Registration */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* If the user goes to the root ("/"), redirect to /products (or /offers). */}
          <Route path="/" element={<Navigate to="/products" replace />} />

          {/*─────────────────────────────────────*/}
          {/* 2) PRIVATE ROUTES (require login)    */}
          {/*─────────────────────────────────────*/}

          {/* Offer Listing + Editing */}
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

          {/* Profile */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />

          {/* Product Catalog */}
          <Route
            path="/catalog"
            element={
              <PrivateRoute>
                <ProductCatalogEditPage />
              </PrivateRoute>
            }
          />

          {/* Products List & Edit */}
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

          {/* Catch‐all → redirect to /products */}
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
