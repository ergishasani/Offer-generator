// src/components/CustomerDetails.jsx
import React from "react";
import "../assets/styles/components/_customerDetails.scss";

const CustomerDetails = ({ values, onChange }) => {
  return (
    <section className="customer-details">
      <h2>Customer Information</h2>

      <label>
        Customer Name:
        <input
          type="text"
          value={values.customerName}
          onChange={(e) => onChange("customerName", e.target.value)}
        />
      </label>

      <label>
        Contact (Email / Phone):
        <input
          type="text"
          value={values.customerContact}
          onChange={(e) => onChange("customerContact", e.target.value)}
        />
      </label>

      <label>
        Delivery Address:
        <textarea
          rows="2"
          value={values.customerAddress}
          onChange={(e) => onChange("customerAddress", e.target.value)}
          placeholder="Street, ZIP, City, Country"
        />
      </label>
    </section>
  );
};

export default CustomerDetails;
