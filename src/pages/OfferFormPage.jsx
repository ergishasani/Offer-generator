// src/pages/OfferFormPage.jsx
import React from "react";
import "../assets/styles/pages/_offerFormPage.scss";
import CustomerDetails from "../components/CustomerDetails";

const OfferFormPage = () => {
  return (
    <div className="offer-form-page">
      <h1>Create New Offer</h1>
      <CustomerDetails />
    </div>
  );
};

export default OfferFormPage;
