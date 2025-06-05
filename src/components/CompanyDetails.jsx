// src/components/CompanyDetails.jsx
import React from "react";
import "../assets/styles/components/_companyDetails.scss";

const CompanyDetails = ({ values, onChange }) => {
  return (
    <section className="company-details">
      <h2>Company Details</h2>

      <label>
        Company Name:
        <input
          type="text"
          value={values.companyName}
          onChange={(e) => onChange("companyName", e.target.value)}
        />
      </label>

      <label>
        VAT ID:
        <input
          type="text"
          value={values.companyVAT}
          onChange={(e) => onChange("companyVAT", e.target.value)}
        />
      </label>

      <label>
        Company Address:
        <textarea
          rows="2"
          value={values.companyAddress}
          onChange={(e) => onChange("companyAddress", e.target.value)}
          placeholder="Street, ZIP, City, Country"
        />
      </label>

      <label>
        Company Email:
        <input
          type="email"
          value={values.companyEmail}
          onChange={(e) => onChange("companyEmail", e.target.value)}
        />
      </label>

      <label>
        Company Contact Person:
        <input
          type="text"
          value={values.companyContactName}
          onChange={(e) => onChange("companyContactName", e.target.value)}
        />
      </label>

      <label>
        Company Phone:
        <input
          type="text"
          value={values.companyPhone}
          onChange={(e) => onChange("companyPhone", e.target.value)}
        />
      </label>

      <label>
        Bank Name:
        <input
          type="text"
          value={values.bankName}
          onChange={(e) => onChange("bankName", e.target.value)}
        />
      </label>

      <label>
        Bank IBAN:
        <input
          type="text"
          value={values.bankIBAN}
          onChange={(e) => onChange("bankIBAN", e.target.value)}
        />
      </label>
    </section>
  );
};

export default CompanyDetails;
