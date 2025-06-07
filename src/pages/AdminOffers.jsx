// src/pages/AdminOffers.jsx
import React, { useEffect, useState } from 'react';
import {
  listAllDrafts,
  downloadOfferPdf,
  resendOffer,
  deleteOffer,
} from '../services/offerService';
import { useNavigate } from 'react-router-dom';

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    listAllDrafts().then(setOffers);
  }, []);

  const refresh = () =>
    listAllDrafts().then(all => setOffers(all));

  const handleDownload = id => downloadOfferPdf(id).catch(() => alert('Download failed'));
  const handleResend   = id =>
    resendOffer(id)
      .then(() => alert('Resent!'))
      .catch(() => alert('Resend failed'));
  const handleDelete   = id => {
    if (!window.confirm('Delete this offer?')) return;
    deleteOffer(id)
      .then(refresh)
      .catch(() => alert('Delete failed'));
  };

  return (
    <div className="admin-offers">
      <h1>Manage Offers</h1>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Client</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {offers.map(o => (
            <tr key={o.id}>
              <td>{o.offerNumber}</td>
              <td>{o.customerName}</td>
              <td>{new Date(o.date).toLocaleDateString()}</td>
              <td>{o.status}</td>
              <td>
                <button onClick={() => navigate(`/offers/${o.id}`)}>Edit</button>
                <button onClick={() => handleDownload(o.id)}>Download PDF</button>
                <button onClick={() => handleResend(o.id)}>Resend Email</button>
                <button onClick={() => handleDelete(o.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
