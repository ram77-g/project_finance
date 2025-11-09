import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../App';
import { useTransaction } from '../context/TransactionContext';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: Record<string, unknown>;
  message?: string;
}

const AnimatedLogoIcon: React.FC = () => (
  <>
    <style>
      {`
        @keyframes authLogoGlowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }
        @keyframes authLogoBarRise {
          0%, 100% { transform: scaleY(0.6); }
          50% { transform: scaleY(1); }
        }
        .auth-logo .auth-glow { animation: authLogoGlowPulse 4s ease-in-out infinite; }
        .auth-logo .auth-bar { animation: authLogoBarRise 1.8s ease-in-out infinite; transform-origin: bottom center; }
        .auth-logo .auth-bar:nth-child(2) { animation-delay: -0.3s; }
        .auth-logo .auth-bar:nth-child(3) { animation-delay: -0.6s; }
      `}
    </style>
    <span className="auth-logo relative flex h-16 w-16 items-center justify-center">
      <span className="auth-glow absolute inset-0 rounded-full bg-emerald-400/40 blur-xl" />
      <span className="absolute inset-[4px] rounded-full bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 shadow-[0_0_20px_rgba(5,150,105,0.45)]" />
      <span className="relative flex h-12 w-12 items-end justify-center gap-[6px]">
        <span className="auth-bar h-[60%] w-2 rounded-full bg-emerald-400/80" />
        <span className="auth-bar h-[80%] w-2 rounded-full bg-teal-300/85" />
        <span className="auth-bar h-full w-2 rounded-full bg-sky-300/80" />
      </span>
    </span>
  </>
);

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const { fetchUser, fetchTransactions, fetchSummary } = useTransaction();

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post<LoginResponse>('/login', formData);

      setSuccess('Login successful!');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setIsAuthenticated(true);
      await fetchUser();
      await fetchTransactions();
      await fetchSummary();
      navigate('/');
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message || 'Login failed');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl overflow-hidden rounded-3xl bg-white/80 shadow-xl ring-1 ring-gray-200 backdrop-blur dark:bg-gray-900/70 dark:ring-gray-800">
        <div className="grid min-h-[620px] grid-cols-1 md:grid-cols-2">
          <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-blue-50 via-indigo-50 to-purple-50 p-10 text-center dark:from-gray-900 dark:via-gray-900/80 dark:to-gray-900">
            <AnimatedLogoIcon />
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FinanceTracker</h1>
              <p className="text-base text-gray-600 dark:text-gray-300">
                Track finances effortlessly, stay on top of your spending, and reach your goals faster.
              </p>
            </div>
          </div>

          <div className="flex h-full items-center justify-center bg-white/85 px-8 py-12 dark:bg-gray-900/80">
            <div className="w-full max-w-md">
              <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">Login</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label htmlFor="email" className="block mb-2 font-semibold text-gray-600 dark:text-gray-300">
                    Email:
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full py-3 px-4 border border-gray-300 rounded-md text-gray-700
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                      dark:bg-gray-700 dark:text-gray-100 transition-all"
                  />
                </div>
                <div className="mb-5">
                  <label htmlFor="password" className="block mb-2 font-semibold text-gray-600 dark:text-gray-300">
                    Password:
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full py-3 px-4 border border-gray-300 rounded-md text-gray-700
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
                      dark:bg-gray-700 dark:text-gray-100 transition-all"
                  />
                </div>
                {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4 text-center text-sm">{error}</div>}
                {success && <div className="bg-green-600 text-white p-3 rounded-md mb-4 text-center text-sm">{success}</div>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-md mt-4
                    hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              <p className="text-center mt-6 text-gray-600 dark:text-gray-300 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-blue-600 font-bold hover:underline">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;