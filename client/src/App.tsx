import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TransactionProvider } from './context/TransactionContext';
import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Summary from './pages/Summary';
import Profile from './pages/Profile';
import Receipts from './pages/Receipts';
import Login from './pages/Login';
import Signup from './pages/Signup';

// ------------ Auth Context ------------
interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token') && !!localStorage.getItem('user')
  );

  // ✅ Ensure we restore auth on first mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    setIsAuthenticated(!!token && !!user);
  }, []);

  // ✅ Keep auth in sync across tabs
  useEffect(() => {
    const checkAuthState = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      setIsAuthenticated(!!token && !!user);
    };
    window.addEventListener('storage', checkAuthState);
    return () => window.removeEventListener('storage', checkAuthState);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
// ------------ End Auth Context ------------

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Layout>
              <Dashboard />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/transactions"
        element={
          isAuthenticated ? (
            <Layout>
              <Transactions />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/summary"
        element={
          isAuthenticated ? (
            <Layout>
              <Summary />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/profile"
        element={
          isAuthenticated ? (
            <Layout>
              <Profile />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/receipts"
        element={
          isAuthenticated ? (
            <Layout>
              <Receipts />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <TransactionProvider>
      {/* ✅ Wrap routes with AuthProvider */}
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </TransactionProvider>
  );
}