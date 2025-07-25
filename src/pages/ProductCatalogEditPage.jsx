// src/pages/ProductCatalogEditPage.jsx
// ──────────────────────────────────────────────────────────────────────────────
// Allows the user to edit every single field of one “catalog product” document.
// Once the Firestore document is updated, clicking “Save” will write back to Firestore
// and return to the main ProductsPage.

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import { useAuth } from "../contexts/AuthContext";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";
import NavBar from "../components/NavBar";
import WindowPreview from "../components/WindowPreview"; // Corrected path

import "../assets/styles/pages/_productEditPage.scss";

// This is ProductFormEditorPage (content of ProductCatalogEditPage.jsx file)
export default function ProductCatalogEditPage() {
  const { currentUser } = useAuth();
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // For reading query parameters

  const [product, setProduct] = useState(null); // Stores original fetched product
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGlobalProductState, setIsGlobalProductState] = useState(false); // State to hold isGlobal

  // Local copy for editing:
  const [local, setLocal] = useState(null);

  // 1) Fetch the product document from Firestore:
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const isGlobal = queryParams.get('isGlobal') === 'true';
    setIsGlobalProductState(isGlobal); // Set state

    if (!isGlobal && !currentUser) {
      console.log("User not logged in for user-specific product, redirecting to login.");
      navigate("/login");
      return;
    }

    setLoading(true);
    let docRef;
    if (isGlobal) {
      docRef = doc(db, "products", productId);
      console.log(`Fetching global product: products/${productId}`);
    } else if (currentUser) {
      docRef = doc(db, "users", currentUser.uid, "products", productId);
      console.log(`Fetching user product: users/${currentUser.uid}/products/${productId}`);
    } else {
      console.error("Cannot determine product path: User not available for user product and not global.");
      setLoading(false);
      setProduct(null); // Ensure product state is reset
      setLocal(null);   // Ensure local state is reset
      return;
    }

    getDoc(docRef)
      .then((snap) => {
        if (!snap.exists()) {
          console.warn(`Product not found (isGlobal: ${isGlobal}):`, productId);
          setProduct(null);
          setLocal(null);
        } else {
          const data = snap.data();
          setProduct({ id: snap.id, ...data });
          setLocal({
            id: snap.id,
            ...data,
            widthMm: data.widthMm || null, // Initialize widthMm
            heightMm: data.heightMm || null, // Initialize heightMm
            windowSvgUrl: data.windowSvgUrl || "", // Initialize windowSvgUrl if it exists
            accessories: data.accessories || [],
            fillings: data.fillings || [],
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching product:", err);
        setProduct(null);
        setLocal(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId, currentUser, navigate, location.search]);

  // Helper: update a top‐level field in local state
  const handleChange = (field, value) => {
    setLocal((prev) => {
      if (!prev) return null;
      let processedValue = value;
      const numericFields = ['quantity', 'unitPrice', 'vat', 'discount', 'widthMm', 'heightMm'];

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
    setLocal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        accessories: [
          ...(prev.accessories || []),
          { code: "", description: "", qty: 1 },
        ],
      };
    });
  };

  const handleAccessoryChange = (index, field, value) => {
    setLocal(prev => {
      if (!prev || !prev.accessories) return prev;
      const updatedAccessories = [...prev.accessories];
      const targetAccessory = { ...updatedAccessories[index] };

      if (field === "qty") {
        if (value === "" || value === null || typeof value === 'undefined') {
          targetAccessory[field] = null;
        } else {
          const num = parseInt(value, 10);
          targetAccessory[field] = isNaN(num) ? null : num;
        }
      } else {
        targetAccessory[field] = value;
      }
      updatedAccessories[index] = targetAccessory;
      return { ...prev, accessories: updatedAccessories };
    });
  };
  const handleRemoveAccessory = (index) => {
    setLocal((prev) => {
      if (!prev || !prev.accessories) return prev;
      const updated = [...prev.accessories];
      updated.splice(index, 1);
      return { ...prev, accessories: updated };
    });
  };

  // FILLINGS CRUD
  const handleAddFilling = () => {
    setLocal((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        fillings: [
          ...(prev.fillings || []),
          { id: "", spec: "", dimensions: "", price: 0, discountPercent: 0 },
        ],
      };
    });
  };

  const handleFillingChange = (index, field, value) => {
    setLocal(prev => {
      if (!prev || !prev.fillings) return prev;
      const updatedFillings = [...prev.fillings];
      const targetFilling = { ...updatedFillings[index] };

      if (field === "price" || field === "discountPercent") {
        if (value === "" || value === null || typeof value === 'undefined') {
          targetFilling[field] = null;
        } else {
          const num = parseFloat(value);
          targetFilling[field] = isNaN(num) ? null : num;
        }
      } else {
        targetFilling[field] = value;
      }
      updatedFillings[index] = targetFilling;
      return { ...prev, fillings: updatedFillings };
    });
  };

  const handleRemoveFilling = (index) => {
    setLocal((prev) => {
      if (!prev || !prev.fillings) return prev;
      const updated = [...prev.fillings];
      updated.splice(index, 1);
      return { ...prev, fillings: updated };
    });
  };

  // Save back to Firestore, then navigate to /catalog
  const handleSave = async () => {
    if (!local) {
      console.error("Local data is not set. Cannot save.");
      alert("Product data not loaded, cannot save.");
      return;
    }
    setSaving(true);
    try {
      let docRef;
      if (isGlobalProductState) {
        docRef = doc(db, "products", productId);
        console.log(`Saving global product: products/${productId}`);
      } else if (currentUser) {
        docRef = doc(db, "users", currentUser.uid, "products", productId);
        console.log(`Saving user product: users/${currentUser.uid}/products/${productId}`);
      } else {
        console.error("Cannot save product: user not logged in for user-specific product or path determination error.");
        alert("Error: User not authenticated for this action.");
        setSaving(false);
        return;
      }

      const { id, ...dataToSave } = local;

      await updateDoc(docRef, {
        ...dataToSave,
        updatedAt: serverTimestamp(),
      });
      navigate("/catalog");
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Error saving product: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Conditional rendering for loading and if product data 'local' is not available
  if (loading) {
    return (
      <div className="product-edit-page">
        <NavBar />
        <p>Loading product...</p>
      </div>
    );
  }

  if (!local) {
    return (
      <div className="product-edit-page">
        <NavBar />
        <h2>Product Not Found or Error Loading Data.</h2>
        <p>Please check the product ID or try again. If the issue persists, contact support.</p>
        <button onClick={() => navigate("/catalog")}>Back to Catalog</button>
      </div>
    );
  }

  return (
    <div className="product-edit-page">
      <NavBar />

      <h2>Edit Product</h2>
      <p>
        Editing: {isGlobalProductState ? "Global Product" : "Your Product"} (ID: <code>{local.id}</code>)
      </p>

      {/* SVG Preview Section */}
      <div className="svg-preview-section" style={{ margin: '20px 0', padding: '10px', border: '1px solid #eee', backgroundColor: '#f9f9f9' }}>
        <h4>Window Preview</h4>
        <WindowPreview
          widthMm={local.widthMm}
          heightMm={local.heightMm}
          svgUrl={local.windowSvgUrl} // Pass this if it exists, WindowPreview will use default if not
        />
      </div>

      {/* SECTION: Basic Fields (Name, Qty, Unit, Price, VAT, Discount) */}
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

      {/* SVG Preview Dimensions */}
      <h3>Dimensions for SVG Preview</h3>
      <div className="horizontal-group">
        <div className="field-group small">
          <label className="label">Width (mm)</label>
          <input
            type="number"
            className="input"
            value={local.widthMm ?? ''}
            onChange={(e) => handleChange("widthMm", e.target.value)}
            placeholder="e.g., 1000"
          />
        </div>
        <div className="field-group small">
          <label className="label">Height (mm)</label>
          <input
            type="number"
            className="input"
            value={local.heightMm ?? ''}
            onChange={(e) => handleChange("heightMm", e.target.value)}
            placeholder="e.g., 750"
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
