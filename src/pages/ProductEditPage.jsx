// src/pages/ProductEditPage.jsx
// ──────────────────────────────────────────────────────────────────────────────
// Allows the user to edit a single “catalog product” under Firestore path:
//    users/{uid}/products/{productId}
//
// Guarded against null/undefined, so you won’t get "Cannot read properties of null"

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

export default function ProductEditPage() {
  const { currentUser } = useAuth();
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null); // raw Firestore data + id
  const [local, setLocal] = useState(null);     // local editable copy
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ────────────────────────────────────────────────────────────────────────────
  // 1) Fetch Firestore document: users/{uid}/products/{productId}
  // ────────────────────────────────────────────────────────────────────────────
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
          setProduct(null);
          setLocal(null);
        } else {
          const data = snap.data();
          setProduct({ id: snap.id, ...data });
          // Copy all fields into local state—make sure arrays exist
          setLocal({
            productName: data.productName || "",
            quantity: data.quantity ?? 1,
            unit: data.unit || "Stk",
            unitPrice: data.unitPrice ?? 0.0,
            vat: data.vat ?? 19,
            discount: data.discount ?? 0,
            frameType: data.frameType || "",
            outerColor: data.outerColor || "",
            innerColor: data.innerColor || "",
            dimensions: data.dimensions || "",
            frameVeneerColor: data.frameVeneerColor || "",
            sashVeneerColor: data.sashVeneerColor || "",
            coreSealFrame: data.coreSealFrame || "",
            coreSealSash: data.coreSealSash || "",
            thresholdType: data.thresholdType || "",
            weldingType: data.weldingType || "",
            glazing: data.glazing || "",
            glassHold: data.glassHold || "",
            sashType: data.sashType || "",
            fitting: data.fitting || "",
            fittingType: data.fittingType || "",
            handleTypeInner: data.handleTypeInner || "",
            handleColorInner: data.handleColorInner || "",
            handleColorOuter: data.handleColorOuter || "",
            UwCoefficient: data.UwCoefficient || "",
            weightUnit: data.weightUnit || "",
            perimeter: data.perimeter || "",
            accessories: Array.isArray(data.accessories) ? data.accessories : [],
            fillings: Array.isArray(data.fillings) ? data.fillings : [],
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

  // ────────────────────────────────────────────────────────────────────────────
  // 2) Early returns for “loading” and “not found”
  // ────────────────────────────────────────────────────────────────────────────
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
        <h2>Product Not Found</h2>
        <button onClick={() => navigate("/products")}>
          Back to Catalog
        </button>
      </div>
    );
  }

  // Now that loading is false and product !== null, we know `local` is non‐null. We can safely read local.<field>.

  // ────────────────────────────────────────────────────────────────────────────
  // 3) Helper: update top‐level field in local state
  // ────────────────────────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setLocal((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ────────────────────────────────────────────────────────────────────────────
  // 4) CRUD for Accessories array
  // ────────────────────────────────────────────────────────────────────────────
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
    updated[index][field] = field === "qty" ? Number(value) : value;
    setLocal((prev) => ({ ...prev, accessories: updated }));
  };
  const handleRemoveAccessory = (index) => {
    const updated = [...(local.accessories || [])];
    updated.splice(index, 1);
    setLocal((prev) => ({ ...prev, accessories: updated }));
  };

  // ────────────────────────────────────────────────────────────────────────────
  // 5) CRUD for Fillings array
  // ────────────────────────────────────────────────────────────────────────────
  const handleAddFilling = () => {
    setLocal((prev) => ({
      ...prev,
      fillings: [
        ...(prev.fillings || []),
        {
          id: "",
          spec: "",
          dimensions: "",
          price: 0.0,
          discountPercent: 0,
        },
      ],
    }));
  };
  const handleFillingChange = (index, field, value) => {
    const updated = [...(local.fillings || [])];
    if (field === "price" || field === "discountPercent") {
      updated[index][field] = Number(value);
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

  // ────────────────────────────────────────────────────────────────────────────
  // 6) Save all local fields back to Firestore
  // ────────────────────────────────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────────────────────────────────
  // 7) Render the form (local is guaranteed non‐null here)
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="product-edit-page">
      <NavBar />
      <h2>Edit Catalog Product</h2>
      <p>
        (ID: <code>{product.id}</code>)
      </p>

      {/* BASIC WINDOW FIELDS */}
      <div className="field-group">
        <label className="label">Product Name</label>
        <input
          type="text"
          className="input full-width"
          value={local.productName}
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
            value={local.unit}
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

      {/* FRAME & COLORS & DIMENSIONS */}
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
            placeholder="e.g. Anthrazitgrau Sandstruktur / pureWhite"
            value={local.outerColor}
            onChange={(e) => handleChange("outerColor", e.target.value)}
          />
        </div>
        <div className="field-group">
          <label className="label">Innen Farbe (Inner Color)</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Weiß mit schwarzer Dichtung"
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
          placeholder="e.g. GU THERMO SCHWELLE 50 mm"
          value={local.thresholdType}
          onChange={(e) => handleChange("thresholdType", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Verschweißungsart (Welding Type)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. V-Super"
          value={local.weldingType}
          onChange={(e) => handleChange("weldingType", e.target.value)}
        />
      </div>

      <hr />

      {/* GLAZING & GLASS HOLDER */}
      <h3>Glazing &amp; Glass Holder</h3>

      <div className="field-group">
        <label className="label">Glazing Required</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. 6th/14Ar/6/16Ar/6th [Ug=0.6] (48mm)"
          value={local.glazing}
          onChange={(e) => handleChange("glazing", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Glasleiste (Glass Holder)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. GLASLEISTE CLASSIC – LINE – HST Evolution Drive"
          value={local.glassHold}
          onChange={(e) => handleChange("glassHold", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Flügel (Sash Type)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. HS8600 Skrzydło…"
          value={local.sashType}
          onChange={(e) => handleChange("sashType", e.target.value)}
        />
      </div>

      <hr />

      {/* FITTING */}
      <h3>Beschlag (Fitting)</h3>

      <div className="field-group">
        <label className="label">Beschlag (Fitting)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. HST Beschlag"
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
          <label className="label">Drückerfarbe innen (Handle Color, Inner)</label>
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

      {/* ADDITIONAL SPECS */}
      <h3>Additional Specs</h3>

      <div className="field-group">
        <label className="label">Wärmekoeffizient (Uw Coefficient)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. Uw = 0.90 W/m²·K"
          value={local.UwCoefficient}
          onChange={(e) => handleChange("UwCoefficient", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Gewichtseinheit (Weight Unit)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. 564.7 Kg"
          value={local.weightUnit}
          onChange={(e) => handleChange("weightUnit", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Umrandung (Perimeter)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. 12.9 m"
          value={local.perimeter}
          onChange={(e) => handleChange("perimeter", e.target.value)}
        />
      </div>

      <hr />

      {/* ACCESSORIES */}
      <h3>Zubehör (Accessories)</h3>
      {local.accessories &&
        local.accessories.map((acc, idx) => (
          <div key={idx} className="accessory-row">
            <div className="field-group small">
              <label className="label">Code</label>
              <input
                type="text"
                className="input"
                value={acc.code}
                onChange={(e) => handleAccessoryChange(idx, "code", e.target.value)}
              />
            </div>
            <div className="field-group flex-2">
              <label className="label">Description</label>
              <input
                type="text"
                className="input full-width"
                value={acc.description}
                onChange={(e) =>
                  handleAccessoryChange(idx, "description", e.target.value)
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
                onChange={(e) => handleAccessoryChange(idx, "qty", e.target.value)}
              />
            </div>
            <button
              className="btn-delete small-btn"
              onClick={() => handleRemoveAccessory(idx)}
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

      {/* FÜLLUNGEN (Fillings) */}
      <h3>Füllungen (Fillings)</h3>
      {local.fillings &&
        local.fillings.map((f, idx) => (
          <div key={idx} className="filling-row">
            <div className="field-group small">
              <label className="label">ID</label>
              <input
                type="text"
                className="input"
                value={f.id}
                onChange={(e) => handleFillingChange(idx, "id", e.target.value)}
              />
            </div>
            <div className="field-group flex-2">
              <label className="label">Specification</label>
              <textarea
                rows={2}
                className="input full-width"
                value={f.spec}
                onChange={(e) => handleFillingChange(idx, "spec", e.target.value)}
              />
            </div>
            <div className="field-group small">
              <label className="label">Maße</label>
              <input
                type="text"
                className="input"
                value={f.dimensions}
                onChange={(e) =>
                  handleFillingChange(idx, "dimensions", e.target.value)
                }
              />
            </div>
            <div className="field-group small">
              <label className="label">Preis (€)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={f.price}
                onChange={(e) =>
                  handleFillingChange(idx, "price", e.target.value)
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
                  handleFillingChange(idx, "discountPercent", e.target.value)
                }
              />
            </div>
            <button
              className="btn-delete small-btn"
              onClick={() => handleRemoveFilling(idx)}
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

      {/* SAVE / CANCEL BUTTONS */}
      <div className="buttons">
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
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
