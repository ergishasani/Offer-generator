// src/pages/AdminOffersPage.jsx
import React, { useEffect, useState } from "react";
import { listAllDrafts } from "../services/offerService";
import "../assets/styles/pages/_adminOffersPage.scss";

const AdminOffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOffers() {
      try {
        const all = await listAllDrafts();
        setOffers(all);
      } catch (err) {
        console.error("Error loading offers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, []);

  if (loading) {
    return <p>Loading offers…</p>;
  }

  return (
    <div className="admin-offers-page">
      <h1>All Offers / Drafts</h1>
      {offers.length === 0 ? (
        <p>No offers found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Offer ID</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td>{offer.id}</td>
                <td>{offer.status ?? "―"}</td>
                <td>
                  {offer.createdAt?.toDate
                    ? offer.createdAt.toDate().toLocaleString()
                    : "―"}
                </td>
                <td>
                  <a href={`/offer/${offer.id}`}>Edit / View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminOffersPage;
