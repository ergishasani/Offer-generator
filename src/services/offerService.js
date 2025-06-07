// src/services/offerService.js

import { db, storage } from "./firebase";
import {
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { ref as storageRef, getDownloadURL } from "firebase/storage";

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
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (err) {
    console.error("Error listing all drafts:", err);
    throw err;
  }
}

/**
 * Download the stored PDF for an offer.
 */
export async function downloadOfferPdf(offerId) {
  try {
    // assumes you upload PDFs under storage path `offers/${offerId}.pdf`
    const pdfRef = storageRef(storage, `offers/${offerId}.pdf`);
    const url = await getDownloadURL(pdfRef);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${offerId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("Error downloading offer PDF:", err);
    throw err;
  }
}

/**
 * Resend an offer by hitting your backend/Cloud Function.
 */
export async function resendOffer(offerId) {
  try {
    const res = await fetch(
      `https://us-central1-your-project.cloudfunctions.net/resendOffer`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      }
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend failed: ${body}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Error resending offer:", err);
    throw err;
  }
}

/**
 * Delete an offer document (and any other clean-up you need).
 */
export async function deleteOffer(offerId) {
  try {
    const docRef = doc(db, "offers", offerId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Error deleting offer:", err);
    throw err;
  }
}
