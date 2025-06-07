// src/pages/ProductsPage.jsx
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

  // user-owned products
  const [products, setProducts] = useState([]);
  // admin/global products
  const [globalProducts, setGlobalProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // 1) subscribe to user's products
    const userCol = collection(db, "users", currentUser.uid, "products");
    const unsubUser = onSnapshot(
      userCol,
      (snap) => {
        const arr = snap.docs.map((d) => ({
          id: d.id,
          isGlobal: false,
          ...d.data(),
        }));
        // sort by createdAt desc
        arr.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
          }
          return 0;
        });
        setProducts(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching user products:", err);
        setLoading(false);
      }
    );

    // 2) subscribe to global catalog
    const globalCol = collection(db, "products");
    const unsubGlobal = onSnapshot(
      globalCol,
      (snap) => {
        const arr = snap.docs.map((d) => ({
          id: d.id,
          isGlobal: true,
          ...d.data(),
        }));
        setGlobalProducts(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching global products:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubUser();
      unsubGlobal();
    };
  }, [currentUser, navigate]);

  // delete user product
  const handleDelete = async (prodId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      await deleteDoc(
        doc(db, "users", currentUser.uid, "products", prodId)
      );
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  // navigate to edit user product
  const handleEdit = (p) => {
    navigate(`/products/${p.id}/edit`);
  };

  // create a new blank user product
  const handleAddProduct = async () => {
    if (!currentUser) return;
    try {
      const ref = collection(db, "users", currentUser.uid, "products");
      const newRef = await addDoc(ref, {
        productName: "",
        quantity: 1,
        unit: "Stk",
        unitPrice: 0.0,
        vat: 19,
        discount: 0,
        createdAt: serverTimestamp(),
      });
      navigate(`/products/${newRef.id}/edit`);
    } catch (err) {
      console.error("Error adding product:", err);
    }
  };

  if (loading) {
    return (
      <div className="products-page">
        <NavBar />
        <p>Loading catalog products…</p>
      </div>
    );
  }

  // merge arrays: show global first, then user-owned
  const allProducts = [...globalProducts, ...products];

  return (
    <div className="products-page">
      <NavBar />
      <div className="header">
        <h2>Product Catalog</h2>
        <button className="btn-add" onClick={handleAddProduct}>
          + Add New Product
        </button>
      </div>

      {allProducts.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <table className="products-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit Price (€)</th>
              <th>VAT (%)</th>
              <th>Source</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allProducts.map((p) => (
              <tr key={p.isGlobal ? `g-${p.id}` : p.id}>
                <td>{p.productName || <em>(no name)</em>}</td>
                <td>{Number(p.unitPrice || 0).toFixed(2)}</td>
                <td>{p.vat ?? "-"}</td>
                <td>{p.isGlobal ? "Global" : "Yours"}</td>
                <td>
                  {p.isGlobal
                    ? "-"
                    : p.createdAt
                    ? new Date(p.createdAt.toMillis()).toLocaleDateString(
                        "de-DE",
                        { year: "numeric", month: "2-digit", day: "2-digit" }
                      )
                    : "-"}
                </td>
                <td>
                  {!p.isGlobal && (
                    <>
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(p)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(p.id)}
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
