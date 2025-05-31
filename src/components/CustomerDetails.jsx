// src/components/CustomerDetails.jsx
import React from "react";
import "../assets/styles/components/_customerDetails.scss";

const CustomerDetails = ({ values, onChange }) => {
  return (
    <section className="customer-details">
      <h2>Customer Details</h2>

      <label>
        Name:
        <input
          type="text"
          value={values.customerName}
          onChange={e => onChange("customerName", e.target.value)}
        />
      </label>

      <label>
        Contact Info:
        <input
          type="text"
          value={values.contactInfo}
          onChange={e => onChange("contactInfo", e.target.value)}
        />
      </label>

      <label>
        Delivery Address:
        <input
          type="text"
          value={values.deliveryAddress}
          onChange={e => onChange("deliveryAddress", e.target.value)}
        />
      </label>
    </section>
  );
};

export default CustomerDetails;
