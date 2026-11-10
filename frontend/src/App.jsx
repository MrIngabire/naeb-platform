import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Marketplace from './pages/Marketplace';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Contracts from './pages/Contracts';
import Reports from './pages/Reports';
import Users from './pages/Users';

function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">{children}</main>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'FARMER') return <Inventory />;
  return <AdminDashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
          } />
          <Route path="/marketplace" element={
            <ProtectedRoute roles={['ADMIN', 'BUYER']}>
              <Layout><Marketplace /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute roles={['FARMER']}>
              <Layout><Inventory /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>
          } />
          <Route path="/contracts" element={
            <ProtectedRoute roles={['BUYER']}>
              <Layout><Contracts /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute roles={['ADMIN']}>
              <Layout><Reports /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute roles={['ADMIN']}>
              <Layout><Users /></Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}