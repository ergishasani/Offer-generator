// src/pages/ProductsPage.jsx
// ──────────────────────────────────────────────────────────────────────────────
// Lists all catalog‐products under Firestore path: users/{uid}/products.
// Fixes the “toFixed is not a function” by casting unitPrice to Number.

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";
import NavBar from "../components/NavBar";

import "../assets/styles/pages/_productsPage.scss";

export default function ProductsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ────────────────────────────────────────────────────────────────────────────
  // 1) Listen to Firestore collection: users/{uid}/products
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      // If not logged in, redirect to /login
      navigate("/login");
      return;
    }

    const productsColRef = collection(
      db,
      "users",
      currentUser.uid,
      "products"
    );
    const unsubscribe = onSnapshot(
      productsColRef,
      (snapshot) => {
        const arr = [];
        snapshot.forEach((docSnap) => {
          arr.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });
        // Optionally sort by createdAt timestamp (descending)
        arr.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          return 0;
        });
        setProducts(arr);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, navigate]);

  // ────────────────────────────────────────────────────────────────────────────
  // Create a brand‐new blank product document, then navigate to edit it
  // ────────────────────────────────────────────────────────────────────────────
  const handleAddProduct = async () => {
    if (!currentUser) return;
    try {
      const productsColRef = collection(
        db,
        "users",
        currentUser.uid,
        "products"
      );
      // Create with default/empty fields
      const newDocRef = await addDoc(productsColRef, {
        productName: "",
        quantity: 1,
        unit: "Stk",
        // IMPORTANT: Firestore will store this as a number if you pass a JS number here.
        unitPrice: 0.0,
        vat: 19,
        discount: 0,
        frameType: "",
        outerColor: "",
        innerColor: "",
        dimensions: "",
        frameVeneerColor: "",
        sashVeneerColor: "",
        coreSealFrame: "",
        coreSealSash: "",
        thresholdType: "",
        weldingType: "",
        glazing: "",
        glassHold: "",
        sashType: "",
        fitting: "",
        fittingType: "",
        handleTypeInner: "",
        handleColorInner: "",
        handleColorOuter: "",
        UwCoefficient: "",
        weightUnit: "",
        perimeter: "",
        accessories: [],
        fillings: [],
        createdAt: serverTimestamp(),
      });
      navigate(`/products/${newDocRef.id}/edit`);
    } catch (err) {
      console.error("Error adding product:", err);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Delete an existing product
  // ────────────────────────────────────────────────────────────────────────────
  const handleDelete = async (prodId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(
        doc(db, "users", currentUser.uid, "products", prodId)
      );
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="products-page">
        <NavBar />
        <p>Loading catalog products…</p>
      </div>
    );
  }

  return (
    <div className="products-page">
      <NavBar />
      <div className="header">
        <h2>Your Product Catalog</h2>
        <button className="btn-add" onClick={handleAddProduct}>
          + Add New Product
        </button>
      </div>

      {products.length === 0 ? (
        <p>No products found. Click “Add New Product” to create one.</p>
      ) : (
        <table className="products-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit Price (€)</th>
              <th>VAT (%)</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.productName || <em>(no name)</em>}</td>

                {/* Cast unitPrice to Number before calling .toFixed(2) */}
                <td>{Number(p.unitPrice || 0).toFixed(2)}</td>
                <td>{p.vat ?? "-"}</td>
                <td>
                  {p.createdAt
                    ? new Date(p.createdAt.toMillis()).toLocaleDateString(
                        "de-DE",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }
                      )
                    : "-"}
                </td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => navigate(`/products/${p.id}/edit`)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(p.id)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
