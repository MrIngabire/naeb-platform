import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '',
    role: 'FARMER', phone_number: '', location_region: '',
  });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setError(''); setMsg('');
    try {
      await register(form);
      setMsg('Account created. Await NAEB verification before login.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(JSON.stringify(err.response?.data || 'Registration failed.'));
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 py-8">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{msg}</div>}
        <form onSubmit={submit} className="space-y-3">
          <input className="input" placeholder="Username" onChange={set('username')} required />
          <input className="input" type="email" placeholder="Email" onChange={set('email')} required />
          <input className="input" type="password" placeholder="Password (min 6)" onChange={set('password')} required />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="First name" onChange={set('first_name')} />
            <input className="input" placeholder="Last name" onChange={set('last_name')} />
          </div>
          <select className="input" value={form.role} onChange={set('role')}>
            <option value="FARMER">Farmer / Cooperative</option>
            <option value="BUYER">Buyer (Wholesaler/Exporter)</option>
          </select>
          <input className="input" placeholder="Phone number" onChange={set('phone_number')} />
          <input className="input" placeholder="Location / Region" onChange={set('location_region')} />
          <button className="btn-primary w-full">Register</button>
        </form>
        <p className="text-sm text-center mt-4">
          <Link to="/login" className="text-brand-700 font-medium hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}