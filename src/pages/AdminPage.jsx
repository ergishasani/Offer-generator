// src/pages/AdminPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  doc
} from "firebase/firestore";
import { db } from "../services/firebase";
import RequireAdmin from "../components/RequireAdmin";
import NavBar from "../components/NavBar";
import "../assets/styles/pages/AdminPage.scss"

export default function AdminPage() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for adding a new product
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newVat, setNewVat] = useState(19);

  useEffect(() => {
    if (!currentUser) return;
    const q = collection(db, "products");
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((s) => arr.push({ id: s.id, ...s.data() }));
      setProducts(arr);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addDoc(collection(db, "products"), {
      name: newName.trim(),
      unitPrice: parseFloat(newPrice) || 0,
      vat: parseFloat(newVat) || 0,
    });
    setNewName("");
    setNewPrice("");
    setNewVat(19);
  };

  const handleUpdate = async (id, field, value) => {
    const ref = doc(db, "products", id);
    await updateDoc(ref, { [field]: value });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Really delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
  };

  if (loading) return <p>Loading…</p>;

  return (
    <RequireAdmin>
      <div className="admin-page">
        <NavBar />

        <h2>Admin: Global Products</h2>
        <div className="add-form">
          <input
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            placeholder="Unit Price"
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
          />
          <input
            placeholder="VAT %"
            type="number"
            value={newVat}
            onChange={(e) => setNewVat(e.target.value)}
          />
          <button onClick={handleAdd}>+ Add Product</button>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit Price</th>
              <th>VAT %</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    value={p.name}
                    onChange={(e) => handleUpdate(p.id, "name", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={p.unitPrice}
                    onChange={(e) =>
                      handleUpdate(p.id, "unitPrice", parseFloat(e.target.value))
                    }
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={p.vat}
                    onChange={(e) =>
                      handleUpdate(p.id, "vat", parseFloat(e.target.value))
                    }
                  />
                </td>
                <td>
                  <button onClick={() => handleDelete(p.id)}>🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RequireAdmin>
  );
}
