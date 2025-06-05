// src/components/ExtrasSection.jsx
import React from "react";
import "../assets/styles/components/_extrasSection.scss";

const ExtrasSection = ({
  deliveryFee,
  installationFee,
  onChange,
}) => {
  return (
    <section className="extras-section">
      <h2>Additional Fees</h2>

      <label>
        Delivery Fee (€):
        <input
          type="number"
          min="0"
          step="0.01"
          value={deliveryFee}
          onChange={(e) => onChange("deliveryFee", Number(e.target.value))}
        />
      </label>

      <label>
        Installation Fee (€):
        <input
          type="number"
          min="0"
          step="0.01"
          value={installationFee}
          onChange={(e) =>
            onChange("installationFee", Number(e.target.value))
          }
        />
      </label>
    </section>
  );
};

export default ExtrasSection;
