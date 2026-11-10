import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Contracts() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    client.get('/orders/').then(({ data }) => setOrders(data.results || data));
  }, []);

  const download = (o) => {
    const text = `NAEB DIGITAL CONTRACT\n=====================\nContract: ${o.contract_reference}\nProduct: ${o.product_name}\nFarmer: ${o.farmer_name}\nBuyer: ${o.buyer_name}\nQuantity: ${o.quantity_ordered} KG\nTotal: RWF ${o.total_amount}\nStatus: ${o.delivery_status}\nDate: ${o.created_at}\n`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${o.contract_reference}.txt`; a.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Digital Contracts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((o) => (
          <div key={o.id} className="card">
            <div className="flex justify-between">
              <p className="font-mono text-sm">{o.contract_reference}</p>
              <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded">
                {o.delivery_status}
              </span>
            </div>
            <h3 className="font-semibold mt-2">{o.product_name}</h3>
            <p className="text-sm text-gray-500">Farmer: {o.farmer_name}</p>
            <p className="text-sm">
              {Number(o.quantity_ordered).toLocaleString()} KG ·{' '}
              RWF {Number(o.total_amount).toLocaleString()}
            </p>
            <button onClick={() => download(o)} className="btn-secondary w-full mt-3 text-sm">
              ⬇ Download Contract
            </button>
          </div>
        ))}
        {orders.length === 0 && <p className="text-gray-500">No contracts yet.</p>}
      </div>
    </div>
  );
}