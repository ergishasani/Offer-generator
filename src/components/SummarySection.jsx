// src/components/SummarySection.jsx
import React from "react";
import "../assets/styles/components/_summarySection.scss";

const SummarySection = ({ items, deliveryFee, installationFee, discount, calculateTotals }) => {
  // We re‐compute lineTotals, subTotal, vat, total here:
  const { items: computedItems, subTotal, vat, total } = calculateTotals({
    items,
    deliveryFee,
    installationFee,
    discount,
  });

  return (
    <section className="summary-section">
      <h2>Summary</h2>

      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {computedItems.map((item, idx) => (
            <tr key={idx}>
              <td>{item.type}</td>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>{item.unitPrice.toFixed(2)} €</td>
              <td>{item.lineTotal.toFixed(2)} €</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="totals">
        <div>Subtotal: {subTotal.toFixed(2)} €</div>
        <div>VAT (19%): {vat.toFixed(2)} €</div>
        <div>Delivery: {deliveryFee.toFixed(2)} €</div>
        <div>Installation: {installationFee.toFixed(2)} €</div>
        <div>Discount: −{discount.toFixed(2)} €</div>
        <hr />
        <div className="grand-total">Total: {total.toFixed(2)} €</div>
      </div>
    </section>
  );
};

export default SummarySection;
