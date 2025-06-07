// src/pages/AdminCatalogEditor.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../services/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import "../assets/styles/pages/_adminCatalogEditor.scss";

export default function AdminCatalogEditor() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Categories
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState("");

  // Products
  const [products, setProducts] = useState([]);

  // 1) Load categories & products
  useEffect(() => {
    const catsQ = query(collection(db, "categories"), orderBy("name"));
    const unSubCats = onSnapshot(catsQ, (snap) =>
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    const prodsQ = query(collection(db, "products"), orderBy("productName"));
    const unSubProds = onSnapshot(prodsQ, (snap) =>
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unSubCats();
      unSubProds();
    };
  }, []);

  // 2) Access control
  if (!currentUser) return <p>Loading…</p>;
  if (!currentUser.admin)
    return <p className="access-denied">Zugriff verweigert. Admins only.</p>;

  // ─── CATEGORY HANDLERS ───────────────────────────────────
  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    await addDoc(collection(db, "categories"), { name });
    setNewCatName("");
  };
  const updateCategory = (id, name) =>
    updateDoc(doc(db, "categories", id), { name });
  const deleteCategory = (id) => {
    if (!window.confirm("Kategorie löschen?")) return;
    deleteDoc(doc(db, "categories", id));
  };

  // ─── PRODUCT HANDLERS ────────────────────────────────────
  const handleAddProduct = async () => {
    // Create a brand-new product with all fields present:
    const newRef = await addDoc(collection(db, "products"), {
      categoryId:           "",
      productName:          "",
      quantity:             1,
      unit:                 "Stk",
      unitPrice:            0.0,
      vat:                  19,
      discount:             0,
      frameType:            "",
      outerColor:           "",
      innerColor:           "",
      dimensions:           "",
      frameVeneerColor:     "",
      sashVeneerColor:      "",
      coreSealFrame:        "",
      coreSealSash:         "",
      thresholdType:        "",
      weldingType:          "",
      glazing:              "",
      glassHold:            "",
      sashType:             "",
      fitting:              "",
      fittingType:          "",
      handleTypeInner:      "",
      handleColorInner:     "",
      handleColorOuter:     "",
      UwCoefficient:        "",
      weightUnit:           "",
      perimeter:            "",
      accessories:          [],
      fillings:             [],
      createdAt:            serverTimestamp(),
      updatedAt:            serverTimestamp(),
    });
    // Jump into the full‐blown edit page:
    navigate(`/products/${newRef.id}/edit`, {
      state: { returnTo: "/admin/catalog" },
    });
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Produkt löschen?")) return;
    await deleteDoc(doc(db, "products", id));
  };

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="admin-catalog-editor">
      <h1>Admin: Global Catalog Editor</h1>

      {/* ─── CATEGORY SECTION ──────────────────────────────── */}
      <section className="cats-section">
        <h2>Kategorien verwalten</h2>
        <div className="form-row">
          <input
            type="text"
            placeholder="Neue Kategorie"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <button onClick={addCategory}>Hinzufügen</button>
        </div>
        <ul className="cats-list">
          {categories.map((cat) => (
            <li key={cat.id}>
              <input
                type="text"
                value={cat.name}
                onChange={(e) => updateCategory(cat.id, e.target.value)}
              />
              <button onClick={() => deleteCategory(cat.id)}>🗑️</button>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── PRODUCT SECTION ────────────────────────────────── */}
      <section className="prods-section">
        <h2>Produkte verwalten</h2>
        <button className="add-prod-btn" onClick={handleAddProduct}>
          + Neues Produkt
        </button>

        <table className="prods-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Kat.</th>
              <th>Preis (€)</th>
              <th>VAT (%)</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const catName =
                categories.find((c) => c.id === p.categoryId)?.name || "—";
              return (
                <tr key={p.id}>
                  <td>{p.productName || "(kein Name)"}</td>
                  <td>{catName}</td>
                  <td>{Number(p.unitPrice ?? 0).toFixed(2)}</td>
                  <td>{p.vat ?? "-"}</td>
                  <td>
                    <button
                      onClick={() =>
                        navigate(`/products/${p.id}/edit`, {
                          state: { returnTo: "/admin/catalog" },
                        })
                      }
                    >
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDeleteProduct(p.id)}>
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
