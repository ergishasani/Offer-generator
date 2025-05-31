// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import OfferFormPage from "./pages/OfferFormPage";
import AdminOffersPage from "./pages/AdminOffersPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default → redirect to /offer */}
        <Route path="/" element={<Navigate to="/offer" replace />} />

        {/* Offer form for creating a new offer */}
        <Route path="/offer" element={<OfferFormPage />} />

        {/* (Optional) Admin listing of past offers */}
        <Route path="/admin/offers" element={<AdminOffersPage />} />

        {/* Catch-all: redirect back to /offer */}
        <Route path="*" element={<Navigate to="/offer" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
