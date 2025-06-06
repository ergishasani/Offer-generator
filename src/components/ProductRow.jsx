import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ProductRow({
  item,
  index,
  productCatalog,
  useNetPrices,
  totalDiscount,
  onChange,
  onRemove,
  computeLineTotalNet,
  computeLineTotalGross,
}) {
  const navigate = useNavigate();
  // Construct a “returnTo” URL so that when the user finishes editing,
  // we can send them back to the invoice page they came from.
  const returnTo = window.location.pathname + window.location.search;

  // Local unit & VAT options (since parent no longer passes them)
  const unitOptions = [
    { value: "Stk", label: "Stk" },
    { value: "m2", label: "m²" },
    { value: "m", label: "m" },
    { value: "lfdm", label: "lfdm" },
  ];
  const vatOptions = [
    { value: 19, label: "19%" },
    { value: 7, label: "7%" },
    { value: 0, label: "0%" },
  ];

  // Compute raw net & gross for this item (including any fillings)
  const rawLineNet = computeLineTotalNet(item);
  const rawLineGross = computeLineTotalGross(item);
  const lineAfterGlobalDisc = useNetPrices
    ? rawLineNet * (1 - (parseFloat(totalDiscount) || 0) / 100)
    : rawLineGross * (1 - (parseFloat(totalDiscount) || 0) / 100);

  // State for expanding “accessories + fillings”
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="products-table-row">
        <div className="col col-index">{index + 1}.</div>

        {/* Expand/collapse arrow on the left */}
        <div className="col col-product">
          <button
            type="button"
            className="icon-button expand-btn"
            onClick={() => setExpanded(prev => !prev)}
            title={expanded ? "Hide add-ons" : "Show add-ons"}
          >
            {expanded ? "▼" : "▶︎"}
          </button>

          <select
            className="select full-width"
            value={item.productId}
            onChange={e => onChange(item.id, "productId", e.target.value)}
          >
            <option value="">-- Select product --</option>
            {productCatalog.map(p => (
              <option key={p.id} value={p.id}>
                {p.data.productName || "(no name)"}
              </option>
            ))}
          </select>
        </div>

        <div className="col col-qty">
          <input
            type="number"
            min="0"
            step="1"
            className="input small-input"
            value={item.quantity}
            onChange={e => onChange(item.id, "quantity", e.target.value)}
          />
        </div>

        <div className="col col-unit">
          <select
            className="select small-select"
            value={item.unit}
            onChange={e => onChange(item.id, "unit", e.target.value)}
          >
            {unitOptions.map(u => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        {/* “Price (net)” now shows rawLineNet (including all fillings) */}
        <div className="col col-price">{rawLineNet.toFixed(2)} €</div>

        <div className="col col-vat">
          <select
            className="select small-select"
            value={item.vat}
            onChange={e => onChange(item.id, "vat", e.target.value)}
          >
            {vatOptions.map(v => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col col-discount">
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            className="input small-input"
            value={item.discount}
            onChange={e => onChange(item.id, "discount", e.target.value)}
          />{" "}
          %
        </div>

        <div className="col col-amount">
          {lineAfterGlobalDisc.toFixed(2)} €
        </div>

        <div className="col col-action">
          {/* Delete icon */}
          <button
            type="button"
            className="icon-button delete-btn"
            onClick={() => onRemove(item.id)}
            title="Delete line"
          >
            🗑️
          </button>
          {/* Edit icon: navigates to /products/{item.productId}/edit */}
          {item.productId && (
            <button
              type="button"
              className="icon-button edit-btn"
              onClick={() =>
                navigate(
                  `/products/${item.productId}/edit`,
                  { state: { returnTo } }
                )
              }
              title="Edit product details"
            >
              ✏️
            </button>
          )}
        </div>
      </div>

      {/* Expanded panel showing accessories + fillings */}
      {expanded && (
        <div className="addons-panel">
          {Array.isArray(item.accessories) && item.accessories.length > 0 && (
            <div className="addons-section">
              <strong>Accessories:</strong>
              <ul>
                {item.accessories.map((acc, i) => (
                  <li key={i}>
                    {(acc.code || acc.description) + " × " + (acc.qty || 0)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {Array.isArray(item.fillings) && item.fillings.length > 0 && (
            <div className="addons-section">
              <strong>Fillings:</strong>
              <ul>
                {item.fillings.map((f, i) => {
                  const fPrice = parseFloat(f.price) || 0;
                  const fDisc = parseFloat(f.discountPercent) || 0;
                  const fNet = fPrice * (1 - fDisc / 100);
                  return (
                    <li key={i}>
                      {`${f.id} – ${f.spec} (${f.dimensions}): ${fNet.toFixed(2)} €`}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {(!Array.isArray(item.accessories) || item.accessories.length === 0) &&
            (!Array.isArray(item.fillings) || item.fillings.length === 0) && (
              <div className="addons-empty">No add-ons for this item.</div>
            )}
        </div>
      )}
    </>
  );
}
