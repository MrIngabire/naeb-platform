import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Users() {
  const [users, setUsers] = useState([]);
  const load = () =>
    client.get('/users/').then(({ data }) => setUsers(data.results || data));
  useEffect(() => { load(); }, []);

  const verify = async (id) => {
    await client.post(`/users/${id}/verify/`);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left border-b text-gray-500">
            <tr>
              <th className="py-2">Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Region</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2 font-medium">{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{u.role}</span>
                </td>
                <td>{u.location_region || '—'}</td>
                <td>
                  {u.is_verified
                    ? <span className="text-green-600">✓ Verified</span>
                    : <span className="text-yellow-600">Pending</span>}
                </td>
                <td>
                  {!u.is_verified && (
                    <button onClick={() => verify(u.id)}
                      className="text-xs bg-brand-100 text-brand-700 px-3 py-1 rounded-lg hover:bg-brand-500 hover:text-white transition">
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}