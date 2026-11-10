import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  Delivered: 'bg-green-100 text-green-700',
  'In Transit': 'bg-yellow-100 text-yellow-700',
  'Pending Transport': 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-red-100 text-red-700',
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  const load = async () => {
    const { data } = await client.get('/orders/');
    setOrders(data.results || data);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await client.patch(`/orders/${id}/update_status/`, { delivery_status: status });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        {user.role === 'BUYER' ? 'My Orders' : 'Orders'}
      </h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left border-b text-gray-500">
            <tr>
              <th className="py-2">Contract</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Buyer</th>
              <th>Status</th>
              {user.role === 'ADMIN' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b hover:bg-gray-50">
                <td className="py-2 font-mono text-xs">{o.contract_reference}</td>
                <td>{o.product_name}</td>
                <td>{Number(o.quantity_ordered).toLocaleString()} KG</td>
                <td>RWF {Number(o.total_amount).toLocaleString()}</td>
                <td>{o.buyer_name}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    STATUS_COLORS[o.delivery_status] ?? 'bg-gray-100'
                  }`}>{o.delivery_status}</span>
                </td>
                {user.role === 'ADMIN' && (
                  <td>
                    <select className="input !py-1 !text-xs" value={o.delivery_status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}>
                      <option>Pending Transport</option>
                      <option>In Transit</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="text-gray-500 py-4">No orders yet.</p>}
      </div>
    </div>
  );
}