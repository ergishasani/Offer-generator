// src/pages/AdminOffersPage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../assets/styles/pages/_adminOffersPage.scss";
import { listAllDrafts } from "../services/offerService";

const AdminOffersPage = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDrafts() {
      try {
        const allDrafts = await listAllDrafts();
        setDrafts(allDrafts);
      } catch (err) {
        console.error("Error fetching drafts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDrafts();
  }, []);

  if (loading) return <p>Loading drafts…</p>;

  return (
    <div className="admin-offers-page">
      <h1>Saved Drafts</h1>
      {drafts.length === 0 ? (
        <p>No drafts found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Offer ID</th>
              <th>Customer</th>
              <th>Last Saved</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map(draft => (
              <tr key={draft.id}>
                <td>{draft.id}</td>
                <td>{draft.customerName}</td>
                <td>
                  {draft.offerDate
                    ? draft.offerDate.toDate().toLocaleString()
                    : "—"}
                </td>
                <td>
                  <Link to={`/offer/${draft.id}`}>Edit</Link>
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
