import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Reports() {
  const [data, setData] = useState({ count: 0, total_amount: 0, orders: [] });
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  const load = async () => {
    const params = {};
    if (status) params.status = status;
    if (category) params.category = category;
    const { data } = await client.get('/reports/', { params });
    setData(data);
  };
  useEffect(() => { load(); }, [status, category]);

  const exportCSV = () => {
    const rows = [['Contract', 'Product', 'Buyer', 'Qty', 'Total', 'Status', 'Date']];
    data.orders.forEach((o) => rows.push([
      o.contract_reference, o.product_name, o.buyer_name,
      o.quantity_ordered, o.total_amount, o.delivery_status, o.created_at,
    ]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `naeb-report-${Date.now()}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Supply Chain Reports</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary">⬇ Export CSV</button>
          <button onClick={() => window.print()} className="btn-secondary">🖨 Print PDF</button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select className="input max-w-xs" value={status}
          onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Deliveries</option>
          <option>Pending Transport</option>
          <option>In Transit</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
        <select className="input max-w-xs" value={category}
          onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="coffee">Coffee</option>
          <option value="tea">Tea</option>
          <option value="horticulture">Horticulture</option>
          <option value="pyrethrum">Pyrethrum</option>
        </select>
        <div className="ml-auto card !py-3 flex items-center gap-6">
          <div>
            <p className="text-xs text-gray-500">Orders</p>
            <p className="font-bold">{data.count}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Value</p>
            <p className="font-bold">RWF {Number(data.total_amount).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left border-b text-gray-500">
            <tr>
              <th className="py-2">Contract / Date</th>
              <th>Buyer</th>
              <th>Produce</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.orders.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="py-2">
                  <p className="font-mono text-xs">{o.contract_reference}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </td>
                <td>{o.buyer_name}</td>
                <td>{Number(o.quantity_ordered).toLocaleString()} KG {o.product_name}</td>
                <td>RWF {Number(o.total_amount).toLocaleString()}</td>
                <td>
                  <span className="px-2 py-1 rounded text-xs bg-gray-100">
                    {o.delivery_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}