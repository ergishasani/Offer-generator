// src/pages/ProductCatalogEditPage.jsx
// ──────────────────────────────────────────────────────────────────────────────
// Allows the user to edit every single field of one “catalog product” document.
// Once the Firestore document is updated, clicking “Save” will write back to Firestore
// and return to the main ProductsPage.

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";
import NavBar from "../components/NavBar";

import "../assets/styles/pages/_productEditPage.scss";

export default function ProductCatalogEditPage() {
  const { currentUser } = useAuth();
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local copy for editing:
  const [local, setLocal] = useState(null);

  // 1) Fetch the product document from Firestore:
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const docRef = doc(
      db,
      "users",
      currentUser.uid,
      "products",
      productId
    );
    getDoc(docRef)
      .then((snap) => {
        if (!snap.exists()) {
          console.warn("No such product:", productId);
          setProduct(null);
          setLocal(null);
        } else {
          const data = snap.data();
          setProduct({ id: snap.id, ...data });
          // Initialize local state with Firestore data:
          setLocal({
            ...(data || {}),
            // Ensure arrays exist:
            accessories: data.accessories || [],
            fillings: data.fillings || [],
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching product:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentUser, productId, navigate]);

  if (loading) {
    return (
      <div className="product-edit-page">
        <NavBar />
        <p>Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-edit-page">
        <NavBar />
        <h2>Product not found</h2>
        <button onClick={() => navigate("/products")}>Back to Catalog</button>
      </div>
    );
  }

  // Helper: update a top‐level field in local state
  const handleChange = (field, value) => {
    setLocal((prev) => {
      let processedValue = value;
      const numericFields = ['quantity', 'unitPrice', 'vat', 'discount'];

      if (numericFields.includes(field)) {
        if (value === "" || value === null || typeof value === 'undefined') {
          processedValue = null;
        } else {
          const num = parseFloat(value);
          processedValue = isNaN(num) ? null : num;
        }
      }
      return { ...prev, [field]: processedValue };
    });
  };

  // ACCESSORIES CRUD
  const handleAddAccessory = () => {
    setLocal((prev) => ({
      ...prev,
      accessories: [
        ...(prev.accessories || []),
        { code: "", description: "", qty: 1 },
      ],
    }));
  };
  const handleAccessoryChange = (index, field, value) => {
    const updated = [...(local.accessories || [])];
    if (field === "qty") {
      if (value === "" || value === null || typeof value === 'undefined') {
        updated[index][field] = null;
      } else {
        const num = parseInt(value, 10); // Qty is likely an integer
        updated[index][field] = isNaN(num) ? null : num;
      }
    } else {
      updated[index][field] = value;
    }
    setLocal((prev) => ({ ...prev, accessories: updated }));
  };
  const handleRemoveAccessory = (index) => {
    const updated = [...(local.accessories || [])];
    updated.splice(index, 1);
    setLocal((prev) => ({ ...prev, accessories: updated }));
  };

  // FILLINGS CRUD
  const handleAddFilling = () => {
    setLocal((prev) => ({
      ...prev,
      fillings: [
        ...(prev.fillings || []),
        { id: "", spec: "", dimensions: "", price: 0, discountPercent: 0 },
      ],
    }));
  };
  const handleFillingChange = (index, field, value) => {
    const updated = [...(local.fillings || [])];
    if (field === "price" || field === "discountPercent") {
      if (value === "" || value === null || typeof value === 'undefined') {
        updated[index][field] = null;
      } else {
        const num = parseFloat(value);
        updated[index][field] = isNaN(num) ? null : num;
      }
    } else {
      updated[index][field] = value;
    }
    setLocal((prev) => ({ ...prev, fillings: updated }));
  };
  const handleRemoveFilling = (index) => {
    const updated = [...(local.fillings || [])];
    updated.splice(index, 1);
    setLocal((prev) => ({ ...prev, fillings: updated }));
  };

  // Save back to Firestore, then navigate to /products
  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(
        db,
        "users",
        currentUser.uid,
        "products",
        productId
      );
      // Ensure we write serverTimestamp for “updatedAt”
      await updateDoc(docRef, {
        ...local,
        updatedAt: serverTimestamp(),
      });
      navigate("/products");
    } catch (err) {
      console.error("Error saving product:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="product-edit-page">
      <NavBar />

      <h2>Edit Catalog Product</h2>
      <p>
        (ID: <code>{product.id}</code>)
      </p>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* SECTION: Basic Fields (Name, Qty, Unit, Price, VAT, Discount) */}
      {/* ────────────────────────────────────────────────────────────── */}
      <div className="field-group">
        <label className="label">Product Name</label>
        <input
          type="text"
          className="input full-width"
          value={local.productName || ""}
          onChange={(e) => handleChange("productName", e.target.value)}
        />
      </div>

      <div className="horizontal-group">
        <div className="field-group small">
          <label className="label">Quantity</label>
          <input
            type="number"
            className="input"
            value={local.quantity}
            onChange={(e) => handleChange("quantity", e.target.value)}
          />
        </div>
        <div className="field-group small">
          <label className="label">Unit</label>
          <select
            className="select"
            value={local.unit || "Stk"}
            onChange={(e) => handleChange("unit", e.target.value)}
          >
            <option value="Stk">Stk</option>
            <option value="m2">m²</option>
            <option value="m">m</option>
            <option value="lfdm">lfdm</option>
          </select>
        </div>
        <div className="field-group small">
          <label className="label">Unit Price (€)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={local.unitPrice}
            onChange={(e) => handleChange("unitPrice", e.target.value)}
          />
        </div>
        <div className="field-group small">
          <label className="label">VAT (%)</label>
          <select
            className="select"
            value={local.vat}
            onChange={(e) => handleChange("vat", e.target.value)}
          >
            <option value={19}>19%</option>
            <option value={7}>7%</option>
            <option value={0}>0%</option>
          </select>
        </div>
        <div className="field-group small">
          <label className="label">Discount (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            className="input"
            value={local.discount}
            onChange={(e) => handleChange("discount", e.target.value)}
          />
        </div>
      </div>

      <hr />

      {/* ────────────────────────────────────────────────────────────── */}
      {/* SECTION: Frame & Color & Dimensions */}
      {/* ────────────────────────────────────────────────────────────── */}
      <h3>Frame &amp; Color Configuration</h3>

      <div className="field-group">
        <label className="label">Rahmen (Frame Type)</label>
        <input
          type="text"
          className="input full-width"
          value={local.frameType}
          onChange={(e) => handleChange("frameType", e.target.value)}
        />
      </div>

      <div className="horizontal-group">
        <div className="field-group">
          <label className="label">Außen Farbe (Outer Color)</label>
          <input
            type="text"
            className="input"
            placeholder="z. B. Anthrazitgrau Sandstruktur / pureWhite"
            value={local.outerColor}
            onChange={(e) => handleChange("outerColor", e.target.value)}
          />
        </div>

        <div className="field-group">
          <label className="label">Innen Farbe (Inner Color)</label>
          <input
            type="text"
            className="input"
            placeholder="z. B. Weiß mit schwarzer Dichtung"
            value={local.innerColor}
            onChange={(e) => handleChange("innerColor", e.target.value)}
          />
        </div>
      </div>

      <div className="field-group">
        <label className="label">
          Maße (Dimensions, e.g. “4250 mm × 2180 mm”)
        </label>
        <input
          type="text"
          className="input full-width"
          value={local.dimensions}
          onChange={(e) => handleChange("dimensions", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">
          Furnierfarbe des Rahmens (Frame Veneer Color)
        </label>
        <input
          type="text"
          className="input full-width"
          value={local.frameVeneerColor}
          onChange={(e) => handleChange("frameVeneerColor", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">
          Furnierfarbe des Flügels (Sash Veneer Color)
        </label>
        <input
          type="text"
          className="input full-width"
          value={local.sashVeneerColor}
          onChange={(e) => handleChange("sashVeneerColor", e.target.value)}
        />
      </div>

      <div className="horizontal-group">
        <div className="field-group">
          <label className="label">
            Farbe des Kerns &amp; Dichtung im Rahmen (Core &amp; Seal in Frame)
          </label>
          <input
            type="text"
            className="input"
            value={local.coreSealFrame}
            onChange={(e) => handleChange("coreSealFrame", e.target.value)}
          />
        </div>
        <div className="field-group">
          <label className="label">
            Farbe des Kerns &amp; Dichtung im Flügel (Core &amp; Seal in Sash)
          </label>
          <input
            type="text"
            className="input"
            value={local.coreSealSash}
            onChange={(e) => handleChange("coreSealSash", e.target.value)}
          />
        </div>
      </div>

      <div className="field-group">
        <label className="label">Schwellentyp HST (Threshold Type)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="z. B. GU THERMO SCHWELLE 50 mm"
          value={local.thresholdType}
          onChange={(e) => handleChange("thresholdType", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Verschweißungsart (Welding Type)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="z. B. V-Super"
          value={local.weldingType}
          onChange={(e) => handleChange("weldingType", e.target.value)}
        />
      </div>

      <hr />

      {/* ────────────────────────────────────────────────────────────── */}
      {/* SECTION: Glazing & Glass Holder */}
      {/* ────────────────────────────────────────────────────────────── */}
      <h3>Glazing &amp; Glass Holder</h3>

      <div className="field-group">
        <label className="label">Glazing Required</label>
        <input
          type="text"
          className="input full-width"
          placeholder="z. B. 6th/14Ar/6/16Ar/6th [Ug=0.6] (48mm)"
          value={local.glazing}
          onChange={(e) => handleChange("glazing", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Glasleiste (Glass Holder)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="z. B. GLASLEISTE CLASSIC – LINE – HST Evolution Drive"
          value={local.glassHold}
          onChange={(e) => handleChange("glassHold", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Flügel (Sash Type)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="z. B. HS8600 Skrzydło…"
          value={local.sashType}
          onChange={(e) => handleChange("sashType", e.target.value)}
        />
      </div>

      <hr />

      {/* ────────────────────────────────────────────────────────────── */}
      {/* SECTION: Beschlag (Fitting) */}
      {/* ────────────────────────────────────────────────────────────── */}
      <h3>Beschlag (Fitting)</h3>

      <div className="field-group">
        <label className="label">Beschlag (Fitting)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="z. B. HST Beschlag"
          value={local.fitting}
          onChange={(e) => handleChange("fitting", e.target.value)}
        />
      </div>

      <div className="horizontal-group">
        <div className="field-group">
          <label className="label">Beschlagsart (Fitting Type)</label>
          <input
            type="text"
            className="input"
            value={local.fittingType}
            onChange={(e) => handleChange("fittingType", e.target.value)}
          />
        </div>

        <div className="field-group">
          <label className="label">Art der Olive (Handle Type, Inner)</label>
          <input
            type="text"
            className="input"
            value={local.handleTypeInner}
            onChange={(e) => handleChange("handleTypeInner", e.target.value)}
          />
        </div>
      </div>

      <div className="horizontal-group">
        <div className="field-group">
          <label className="label">
            Drückerfarbe innen (Handle Color, Inner)
          </label>
          <input
            type="text"
            className="input"
            value={local.handleColorInner}
            onChange={(e) => handleChange("handleColorInner", e.target.value)}
          />
        </div>

        <div className="field-group">
          <label className="label">Farbe des Außengriffs (Handle Color, Outer)</label>
          <input
            type="text"
            className="input"
            value={local.handleColorOuter}
            onChange={(e) => handleChange("handleColorOuter", e.target.value)}
          />
        </div>
      </div>

      <hr />

      {/* ────────────────────────────────────────────────────────────── */}
      {/* SECTION: UwCoefficient, Weight, Perimeter */}
      {/* ────────────────────────────────────────────────────────────── */}
      <h3>Additional Specs</h3>

      <div className="field-group">
        <label className="label">Wärmekoeffizient (UwCoefficient)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="z. B. Uw = 0,90 W/m²·K"
          value={local.UwCoefficient}
          onChange={(e) => handleChange("UwCoefficient", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Gewichtseinheit (Weight Unit)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="z. B. 564,7 Kg"
          value={local.weightUnit}
          onChange={(e) => handleChange("weightUnit", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Umrandung (Perimeter)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="z. B. 12.9 m"
          value={local.perimeter}
          onChange={(e) => handleChange("perimeter", e.target.value)}
        />
      </div>

      <hr />

      {/* ────────────────────────────────────────────────────────────── */}
      {/* SECTION: Zubehör (Accessories) */}
      {/* ────────────────────────────────────────────────────────────── */}
      <h3>Zubehör (Accessories)</h3>
      {local.accessories &&
        local.accessories.map((acc, aIdx) => (
          <div key={aIdx} className="accessory-row">
            <div className="field-group small">
              <label className="label">Code</label>
              <input
                type="text"
                className="input"
                value={acc.code}
                onChange={(e) =>
                  handleAccessoryChange(aIdx, "code", e.target.value)
                }
              />
            </div>
            <div className="field-group flex-2">
              <label className="label">Description</label>
              <input
                type="text"
                className="input full-width"
                value={acc.description}
                onChange={(e) =>
                  handleAccessoryChange(aIdx, "description", e.target.value)
                }
              />
            </div>
            <div className="field-group small">
              <label className="label">Qty</label>
              <input
                type="number"
                min="1"
                className="input"
                value={acc.qty}
                onChange={(e) =>
                  handleAccessoryChange(aIdx, "qty", e.target.value)
                }
              />
            </div>
            <button
              className="btn-delete small-btn"
              onClick={() => handleRemoveAccessory(aIdx)}
              title="Remove accessory"
            >
              ×
            </button>
          </div>
        ))}
      <button type="button" className="btn-add" onClick={handleAddAccessory}>
        + Add Accessory
      </button>

      <hr />

      {/* ────────────────────────────────────────────────────────────── */}
      {/* SECTION: Füllungen (Fillings) */}
      {/* ────────────────────────────────────────────────────────────── */}
      <h3>Füllungen (Fillings)</h3>
      {local.fillings &&
        local.fillings.map((f, fIdx) => (
          <div key={fIdx} className="filling-row">
            <div className="field-group small">
              <label className="label">ID</label>
              <input
                type="text"
                className="input"
                value={f.id}
                onChange={(e) =>
                  handleFillingChange(fIdx, "id", e.target.value)
                }
              />
            </div>
            <div className="field-group flex-2">
              <label className="label">Specification</label>
              <textarea
                rows={2}
                className="input full-width"
                value={f.spec}
                onChange={(e) =>
                  handleFillingChange(fIdx, "spec", e.target.value)
                }
              />
            </div>
            <div className="field-group small">
              <label className="label">Maße</label>
              <input
                type="text"
                className="input"
                value={f.dimensions}
                onChange={(e) =>
                  handleFillingChange(fIdx, "dimensions", e.target.value)
                }
              />
            </div>
            <div className="field-group small">
              <label className="label">Price (€)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={f.price}
                onChange={(e) =>
                  handleFillingChange(fIdx, "price", e.target.value)
                }
              />
            </div>
            <div className="field-group small">
              <label className="label">Disc (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="input"
                value={f.discountPercent}
                onChange={(e) =>
                  handleFillingChange(
                    fIdx,
                    "discountPercent",
                    e.target.value
                  )
                }
              />
            </div>
            <button
              className="btn-delete small-btn"
              onClick={() => handleRemoveFilling(fIdx)}
              title="Remove filling"
            >
              ×
            </button>
          </div>
        ))}
      <button type="button" className="btn-add" onClick={handleAddFilling}>
        + Add Filling
      </button>

      <hr />

      <div className="buttons">
        <button
          onClick={handleSave}
          className="btn-primary"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Product"}
        </button>
        <button
          onClick={() => navigate("/products")}
          className="btn-secondary"
          style={{ marginLeft: "1rem" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
