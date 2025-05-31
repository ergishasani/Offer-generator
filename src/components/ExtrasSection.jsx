// src/components/ExtrasSection.jsx
import React from "react";
import "../assets/styles/components/_extrasSection.scss";

const ExtrasSection = ({ deliveryFee, installationFee, discount, onChange }) => {
  return (
    <section className="extras-section">
      <h2>Extras & Discounts</h2>

      <label>
        Delivery Fee:
        <input
          type="number"
          value={deliveryFee}
          min="0"
          onChange={e => onChange("deliveryFee", Number(e.target.value))}
        />
      </label>

      <label>
        Installation Fee:
        <input
          type="number"
          value={installationFee}
          min="0"
          onChange={e => onChange("installationFee", Number(e.target.value))}
        />
      </label>

      <label>
        Discount:
        <input
          type="number"
          value={discount}
          min="0"
          onChange={e => onChange("discount", Number(e.target.value))}
        />
      </label>
    </section>
  );
};

export default ExtrasSection;
