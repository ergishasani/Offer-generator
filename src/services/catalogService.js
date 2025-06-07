// src/services/catalogService.js
import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
} from "firebase/firestore";

const catalogCol = collection(db, "products");

/** List all catalog products */
export async function listCatalog() {
  const snap = await getDocs(catalogCol);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Fetch one product by ID */
export async function getCatalogProduct(id) {
  const ref = doc(db, "products", id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Add a new catalog product */
export async function addCatalogProduct(data) {
  const docRef = await addDoc(catalogCol, data);
  return docRef.id;
}

/** Update an existing catalog product */
export async function updateCatalogProduct(id, data) {
  const ref = doc(db, "products", id);
  await updateDoc(ref, data);
}

/** Delete a catalog product */
export async function deleteCatalogProduct(id) {
  const ref = doc(db, "products", id);
  await deleteDoc(ref);
}
