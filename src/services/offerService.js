// src/services/offerService.js

import { db } from "./firebase";
import {
  doc,
  addDoc,
  getDoc,
  updateDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// Reference to your “offers” collection
const offersCol = collection(db, "offers");

/**
 * Save or update a draft (with status: "draft").
 * If existingId is provided, updates that document; otherwise creates a new one.
 * Returns the document ID.
 */
export async function saveDraft(offerData, existingId = null) {
  try {
    const dataToSave = {
      ...offerData,
      status: "draft",
      updatedAt: serverTimestamp(),
    };

    if (existingId) {
      const docRef = doc(db, "offers", existingId);
      await updateDoc(docRef, dataToSave);
      return existingId;
    } else {
      const docRef = await addDoc(offersCol, dataToSave);
      return docRef.id;
    }
  } catch (err) {
    console.error("Error saving draft:", err);
    throw err;
  }
}

/**
 * Mark an offer as “submitted” in Firestore.
 * Does NOT upload any PDF anywhere yet; simply updates status & metadata.
 * offerData should include all fields you want to store (customer, items, totals, etc.).
 */
export async function submitOfferMetadata(offerId, offerData) {
  try {
    const docRef = doc(db, "offers", offerId);
    await updateDoc(docRef, {
      ...offerData,
      status: "submitted",
      submittedAt: serverTimestamp(),
      pdfUrl: null, // placeholder until you implement Storage upload later
    });
  } catch (err) {
    console.error("Error marking offer submitted:", err);
    throw err;
  }
}

/**
 * Fetch one draft or submitted offer by ID.
 * Returns an object { id, ...fields } or null if not found.
 */
export async function getDraftById(offerId) {
  try {
    const docRef = doc(db, "offers", offerId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return { id: snap.id, ...data };
  } catch (err) {
    console.error("Error fetching draft:", err);
    throw err;
  }
}

/**
 * List all drafts (documents where status === "draft").
 * Returns an array of { id, ...fields } for each matching document.
 */
export async function listAllDrafts() {
  try {
    const q = query(offersCol, where("status", "==", "draft"));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (err) {
    console.error("Error listing drafts:", err);
    throw err;
  }
}
