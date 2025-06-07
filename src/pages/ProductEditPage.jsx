// src/pages/ProductEditPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../services/firebase";
import NavBar from "../components/NavBar";

import "../assets/styles/pages/_productEditPage.scss";

export default function ProductEditPage() {
  const { currentUser } = useAuth();
  const { productId }   = useParams();
  const navigate        = useNavigate();
  const location        = useLocation();
  const returnTo        = location.state?.returnTo || "/products";

  // New: track whether this is a global (admin) product
  const [isGlobal, setIsGlobal] = useState(false);

  // Firestore + local state
  const [product, setProduct] = useState(null);
  const [local,   setLocal]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Categories
  const [globalCategories, setGlobalCategories] = useState([]);
  const [userCategories,   setUserCategories]   = useState([]);
  const [allCategories,    setAllCategories]    = useState([]);

  // 1) Redirect if not logged in
  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  // 2) Fetch either global (if admin) or user product
  useEffect(() => {
    if (!currentUser) return;

    (async () => {
      let snap = null;
      let data = null;
      // Try global first for admins
      if (currentUser.admin) {
        const globalRef = doc(db, "products", productId);
        const gSnap = await getDoc(globalRef);
        if (gSnap.exists()) {
          setIsGlobal(true);
          snap = gSnap;
        }
      }
      // Otherwise, or if global not found, fall back to user path
      if (!snap) {
        const userRef = doc(db, "users", currentUser.uid, "products", productId);
        const uSnap = await getDoc(userRef);
        if (uSnap.exists()) {
          setIsGlobal(false);
          snap = uSnap;
        }
      }
      if (!snap) {
        setProduct(null);
        setLocal(null);
        setLoading(false);
        return;
      }
      data = snap.data();
      setProduct({ id: snap.id, ...data });
      setLocal({
        categoryId:        data.categoryId || "",
        productName:       data.productName || "",
        quantity:          data.quantity ?? 1,
        unit:              data.unit || "Stk",
        unitPrice:         data.unitPrice ?? 0.0,
        vat:               data.vat ?? 19,
        discount:          data.discount ?? 0,
        frameType:         data.frameType || "",
        outerColor:        data.outerColor || "",
        innerColor:        data.innerColor || "",
        dimensions:        data.dimensions || "",
        frameVeneerColor:  data.frameVeneerColor || "",
        sashVeneerColor:   data.sashVeneerColor || "",
        coreSealFrame:     data.coreSealFrame || "",
        coreSealSash:      data.coreSealSash || "",
        thresholdType:     data.thresholdType || "",
        weldingType:       data.weldingType || "",
        glazing:           data.glazing || "",
        glassHold:         data.glassHold || "",
        sashType:          data.sashType || "",
        fitting:           data.fitting || "",
        fittingType:       data.fittingType || "",
        handleTypeInner:   data.handleTypeInner || "",
        handleColorInner:  data.handleColorInner || "",
        handleColorOuter:  data.handleColorOuter || "",
        UwCoefficient:     data.UwCoefficient || "",
        weightUnit:        data.weightUnit || "",
        perimeter:         data.perimeter || "",
        accessories:       Array.isArray(data.accessories) ? data.accessories : [],
        fillings:          Array.isArray(data.fillings) ? data.fillings : [],
      });
      setLoading(false);
    })();
  }, [currentUser, productId, navigate]);

  // 3) Subscribe to global + user categories
  useEffect(() => {
    if (!currentUser) return;

    const qGlobal = query(collection(db, "categories"), orderBy("name", "asc"));
    const unsubG  = onSnapshot(qGlobal, snap =>
      setGlobalCategories(snap.docs.map(d => ({ id: d.id, name: d.data().name, isUserOnly: false })))
    );

    const qUser = query(
      collection(db, "users", currentUser.uid, "categories"),
      orderBy("name", "asc")
    );
    const unsubU = onSnapshot(qUser, snap =>
      setUserCategories(snap.docs.map(d => ({ id: d.id, name: d.data().name, isUserOnly: true })))
    );

    return () => {
      unsubG();
      unsubU();
    };
  }, [currentUser]);

  // 4) Merge
  useEffect(() => {
    setAllCategories([...globalCategories, ...userCategories]);
  }, [globalCategories, userCategories]);

  // 5) Early returns
  if (loading) {
    return <div className="product-edit-page"><NavBar /><p>Loading product…</p></div>;
  }
  if (!product) {
    return (
      <div className="product-edit-page">
        <NavBar />
        <h2>Product Not Found</h2>
        <button onClick={() => navigate(returnTo)}>Back</button>
      </div>
    );
  }

  // 6) Local updates
  const handleChange = (field, value) => {
    setLocal(prev => ({ ...prev, [field]: value }));
  };

  // Accessories / Fillings (unchanged)
  const handleAddAccessory = () => {
    setLocal(prev => ({
      ...prev,
      accessories: [...(prev.accessories || []), { code: "", description: "", qty: 1 }],
    }));
  };
  const handleAccessoryChange = (i, field, value) => {
    const arr = [...(local.accessories || [])];
    arr[i][field] = field === "qty" ? Number(value) : value;
    setLocal(prev => ({ ...prev, accessories: arr }));
  };
  const handleRemoveAccessory = i => {
    const arr = [...(local.accessories || [])];
    arr.splice(i, 1);
    setLocal(prev => ({ ...prev, accessories: arr }));
  };

  const handleAddFilling = () => {
    setLocal(prev => ({
      ...prev,
      fillings: [...(prev.fillings || []), { id: "", spec: "", dimensions: "", price: 0.0, discountPercent: 0 }],
    }));
  };
  const handleFillingChange = (i, field, value) => {
    const arr = [...(local.fillings || [])];
    arr[i][field] = (field === "price" || field === "discountPercent") ? Number(value) : value;
    setLocal(prev => ({ ...prev, fillings: arr }));
  };
  const handleRemoveFilling = i => {
    const arr = [...(local.fillings || [])];
    arr.splice(i, 1);
    setLocal(prev => ({ ...prev, fillings: arr }));
  };

  // 8) SAVE: write to /products/{id} if admin & global exists; otherwise user subcollection
  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = isGlobal
        ? doc(db, "products", productId)
        : doc(db, "users", currentUser.uid, "products", productId);

      await updateDoc(ref, {
        ...local,
        updatedAt: serverTimestamp(),
      });

      navigate(returnTo);
    } catch (err) {
      console.error("Error saving product:", err);
      alert("Could not save changes. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="product-edit-page">
      <NavBar />
      <h2>Edit Catalog Product</h2>
      <p>(ID: <code>{product.id}</code>)</p>

      {/* Category dropdown */}
      <div className="field-group">
        <label className="label">Category</label>
        <select
          className="select full-width"
          value={local.categoryId}
          onChange={e => handleChange("categoryId", e.target.value)}
        >
          <option value="">-- No category --</option>
          {allCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name} {cat.isUserOnly ? "(Your)" : "(Global)"}
            </option>
          ))}
        </select>
      </div>


      {/* Basic fields */}
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

      {/* Frame & colors & dimensions */}
      <h3>Frame &amp; Color Configuration</h3>

      <div className="field-group">
        <label className="label">Frame Type</label>
        <input
          type="text"
          className="input full-width"
          value={local.frameType}
          onChange={(e) => handleChange("frameType", e.target.value)}
        />
      </div>

      <div className="horizontal-group">
        <div className="field-group">
          <label className="label">Outer Color</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Anthrazitgrau Sandstruktur"
            value={local.colorOuter}
            onChange={(e) => handleChange("colorOuter", e.target.value)}
          />
        </div>
        <div className="field-group">
          <label className="label">Inner Color</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. White with black seal"
            value={local.colorInner}
            onChange={(e) => handleChange("colorInner", e.target.value)}
          />
        </div>
      </div>

      <div className="field-group">
        <label className="label">Dimensions (e.g. “4250 mm × 2180 mm”)</label>
        <input
          type="text"
          className="input full-width"
          value={local.dimensions}
          onChange={(e) => handleChange("dimensions", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Frame Veneer Color</label>
        <input
          type="text"
          className="input full-width"
          value={local.frameVeneerColor}
          onChange={(e) => handleChange("frameVeneerColor", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Sash Veneer Color</label>
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
            Core &amp; Seal (Frame)
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
            Core &amp; Seal (Sash)
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
        <label className="label">Threshold Type (HST)</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. GU THERMO SCHWELLE 50 mm"
          value={local.thresholdType}
          onChange={(e) => handleChange("thresholdType", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Welding Type</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. V-Super"
          value={local.weldingType}
          onChange={(e) => handleChange("weldingType", e.target.value)}
        />
      </div>

      <hr />

      {/* Glazing & glass holder */}
      <h3>Glazing &amp; Glass Holder</h3>

      <div className="field-group">
        <label className="label">Glazing Required</label>
        <input
          type="text"
          className="input full-width"
          placeholder='e.g. 6th/14Ar/6/16Ar/6th [Ug=0.6] (48 mm)'
          value={local.glazing}
          onChange={(e) => handleChange("glazing", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Glass Holder</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. GLASLEISTE CLASSIC – LINE"
          value={local.glassHold}
          onChange={(e) => handleChange("glassHold", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Sash Type</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. HS8600 …"
          value={local.sashType}
          onChange={(e) => handleChange("sashType", e.target.value)}
        />
      </div>

      <hr />

      {/* Fitting */}
      <h3>Fitting (Beschlag)</h3>

      <div className="field-group">
        <label className="label">Fitting</label>
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
          <label className="label">Fitting Type</label>
          <input
            type="text"
            className="input"
            value={local.fittingType}
            onChange={(e) => handleChange("fittingType", e.target.value)}
          />
        </div>
        <div className="field-group">
          <label className="label">Handle Type (Inner)</label>
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
          <label className="label">Handle Color (Inner)</label>
          <input
            type="text"
            className="input"
            value={local.handleColorInner}
            onChange={(e) => handleChange("handleColorInner", e.target.value)}
          />
        </div>
        <div className="field-group">
          <label className="label">Handle Color (Outer)</label>
          <input
            type="text"
            className="input"
            value={local.handleColorOuter}
            onChange={(e) => handleChange("handleColorOuter", e.target.value)}
          />
        </div>
      </div>

      <hr />

      {/* Additional specs */}
      <h3>Additional Specs</h3>

      <div className="field-group">
        <label className="label">Uw Coefficient</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. Uw = 0.90 W/m²·K"
          value={local.UwCoefficient}
          onChange={(e) => handleChange("UwCoefficient", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Weight Unit</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. 564.7 Kg"
          value={local.weightUnit}
          onChange={(e) => handleChange("weightUnit", e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="label">Perimeter</label>
        <input
          type="text"
          className="input full-width"
          placeholder="e.g. 12.9 m"
          value={local.perimeter}
          onChange={(e) => handleChange("perimeter", e.target.value)}
        />
      </div>

      <hr />

      {/* Accessories */}
      <h3>Accessories</h3>
      {local.accessories &&
        local.accessories.map((acc, idx) => (
          <div key={idx} className="accessory-row">
            <div className="field-group small">
              <label className="label">Code</label>
              <input
                type="text"
                className="input"
                value={acc.code}
                onChange={(e) =>
                  handleAccessoryChange(idx, "code", e.target.value)
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
                onChange={(e) =>
                  handleAccessoryChange(idx, "qty", e.target.value)
                }
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
      <button
        type="button"
        className="btn-add"
        onClick={handleAddAccessory}
      >
        + Add Accessory
      </button>

      <hr />

      {/* Fillings */}
      <h3>Fillings</h3>
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
                onChange={(e) =>
                  handleFillingChange(idx, "spec", e.target.value)
                }
              />
            </div>
            <div className="field-group small">
              <label className="label">Dimensions</label>
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
              <label className="label">Price (€)</label>
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
      <button
        type="button"
        className="btn-add"
        onClick={handleAddFilling}
      >
        + Add Filling
      </button>

      <hr />
      {/* SAVE / CANCEL */}
            <div className="buttons">
              <button onClick={handleSave} className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save Product"}
              </button>
              <button onClick={() => navigate(returnTo)} className="btn-secondary" style={{ marginLeft: "1rem" }}>
                Cancel
              </button>
            </div>
          </div>
        );
      }