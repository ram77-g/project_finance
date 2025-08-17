import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import {
  LayoutDashboard,
  CreditCard,
  User,
  TrendingUp,
  Moon,
  Sun,
  BarChart3,
  Bell,
  Menu as MenuIcon,
  FileText,
  LogOut
} from 'lucide-react';
import { useTransaction } from '../context/TransactionContext';
import NotificationPopup from './NotificationPopup';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const { state, toggleTheme, resetState } = useTransaction();  // <-- use resetState
  const { theme, notifications } = state;

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Logout Function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    resetState();            // <-- call resetState here
    setIsAuthenticated(false);
    navigate('/login');
  };

  // Persistent Login Check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('http://localhost:5000/api/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const user = await res.json();
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        handleLogout();
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show unread notification dot
  useEffect(() => {
    if (!isNotificationOpen && notifications.length > 0) {
      setHasUnread(true);
    }
    if (isNotificationOpen) {
      setHasUnread(false);
    }
  }, [notifications.length, isNotificationOpen]);

  const isActive = (path: string) => location.pathname === path;

  // Close dropdown menu on route change
  useEffect(() => setIsMenuOpen(false), [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <Link
                to="/"
                className="text-xl font-bold text-gray-900 dark:text-white"
                aria-label="Go to Dashboard"
                style={{ textDecoration: 'none' }}
              >
                FinanceTracker
              </Link>
            </div>
            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-6 items-center">
                {/* Dashboard */}
                <Link
                  to="/"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive('/')
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </Link>

                {/* Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 focus:outline-none"
                  >
                    <MenuIcon size={20} />
                    <span>Menu</span>
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <Link
                        to="/transactions"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-2 px-4 py-2 transition-colors duration-150 ${
                          isActive('/transactions')
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <CreditCard size={18} />
                        <span>Transactions</span>
                      </Link>
                      <Link
                        to="/summary"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-2 px-4 py-2 transition-colors duration-150 ${
                          isActive('/summary')
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <BarChart3 size={18} />
                        <span>Summary</span>
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-2 px-4 py-2 transition-colors duration-150 ${
                          isActive('/profile')
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <User size={18} />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/receipts"
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-b-lg transition-colors duration-150 ${
                          isActive('/receipts')
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <FileText size={18} />
                        <span>Receipts</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="relative">
                      <Bell size={20} />
                      {hasUnread && (
                        <span
                          className="absolute top-0 right-0 block w-2.5 h-2.5 rounded-full bg-red-500 border border-white dark:border-gray-800"
                          style={{ transform: 'translate(50%, -50%)' }}
                        ></span>
                      )}
                    </span>
                    <span>Notifications</span>
                  </button>
                  <NotificationPopup
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 text-red-600 hover:text-white hover:bg-red-500 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-600"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </nav>
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
};

export default Layout;
