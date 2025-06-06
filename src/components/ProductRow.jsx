// src/components/ProductRow.jsx
import React from "react";

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
  // Compute raw net/gross, then apply global discount:
  const rawLineNet = computeLineTotalNet(item);
  const rawLineGross = computeLineTotalGross(item);
  const lineAfterGlobalDisc =
    (useNetPrices ? rawLineNet : rawLineGross) *
    (1 - (parseFloat(totalDiscount) || 0) / 100);

  // Handler for when the user picks a new product from the catalog dropdown
  const handleProductSelect = (e) => {
    const chosenId = e.target.value;
    onChange(item.id, "productId", chosenId);
  };

  return (
    <div className="products-table-row">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* Basic columns: #, Product dropdown, Qty, Unit, Price, VAT, Discount, Amount, Delete */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="col col-index">{index + 1}.</div>

      <div className="col col-product">
        <select
          className="select full-width"
          value={item.productId}
          onChange={handleProductSelect}
        >
          <option value="">-- Select product --</option>
          {productCatalog.map((p) => (
            <option key={p.id} value={p.id}>
              {p.data.productName}
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
          onChange={(e) => onChange(item.id, "quantity", e.target.value)}
        />
      </div>

      <div className="col col-unit">
        <select
          className="select small-select"
          value={item.unit}
          onChange={(e) => onChange(item.id, "unit", e.target.value)}
        >
          <option value="Stk">Stk</option>
          <option value="m2">m²</option>
          <option value="m">m</option>
          <option value="lfdm">lfdm</option>
        </select>
      </div>

      <div className="col col-price">
        <input
          type="number"
          min="0"
          step="0.01"
          className="input small-input"
          value={item.unitPrice}
          onChange={(e) => onChange(item.id, "unitPrice", e.target.value)}
        />{" "}
        €
      </div>

      <div className="col col-vat">
        <select
          className="select small-select"
          value={item.vat}
          onChange={(e) => onChange(item.id, "vat", e.target.value)}
        >
          <option value={19}>19%</option>
          <option value={7}>7%</option>
          <option value={0}>0%</option>
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
          onChange={(e) => onChange(item.id, "discount", e.target.value)}
        />{" "}
        %
      </div>

      <div className="col col-amount">
        {lineAfterGlobalDisc.toFixed(2)} €
      </div>

      <div className="col col-action">
        <button
          type="button"
          className="icon-button delete-btn"
          onClick={() => onRemove(item.id)}
          title="Delete line"
        >
          🗑️
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Note: We do NOT render all of the “Fenster” fields here.   */}
      {/* They have already been copied into `item` via handleItemChange. */}
      {/* To verify, you could console.log(item.system), etc.         */}
      {/* If you want to show them for reference, you could display a “View Details” toggle. */}
      {/* ─────────────────────────────────────────────────────────── */}
    </div>
  );
}
