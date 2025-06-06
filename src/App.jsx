// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import NavBar from "./components/NavBar";

// --- IMPORT OUR NEW PAGES ---
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";

import ProductsPage from "./pages/ProductsPage";
import ProductEditPage from "./pages/ProductEditPage";

import OfferFormPage from "./pages/OfferFormPage";
import ProductRowEditPage from "./pages/ProductEditPage"; 
import ProductCatalogEditPage from "./pages/CatalogPage";
import Offers from "./pages/OffersPage";
// If you have a separate “ProductRowEditPage” (for editing within an Offer),
// adjust accordingly—here we only show the “catalog” version.

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />

        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />


          <Route path="/offers" element={<Offers />} />

          {/* Profile */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* Product Catalog */}
          <Route path="/products" element={<ProductsPage />} />
          <Route
            path="/products/:productId/edit"
            element={<ProductEditPage />}
          />

          <Route path="/catalog" element={<ProductCatalogEditPage />} />

          {/* Offer & Product‐in‐Offer editing */}
          <Route path="/offers/:offerId" element={<OfferFormPage />} />
          {/* If you do have a /offers/:offerId/products/:itemIndex/edit route,
              you can add something like this: */}
          {/* <Route path="/offers/:offerId/products/:itemIndex/edit" element={<ProductRowEditPage />} /> */}

          {/* Catch‐all → redirect to /products or /offers/new as needed */}
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
