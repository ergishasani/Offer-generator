// src/services/offerService.js
import { db } from "./firebase";
import {
  doc,
  addDoc,
  getDoc,
  updateDoc,
  collection,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

// Reference to your “offers” collection
const offersCol = collection(db, "offers");

/**
 * Save or update a draft (status: "draft"). Returns the document ID.
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
 */
export async function submitOfferMetadata(offerId, offerData) {
  try {
    const docRef = doc(db, "offers", offerId);
    await updateDoc(docRef, {
      ...offerData,
      status: "submitted",
      submittedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Error marking offer submitted:", err);
    throw err;
  }
}

/**
 * Fetch a single draft/offer by ID.
 * Returns { id, ...data } or null if not found.
 */
export async function getDraftById(offerId) {
  try {
    const docRef = doc(db, "offers", offerId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error("Error fetching draft:", err);
    throw err;
  }
}

/**
 * List all drafts (or all offers). Returns an array of { id, ...data }.
 */
export async function listAllDrafts() {
  try {
    const querySnapshot = await getDocs(offersCol);
    const results = [];
    querySnapshot.forEach((docSnap) => {
      results.push({ id: docSnap.id, ...docSnap.data() });
    });
    return results;
  } catch (err) {
    console.error("Error listing all drafts:", err);
    throw err;
  }
}
