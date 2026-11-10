import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import client from '../api/client';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await client.get('/dashboard/stats/');
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;
  if (!stats) return <div className="text-gray-500">No data available.</div>;

  const verify = async (id) => {
    await client.post(`/users/${id}/verify/`);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total Processed Orders" value={stats.total_orders} icon="📦" accent="blue" />
        <StatCard label="Active Product Listings" value={stats.active_listings} icon="🌿" accent="green" />
        <StatCard label="Total Transaction Volume"
          value={`RWF ${Number(stats.total_volume).toLocaleString()}`} icon="💵" accent="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-4">Supply Trends by Category</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="crop_category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="volume" fill="#15803d" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">
            Pending Verifications ({stats.pending_verifications})
          </h2>
          {stats.pending_users.length === 0 && (
            <p className="text-gray-500 text-sm">No pending users.</p>
          )}
          <div className="space-y-2">
            {stats.pending_users.map((u) => (
              <div key={u.id} className="flex items-center justify-between border-b last:border-0 py-2">
                <div>
                  <p className="font-medium">{u.username}</p>
                  <p className="text-xs text-gray-500">{u.role}</p>
                </div>
                <button onClick={() => verify(u.id)}
                  className="text-sm bg-brand-100 text-brand-700 px-3 py-1 rounded-lg hover:bg-brand-500 hover:text-white transition">
                  Verify
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {user.role === 'ADMIN' && (
        <div className="text-sm text-gray-500">
          Logged in as NAEB Official. Welcome, {user.username}.
        </div>
      )}
    </div>
  );
}