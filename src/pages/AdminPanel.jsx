// src/pages/AdminPanel.jsx
import React, { useEffect, useState } from 'react';
import { listAllDrafts } from '../services/offerService';
import { Link } from 'react-router-dom';

export default function AdminPanel() {
  const [stats, setStats] = useState({ total: 0, drafts: 0 });

  useEffect(() => {
    listAllDrafts().then(all => {
      setStats({
        total: all.length,
        drafts: all.filter(o => o.status === 'draft').length,
      });
    });
  }, []);

  return (
    <div className="admin-panel">
      <h1>Admin Dashboard</h1>
      <div className="stats">
        <div>
          <h3>Total Offers</h3>
          <p>{stats.total}</p>
        </div>
        <div>
          <h3>Pending Drafts</h3>
          <p>{stats.drafts}</p>
        </div>
      </div>

      <nav className="admin-nav">
        <Link to="/admin/offers">Manage Offers</Link>
        <Link to="/admin/users">Manage Users</Link>
      </nav>
    </div>
  );
}
