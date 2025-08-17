import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../App';
import { useTransaction } from '../context/TransactionContext';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignupResponse {
  token: string;
  user: Record<string, unknown>;
  message?: string;
}

const Signup: React.FC = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth();
  const { fetchUser, fetchTransactions, fetchSummary } = useTransaction();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post<SignupResponse>('/signup', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      setSuccess('Account created successfully! Redirecting...');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setIsAuthenticated(true);

      // **Important**: fetch user data immediately to update context
      await fetchUser();
      await fetchTransactions();
      await fetchSummary();
      navigate('/');
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message || 'Signup failed');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="firstName" className="block mb-2 font-semibold text-gray-600 dark:text-gray-300">
              First Name:
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full py-3 px-4 border border-gray-300 rounded-md text-gray-700 
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 
                dark:bg-gray-700 dark:text-gray-100 transition-all"
            />
          </div>
          <div className="mb-5">
            <label htmlFor="lastName" className="block mb-2 font-semibold text-gray-600 dark:text-gray-300">
              Last Name:
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full py-3 px-4 border border-gray-300 rounded-md text-gray-700 
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 
                dark:bg-gray-700 dark:text-gray-100 transition-all"
            />
          </div>
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
            <div className="mt-2">
              <small className="text-gray-500 text-xs">
                Password must contain:
                <ul className="ml-6 mt-1 list-disc">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One number</li>
                  <li>One special character (@, #, $, etc.)</li>
                </ul>
              </small>
            </div>
          </div>
          <div className="mb-5">
            <label htmlFor="confirmPassword" className="block mb-2 font-semibold text-gray-600 dark:text-gray-300">
              Confirm Password:
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
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
              hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed 
              transition-colors"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center mt-6 text-gray-600 dark:text-gray-300 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;