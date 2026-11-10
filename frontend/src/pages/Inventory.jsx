import { useEffect, useState } from 'react';
import client from '../api/client';

const EMPTY = {
  crop_name: '', crop_category: 'coffee',
  quantity_available: '', price_per_kg: '',
  quality_grade: 'A', location: '',
};

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const { data } = await client.get('/listings/my_listings/');
    setItems(data);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editId) await client.patch(`/listings/${editId}/`, form);
      else await client.post('/listings/', form);
      setForm(EMPTY); setEditId(null); load();
    } catch (err) {
      setError(JSON.stringify(err.response?.data || 'Error saving listing.'));
    }
  };

  const edit = (item) => {
    setEditId(item.id);
    setForm({
      crop_name: item.crop_name, crop_category: item.crop_category,
      quantity_available: item.quantity_available, price_per_kg: item.price_per_kg,
      quality_grade: item.quality_grade, location: item.location,
    });
  };

  const remove = async (id) => {
    if (!confirm('Delete this listing?')) return;
    await client.delete(`/listings/${id}/`); load();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory Management</h1>
      {error && <div className="card text-red-600 text-sm">{error}</div>}

      <form onSubmit={submit} className="card grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="input md:col-span-2" placeholder="Crop name"
          value={form.crop_name} onChange={set('crop_name')} required />
        <select className="input" value={form.crop_category} onChange={set('crop_category')}>
          <option value="coffee">Coffee</option>
          <option value="tea">Tea</option>
          <option value="horticulture">Horticulture</option>
          <option value="pyrethrum">Pyrethrum</option>
        </select>
        <input className="input" type="number" placeholder="Quantity (KG)"
          value={form.quantity_available} onChange={set('quantity_available')} required />
        <input className="input" type="number" placeholder="Price/kg (RWF)"
          value={form.price_per_kg} onChange={set('price_per_kg')} required />
        <select className="input" value={form.quality_grade} onChange={set('quality_grade')}>
          <option value="A">Grade A</option>
          <option value="B">Grade B</option>
          <option value="C">Grade C</option>
        </select>
        <input className="input md:col-span-2" placeholder="Location"
          value={form.location} onChange={set('location')} />
        <button className="btn-primary">{editId ? 'Update Listing' : 'Add Listing'}</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <div key={p.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{p.crop_name}</h3>
                <p className="text-xs text-gray-500 uppercase">
                  {p.crop_category} · Grade {p.quality_grade}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {p.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm mt-2">
              {Number(p.quantity_available).toLocaleString()} KG ·{' '}
              RWF {Number(p.price_per_kg).toLocaleString()}/kg
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => edit(p)} className="btn-secondary flex-1 text-sm">Edit</button>
              <button onClick={() => remove(p.id)}
                className="bg-red-50 text-red-600 px-3 rounded-lg text-sm hover:bg-red-100 transition">
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-gray-500 col-span-full">No listings yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}