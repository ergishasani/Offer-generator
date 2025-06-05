// src/components/SalespersonDetails.jsx
import React from "react";
import "../assets/styles/components/_salespersonDetails.scss";

const SalespersonDetails = ({ values, onChange }) => {
  return (
    <section className="salesperson-details">
      <h2>Salesperson Contact</h2>

      <label>
        Name:
        <input
          type="text"
          value={values.salespersonName}
          onChange={(e) => onChange("salespersonName", e.target.value)}
        />
      </label>

      <label>
        Email:
        <input
          type="email"
          value={values.salespersonEmail}
          onChange={(e) => onChange("salespersonEmail", e.target.value)}
        />
      </label>

      <label>
        Phone:
        <input
          type="text"
          value={values.salespersonPhone}
          onChange={(e) => onChange("salespersonPhone", e.target.value)}
        />
      </label>
    </section>
  );
};

export default SalespersonDetails;
