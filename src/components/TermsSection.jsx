// src/components/TermsSection.jsx
import React from "react";
import "../assets/styles/components/_termsSection.scss";

const TermsSection = ({ expirationDate, notes, onChange }) => {
  return (
    <section className="terms-section">
      <h2>Terms & Notes</h2>

      <label>
        Offer Expiration Date:
        <input
          type="date"
          value={expirationDate}
          onChange={e => onChange("expirationDate", e.target.value)}
        />
      </label>

      <label>
        Additional Notes:
        <textarea
          rows="3"
          value={notes}
          onChange={e => onChange("notes", e.target.value)}
          placeholder="Any special terms, payment instructions, etc."
        />
      </label>
    </section>
  );
};

export default TermsSection;
