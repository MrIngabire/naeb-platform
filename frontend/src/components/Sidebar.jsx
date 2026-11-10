import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = {
  ADMIN: [
    { to: '/dashboard',   label: 'Dashboard',   icon: '📊' },
    { to: '/marketplace', label: 'Marketplace', icon: '🛒' },
    { to: '/orders',      label: 'Orders',      icon: '📦' },
    { to: '/reports',     label: 'Reports',     icon: '📈' },
    { to: '/users',       label: 'Users',       icon: '👥' },
  ],
  FARMER: [
    { to: '/dashboard', label: 'Dashboard', icon: '📊' },
    { to: '/inventory', label: 'Inventory', icon: '🌱' },
    { to: '/orders',    label: 'Orders',    icon: '📦' },
  ],
  BUYER: [
    { to: '/dashboard',   label: 'Dashboard', icon: '📊' },
    { to: '/marketplace', label: 'Marketplace', icon: '🛒' },
    { to: '/orders',      label: 'My Orders', icon: '📦' },
    { to: '/contracts',   label: 'Contracts', icon: '📄' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const items = links[user?.role] || [];

  return (
    <aside className="w-64 min-h-screen bg-brand-900 text-white flex flex-col">
      <div className="p-6 border-b border-brand-700">
        <div className="text-2xl font-bold flex items-center gap-2">
          <span>🌿</span> NAEB Portal
        </div>
        <p className="text-xs text-brand-100 mt-1">Farm-to-Market Supply Chain</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map((l) => (
          <NavLink key={l.to} to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg transition ${
                isActive ? 'bg-brand-700 font-semibold' : 'hover:bg-brand-700/50'
              }`}>
            <span>{l.icon}</span><span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-brand-700">
        <p className="text-xs text-brand-100 mb-2">
          {user?.username} · {user?.role}
        </p>
        <button onClick={logout}
          className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg font-medium transition">
          Sign Out
        </button>
      </div>
    </aside>
  );
}