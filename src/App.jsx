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

        {/* 
          If no ID is passed, user creates a new offer (empty form).
          If :offerId is present, OfferFormPage should fetch that draft and prefill. 
        */}
        <Route path="/offer" element={<OfferFormPage />} />
        <Route path="/offer/:offerId" element={<OfferFormPage />} />

        {/* Admin listing of past offers/drafts */}
        <Route path="/admin/offers" element={<AdminOffersPage />} />

        {/* Catch-all: redirect back to /offer */}
        <Route path="*" element={<Navigate to="/offer" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
