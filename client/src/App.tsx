import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { Layout } from './components/Layout.js';
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { Categories } from './pages/Categories.js';
import { Items } from './pages/Items.js';
import { ItemDetail } from './pages/ItemDetail.js';
import { Movements } from './pages/Movements.js';
import { Reorder } from './pages/Reorder.js';
import { Users } from './pages/Users.js';
import { ChangePassword } from './pages/ChangePassword.js';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AuthListener() {
  const { logout } = useAuth();
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      window.location.href = '/login';
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AuthListener />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="categories" element={<Categories />} />
              <Route path="items" element={<Items />} />
              <Route path="items/:id" element={<ItemDetail />} />
              <Route path="reorder" element={<Reorder />} />
              <Route path="movements" element={<Movements />} />
              <Route path="users" element={<Users />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
