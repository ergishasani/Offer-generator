import React from "react";

const ProductRow = ({
  item,
  index,
  productList,
  unitOptions,
  vatOptions,
  useNetPrices,
  totalDiscount,
  onChange,
  onRemove,
  computeLineTotalNet,
  computeLineTotalGross,
}) => {
  const rawLineNet = computeLineTotalNet(item);
  const rawLineGross = computeLineTotalGross(item);
  const lineAfterGlobalDisc =
    (useNetPrices ? rawLineNet : rawLineGross) *
    (1 - (parseFloat(totalDiscount) || 0) / 100);

  return (
    <div className="products-table-row">
      <div className="col col-index">{index + 1}.</div>
      <div className="col col-product">
        <select
          className="select full-width"
          value={item.productName}
          onChange={(e) => onChange(item.id, "productName", e.target.value)}
        >
          <option value="">-- Select product --</option>
          {productList.map((prodName) => (
            <option key={prodName} value={prodName}>
              {prodName}
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
          {unitOptions.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
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
        />{' '}
        €
      </div>
      <div className="col col-vat">
        <select
          className="select small-select"
          value={item.vat}
          onChange={(e) => onChange(item.id, "vat", e.target.value)}
        >
          {vatOptions.map((v) => (
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
          onChange={(e) => onChange(item.id, "discount", e.target.value)}
        />{' '}
        %
      </div>
      <div className="col col-amount">{lineAfterGlobalDisc.toFixed(2)} €</div>
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
    </div>
  );
};

export default ProductRow;

