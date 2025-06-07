// src/components/ProductList.jsx
import React, { useState, useEffect } from "react";
import "../assets/styles/components/_productList.scss";
import { listCatalog } from "../services/catalogService";

const ProductList = ({
  items,
  addItem,
  removeItem,
  updateItemField,
  updateAccessory,
  removeAccessory,
  updateFilling,
  removeFilling,
  updateImageField, // to handle file→base64
}) => {
  // ── NEW: load global catalog ──
  const [catalog, setCatalog] = useState([]);
  useEffect(() => {
    listCatalog()
      .then(setCatalog)
      .catch((err) => console.error("Error loading catalog:", err));
  }, []);

  // Helper to convert a File object to a base64 dataURL
  const fileToBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.onerror = (err) => {
      console.error("Error reading file:", err);
      callback(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="product-list">
      <h2>Items to Quote (Windows / Doors)</h2>
      <button type="button" className="add-button" onClick={addItem}>
        + Add Item
      </button>

      {items.map((item, idx) => (
        <div className="item-card" key={item.id}>
          <div className="item-header">
            <h3>
              Item {idx + 1}:
              {/* ── NEW: Catalog dropdown ── */}
              <select
                className="catalog-select"
                value={item.productId || ""}
                onChange={(e) =>
                  updateItemField(idx, "productId", e.target.value)
                }
              >
                <option value="">— choose product —</option>
                {catalog.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.width}×{p.height}, {p.color})
                  </option>
                ))}
              </select>
              {/* ── end dropdown ── */}
              <input
                type="text"
                placeholder="e.g. Window 001"
                value={item.title ?? ""}
                onChange={(e) =>
                  updateItemField(idx, "title", e.target.value)
                }
              />
            </h3>
            <button
              type="button"
              className="remove-button"
              onClick={() => removeItem(idx)}
            >
              Delete Item
            </button>
          </div>

          {/* … all the other fields as before … */}

          {/* ── NEW: Interior & Exterior Image Inputs ── */}
          <div className="subsection">
            <h4>Diagrams / Images</h4>
            <label>
              Interior View Image:
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    fileToBase64(file, (dataUrl) => {
                      updateImageField(idx, "interiorImage", dataUrl);
                    });
                  }
                }}
              />
            </label>
            {item.interiorImage && (
              <img
                src={item.interiorImage}
                alt={`Item ${idx + 1} interior preview`}
                style={{ maxWidth: "150px", marginTop: "0.5rem" }}
              />
            )}

            <label>
              Exterior View Image:
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    fileToBase64(file, (dataUrl) => {
                      updateImageField(idx, "exteriorImage", dataUrl);
                    });
                  }
                }}
              />
            </label>
            {item.exteriorImage && (
              <img
                src={item.exteriorImage}
                alt={`Item ${idx + 1} exterior preview`}
                style={{ maxWidth: "150px", marginTop: "0.5rem" }}
              />
            )}
          </div>
        </div>
      ))}
    </section>
  );
};

export default ProductList;
