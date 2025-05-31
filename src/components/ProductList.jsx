// src/components/ProductList.jsx
import React from "react";
import "../assets/styles/components/_productList.scss";

const ProductList = ({ items, addItem, removeItem, updateItemField }) => {
  return (
    <section className="product-list">
      <h2>Product List</h2>
      <button type="button" onClick={addItem}>
        + Add Item
      </button>

      {items.map((item, idx) => (
        <div className="product-row" key={idx}>
          <select
            value={item.type}
            onChange={e => updateItemField(idx, "type", e.target.value)}
          >
            <option value="">Select Type</option>
            <option value="window">Window</option>
            <option value="door">Door</option>
            {/* …other types */}
          </select>

          <input
            type="text"
            placeholder="Description"
            value={item.description}
            onChange={e => updateItemField(idx, "description", e.target.value)}
          />

          <input
            type="number"
            placeholder="Width (mm)"
            value={item.width}
            onChange={e => updateItemField(idx, "width", Number(e.target.value))}
          />

          <input
            type="number"
            placeholder="Height (mm)"
            value={item.height}
            onChange={e => updateItemField(idx, "height", Number(e.target.value))}
          />

          <select
            value={item.color}
            onChange={e => updateItemField(idx, "color", e.target.value)}
          >
            <option value="">Select Color</option>
            <option value="white">White</option>
            <option value="brown">Brown</option>
            {/* … */}
          </select>

          <input
            type="number"
            placeholder="Quantity"
            min="1"
            value={item.quantity}
            onChange={e => updateItemField(idx, "quantity", Number(e.target.value))}
          />

          <input
            type="number"
            placeholder="Unit Price"
            min="0"
            value={item.unitPrice}
            onChange={e => updateItemField(idx, "unitPrice", Number(e.target.value))}
          />

          <span className="line-total">
            {/* We’ll compute this inside SummarySection, so we can show blank here or recalc on‐the‐fly */}
            {item.quantity * item.unitPrice}
          </span>

          <button type="button" onClick={() => removeItem(idx)}>
            ✕
          </button>
        </div>
      ))}
    </section>
  );
};

export default ProductList;
