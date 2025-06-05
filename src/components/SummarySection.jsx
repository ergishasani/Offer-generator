// src/components/SummarySection.jsx
import React from "react";
import "../assets/styles/components/_summarySection.scss";

const SummarySection = ({
  items,
  deliveryFee,
  installationFee,
  calculateTotals,
}) => {
  // If deliveryFee or installationFee is undefined, default to 0
  const { items: computedItems, subTotal, vat, total } = calculateTotals({
    items,
    deliveryFee: deliveryFee ?? 0,
    installationFee: installationFee ?? 0,
  });

  return (
    <section className="summary-section">
      <h2>Order Summary</h2>

      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th>W × H (mm)</th>
            <th>Area (m²)</th>
            <th>Qty</th>
            <th>Unit Price (€)</th>
            <th>Line Total (€)</th>
          </tr>
        </thead>
        <tbody>
          {computedItems.map((item, idx) => (
            <tr key={idx}>
              <td>{item.type ?? "-"}</td>
              <td>{item.description ?? "-"}</td>
              <td>
                {(item.width ?? 0).toString()} × {(item.height ?? 0).toString()}
              </td>
              <td>{((item.areaM2 ?? 0).toFixed(3)).toString()}</td>
              <td>{(item.quantity ?? 0).toString()}</td>
              <td>{((item.unitPrice ?? 0).toFixed(2)).toString()}</td>
              <td>{((item.lineTotal ?? 0).toFixed(2)).toString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="totals">
        <div>
          <span>Subtotal:</span>
          <span>{(subTotal ?? 0).toFixed(2)} €</span>
        </div>
        <div>
          <span>VAT (19%):</span>
          <span>{(vat ?? 0).toFixed(2)} €</span>
        </div>
        <div>
          <span>Delivery Fee:</span>
          <span>{((deliveryFee ?? 0).toFixed(2))} €</span>
        </div>
        <div>
          <span>Installation Fee:</span>
          <span>{((installationFee ?? 0).toFixed(2))} €</span>
        </div>
        <hr />
        <div className="grand-total">
          <span>Grand Total:</span>
          <span>{((total ?? 0).toFixed(2))} €</span>
        </div>
      </div>
    </section>
  );
};

export default SummarySection;
