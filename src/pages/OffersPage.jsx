// src/pages/OffersPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../services/firebase";
import NavBar from "../components/NavBar";

import "../assets/styles/pages/_offersPage.scss";

export default function OffersPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1) Redirect to /login if no user
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
  }, [currentUser, navigate]);

  // 2) Subscribe to Firestore: users/{uid}/offers
  useEffect(() => {
    if (!currentUser) return;

    const offersColRef = collection(db, "users", currentUser.uid, "offers");
    const q = query(offersColRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const arr = [];
        snapshot.forEach((docSnap) => {
          arr.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });
        setOffers(arr);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching offers:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // 3) Create a brand-new “draft” offer and navigate to edit
  const handleAddNewOffer = () => {
    // We assume that your OfferFormPage handles "no offerId" => create new
    navigate("/offers/new");
  };

  // 4) Edit an existing offer
  const handleEditOffer = (offerId) => {
    navigate(`/offers/${offerId}/edit`);
  };

  // 5) View PDF of existing offer (you must have a <OfferPdfViewPage /> route)
  const handleViewOfferPdf = (offerId) => {
    navigate(`/offers/${offerId}/view`);
  };

  // 6) Delete an existing offer
  const handleDeleteOffer = async (offer) => {
    const confirmDelete = window.confirm(
      `Möchtest du Angebot "${offer.offerNumber}" wirklich löschen?`
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(
        doc(db, "users", currentUser.uid, "offers", offer.id)
      );
    } catch (err) {
      console.error("Error deleting offer:", err);
      alert("Konnte Angebot nicht löschen.");
    }
  };

  if (loading) {
    return (
      <div className="offers-page">
        <NavBar />
        <p>Lade Angebote…</p>
      </div>
    );
  }

  return (
    <div className="offers-page">
      <NavBar />
      <div className="offers-header">
        <h2>Meine Angebote</h2>
        <button className="btn-add-offer" onClick={handleAddNewOffer}>
          + Neues Angebot
        </button>
      </div>

      {offers.length === 0 ? (
        <p className="no-offers">Du hast noch keine Angebote. Erstelle eines!</p>
      ) : (
        <table className="offers-table">
          <thead>
            <tr>
              <th>Angebot Nr.</th>
              <th>Datum</th>
              <th>Status</th>
              <th>Kunde</th>
              <th>Gesamt (€)</th>
              <th>Erstellt am</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((ofr) => {
              // Format Firestore Timestamp fields to readable strings:
              const createdAtDate = ofr.createdAt
                ? new Date(ofr.createdAt.toMillis())
                : null;
              const offerDate = ofr.offerDate
                ? new Date(ofr.offerDate.toMillis())
                : null;

              return (
                <tr key={ofr.id}>
                  <td>{ofr.offerNumber || <em>(kein Nr.)</em>}</td>
                  <td>
                    {offerDate
                      ? offerDate.toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td>{ofr.status || "draft"}</td>
                  <td>{ofr.customerName || "-"}</td>
                  <td>
                    {ofr.totalAmount !== undefined
                      ? Number(ofr.totalAmount).toFixed(2)
                      : "-"}
                  </td>
                  <td>
                    {createdAtDate
                      ? createdAtDate.toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="actions-cell">
                    <button
                      className="icon-button edit-offer"
                      title="Angebot bearbeiten"
                      onClick={() => handleEditOffer(ofr.id)}
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-button view-offer"
                      title="PDF anzeigen"
                      onClick={() => handleViewOfferPdf(ofr.id)}
                    >
                      📄
                    </button>
                    <button
                      className="icon-button delete-offer"
                      title="Angebot löschen"
                      onClick={() => handleDeleteOffer(ofr)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
