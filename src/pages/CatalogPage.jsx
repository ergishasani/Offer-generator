// src/pages/CatalogPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";             // ← import useNavigate
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";

import "../assets/styles/pages/_catalogPage.scss";

export default function CatalogPage() {
  const navigate = useNavigate();                            // ← initialize navigate
  const [user, setUser] = useState(null);

  // Global (admin) data:
  const [globalCategories, setGlobalCategories] = useState([]);
  const [globalProducts, setGlobalProducts] = useState([]);

  // User‐specific data:
  const [userCategories, setUserCategories] = useState([]);
  const [userProducts, setUserProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // 1) Watch for authenticated user
  // --------------------------------------------------
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
    });
    return () => unsubscribeAuth();
  }, []);

  // --------------------------------------------------
  // 2) Subscribe to Firestore collections
  // --------------------------------------------------
  useEffect(() => {
    let unsubGlobalCats = () => {};
    let unsubGlobalProds = () => {};
    let unsubUserCats = () => {};
    let unsubUserProds = () => {};

    // 2a) Global categories & products (always)
    const qGlobalCats = query(
      collection(db, "categories"),
      orderBy("name", "asc")
    );
    unsubGlobalCats = onSnapshot(qGlobalCats, (snap) => {
      const arr = [];
      snap.forEach((docSnap) => {
        arr.push({
          id: docSnap.id,
          ...docSnap.data(),
          isUserOnly: false,
        });
      });
      setGlobalCategories(arr);
      setLoading(false);
    });

    const qGlobalProds = query(
      collection(db, "products"),
      orderBy("productName", "asc")
    );
    unsubGlobalProds = onSnapshot(qGlobalProds, (snap) => {
      const arr = [];
      snap.forEach((docSnap) => {
        arr.push({
          id: docSnap.id,
          ...docSnap.data(),
          isUserOnly: false,
        });
      });
      setGlobalProducts(arr);
      setLoading(false);
    });

    // 2b) User categories & products (only if logged in)
    if (user && user.uid) {
      const userCatsRef = query(
        collection(db, "users", user.uid, "categories"),
        orderBy("name", "asc")
      );
      unsubUserCats = onSnapshot(userCatsRef, (snap) => {
        const arr = [];
        snap.forEach((docSnap) => {
          arr.push({
            id: docSnap.id,
            ...docSnap.data(),
            isUserOnly: true,
          });
        });
        setUserCategories(arr);
        setLoading(false);
      });

      const userProdsRef = query(
        collection(db, "users", user.uid, "products"),
        orderBy("productName", "asc")
      );
      unsubUserProds = onSnapshot(userProdsRef, (snap) => {
        const arr = [];
        snap.forEach((docSnap) => {
          arr.push({
            id: docSnap.id,
            ...docSnap.data(),
            isUserOnly: true,
          });
        });
        setUserProducts(arr);
        setLoading(false);
      });
    } else {
      // If no user, clear user‐specific arrays
      setUserCategories([]);
      setUserProducts([]);
    }

    return () => {
      unsubGlobalCats();
      unsubGlobalProds();
      unsubUserCats();
      unsubUserProds();
    };
  }, [user]);

  // --------------------------------------------------
  // 3) Merge global + user lists
  // --------------------------------------------------
  const allCategories = [...globalCategories, ...userCategories];
  const allProducts = [...globalProducts, ...userProducts];

  // --------------------------------------------------
  // 4) Group products by “categoryId” field
  // --------------------------------------------------
  const productsByCategory = {};
  allProducts.forEach((prod) => {
    const catId = prod.categoryId || "_uncategorized"; // ← use categoryId
    if (!productsByCategory[catId]) {
      productsByCategory[catId] = [];
    }
    productsByCategory[catId].push(prod);
  });

  // --------------------------------------------------
  // 5) Category Handlers
  // --------------------------------------------------

  const handleAddCategory = async () => {
    if (!user) {
      alert("Bitte melden Sie sich an, um eine Kategorie hinzuzufügen.");
      return;
    }
    const name = window.prompt("Name der neuen Kategorie:");
    if (!name || !name.trim()) return;
    try {
      await addDoc(collection(db, "users", user.uid, "categories"), {
        name: name.trim(),
      });
    } catch (err) {
      console.error("Fehler beim Hinzufügen der Kategorie:", err);
      alert("Konnte die Kategorie nicht hinzufügen.");
    }
  };

  const handleEditCategory = async (cat) => {
    if (!user || !cat.isUserOnly) {
      alert("Nur benutzerdefinierte Kategorien können bearbeitet werden.");
      return;
    }
    const newName = window.prompt("Neue Bezeichnung für Kategorie:", cat.name);
    if (!newName || !newName.trim()) return;
    try {
      const catRef = doc(db, "users", user.uid, "categories", cat.id);
      await updateDoc(catRef, { name: newName.trim() });
    } catch (err) {
      console.error("Fehler beim Bearbeiten der Kategorie:", err);
      alert("Konnte die Kategorie nicht bearbeiten.");
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!user || !cat.isUserOnly) {
      alert("Nur benutzerdefinierte Kategorien können gelöscht werden.");
      return;
    }
    const confirmDelete = window.confirm(
      `Kategorie "${cat.name}" wirklich löschen? Alle darin enthaltenen Benutzerprodukte werden ebenfalls gelöscht.`
    );
    if (!confirmDelete) return;

    try {
      // Lösche alle Benutzer‐Produkte in dieser Kategorie:
      await Promise.all(
        userProducts
          .filter((prod) => prod.categoryId === cat.id)
          .map((prod) =>
            deleteDoc(doc(db, "users", user.uid, "products", prod.id))
          )
      );
      // Lösch die Kategorie selbst:
      await deleteDoc(doc(db, "users", user.uid, "categories", cat.id));
    } catch (err) {
      console.error("Fehler beim Löschen der Kategorie:", err);
      alert("Konnte die Kategorie nicht löschen.");
    }
  };

  // --------------------------------------------------
  // 6) Product Handlers
  // --------------------------------------------------

  // ← REPLACE prompt logic with a Router navigate to ProductEditPage:
  const handleEditProduct = (prod) => {
    if (!user || !prod.isUserOnly) {
      alert(
        `Das Produkt "${prod.productName}" stammt aus der globalen Datenbank und kann hier nicht bearbeitet werden.`
      );
      return;
    }
    // Einfach zur Edit‐Seite weiterleiten:
    navigate(`/products/${prod.id}/edit`);
  };

  const handleDeleteProduct = async (prod) => {
    if (!user || !prod.isUserOnly) {
      alert("Nur benutzerdefinierte Produkte können gelöscht werden.");
      return;
    }
    const confirmDelete = window.confirm(
      `Produkt "${prod.productName}" wirklich löschen?`
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "products", prod.id));
    } catch (err) {
      console.error("Fehler beim Löschen des Produkts:", err);
      alert("Konnte das Produkt nicht löschen.");
    }
  };

  if (loading) {
    return (
      <div className="catalog-page">
        <p>Lade Katalog…</p>
      </div>
    );
  }

  return (
    <div className="catalog-page">
      <h2>Produktkatalog</h2>

      {/* + Kategorie‐Button nur anzeigen, wenn eingeloggt */}
      {user && (
        <button className="btn-add-category" onClick={handleAddCategory}>
          + Kategorie hinzufügen
        </button>
      )}

      {allCategories.length === 0 ? (
        <p className="empty-msg">
          Keine Kategorien vorhanden.
          {!user &&
            " Melden Sie sich an, um eigene Kategorien/Produkte hinzuzufügen."}
        </p>
      ) : (
        <div className="categories-container">
          {allCategories.map((cat) => (
            <div
              className={`category-card ${
                cat.isUserOnly ? "user-category" : "global-category"
              }`}
              key={cat.id}
            >
              <div className="category-header">
                <h3 className="category-name">{cat.name}</h3>
                {cat.isUserOnly && (
                  <div className="category-actions">
                    <button
                      className="icon-button edit-cat"
                      title="Kategorie bearbeiten"
                      onClick={() => handleEditCategory(cat)}
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-button delete-cat"
                      title="Kategorie löschen"
                      onClick={() => handleDeleteCategory(cat)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              <div className="products-list">
                {productsByCategory[cat.id] &&
                productsByCategory[cat.id].length > 0 ? (
                  productsByCategory[cat.id].map((prod) => (
                    <div className="product-card" key={prod.id}>
                      <div className="product-info">
                        <div className="prod-name">
                          {prod.productName || <em>(kein Name)</em>}
                        </div>
                        <div className="prod-meta">
                          <span>
                            Preis:
                            {Number(prod.unitPrice || 0).toFixed(2)} €
                          </span>
                          <span>USt.: {prod.vat || 0}%</span>
                        </div>
                      </div>
                      <div className="product-actions">
                        <button
                          className="icon-button edit-prod"
                          title="Produkt bearbeiten"
                          onClick={() => handleEditProduct(prod)}
                        >
                          ✏️
                        </button>
                        {prod.isUserOnly && (
                          <button
                            className="icon-button delete-prod"
                            title="Produkt löschen"
                            onClick={() => handleDeleteProduct(prod)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-products">
                    Keine Produkte in dieser Kategorie.
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* "Ohne Kategorie" falls Produkte ohne categoryId existieren */}
          {productsByCategory["_uncategorized"] &&
            productsByCategory["_uncategorized"].length > 0 && (
              <div className="category-card uncategorized">
                <h3 className="category-name">Ohne Kategorie</h3>
                <div className="products-list">
                  {productsByCategory["_uncategorized"].map((prod) => (
                    <div className="product-card" key={prod.id}>
                      <div className="product-info">
                        <div className="prod-name">{prod.productName}</div>
                        <div className="prod-meta">
                          <span>
                            Preis:
                            {Number(prod.unitPrice || 0).toFixed(2)} €
                          </span>
                          <span>USt.: {prod.vat || 0}%</span>
                        </div>
                      </div>
                      <div className="product-actions">
                        <button
                          className="icon-button edit-prod"
                          title="Produkt bearbeiten"
                          onClick={() => handleEditProduct(prod)}
                        >
                          ✏️
                        </button>
                        {prod.isUserOnly && (
                          <button
                            className="icon-button delete-prod"
                            title="Produkt löschen"
                            onClick={() => handleDeleteProduct(prod)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
