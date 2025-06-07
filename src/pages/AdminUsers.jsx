// src/pages/AdminUsers.jsx
import React, { useEffect, useState } from 'react';
// ← change this import to point at services/firebase
import { auth } from '../services/firebase';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // NOTE: listing Auth users in client is not supported.
    // You’ll need a Cloud Function to fetch `listUsers()` from Firebase Admin SDK.
    // Here’s a placeholder until you wire that up:
    fetch('/.netlify/functions/listUsers')
      .then(r => r.json())
      .then(setUsers)
      .catch(console.error);
  }, []);

  return (
    <div className="admin-users">
      <h1>Manage Users</h1>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>UID</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.uid}>
              <td>{u.email}</td>
              <td>{u.uid}</td>
              <td>{u.customClaims?.admin ? 'Admin' : 'User'}</td>
              <td>
                {/* wire promote/demote calls to your Cloud Function */}
                <button>Toggle Admin</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
