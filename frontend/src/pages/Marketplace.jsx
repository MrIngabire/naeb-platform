import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['', 'coffee', 'tea', 'horticulture', 'pyrethrum'];

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [feedback, setFeedback] = useState('');

  const load = async () => {
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    const { data } = await client.get('/listings/', { params });
    setListings(data.results || data);
  };

  useEffect(() => { load(); }, [search, category]);

  const buy = async () => {
    setFeedback('');
    try {
      const { data } = await client.post('/orders/initiate_order/', {
        product_id: selected.id, quantity: Number(qty),
      });
      setFeedback(`✅ Contract ${data.order.contract_reference} created!`);
      setSelected(null); setQty(1);
      load();
    } catch (err) {
      setFeedback('❌ ' + (err.response?.data?.detail || 'Order failed.'));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Digital Marketplace</h1>

      <div className="flex flex-wrap gap-3 items-center">
        <input className="input max-w-sm" placeholder="Search crops or districts..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              category === c
                ? 'bg-brand-700 text-white'
                : 'bg-white border border-gray-300 hover:bg-gray-50'
            }`}>
            {c ? c[0].toUpperCase() + c.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {feedback && <div className="card text-sm">{feedback}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((p) => (
          <div key={p.id} className="card flex flex-col">
            <div className="text-4xl mb-2">🌾</div>
            <h3 className="font-semibold text-lg">{p.crop_name}</h3>
            <p className="text-sm text-gray-500">{p.farmer_name} · {p.location}</p>
            <div className="flex justify-between mt-4 text-sm">
              <div>
                <p className="text-gray-500">Price/kg</p>
                <p className="font-bold">RWF {Number(p.price_per_kg).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">Available</p>
                <p className="font-bold">{Number(p.quantity_available).toLocaleString()} KG</p>
              </div>
            </div>
            {user.role === 'BUYER' && (
              <button onClick={() => { setSelected(p); setQty(1); }}
                className="btn-primary w-full mt-4">Initiate Purchase</button>
            )}
          </div>
        ))}
        {listings.length === 0 && (
          <p className="text-gray-500 col-span-full">No produce found matching your filters.</p>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-1">Purchase {selected.crop_name}</h2>
            <p className="text-sm text-gray-500 mb-4">
              Max {Number(selected.quantity_available).toLocaleString()} KG available
            </p>
            <label className="block text-sm font-medium mb-1">Quantity (KG)</label>
            <input type="number" min="1" max={Number(selected.quantity_available)}
              className="input mb-4" value={qty} onChange={(e) => setQty(e.target.value)} />
            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm">
              <div className="flex justify-between">
                <span>Unit price</span>
                <span>RWF {Number(selected.price_per_kg).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold mt-1">
                <span>Total</span>
                <span>RWF {(qty * Number(selected.price_per_kg)).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={buy} className="btn-primary flex-1">Confirm Purchase</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}