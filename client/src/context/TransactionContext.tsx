import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

// --- Types ---
interface Transaction {
  _id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  monthlyBudget: number;
  currency: string;
  profilePicture?: string;
}

interface Notification {
  id: string;
  message: string;
  timestamp: number;
}

interface State {
  transactions: Transaction[];
  user: User | null;
  summary: {
    monthly: { income: number; expenses: number; balance: number };
    yearly: { income: number; expenses: number; balance: number };
  };
  loading: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_SUMMARY'; payload: State['summary'] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'RESET_STATE' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'CLEAR_NOTIFICATIONS' };

// --- Initial State ---
const initialState: State = {
  transactions: [],
  user: null,
  summary: {
    monthly: { income: 0, expenses: 0, balance: 0 },
    yearly: { income: 0, expenses: 0, balance: 0 },
  },
  loading: false,
  theme: 'light',
  notifications: [],
};

// --- Currency formatting utility ---
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const currencySymbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', INR: '₹',
    CNY: '¥', KRW: '₩', SGD: 'S$'
  };
  const symbol = currencySymbols[currency] || currency;
  const formattedAmount =
    currency === 'JPY' || currency === 'KRW'
      ? Math.round(amount).toLocaleString()
      : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${symbol}${formattedAmount}`;
};

export const getCurrencySymbol = (currency: string = 'USD'): string => {
  const currencySymbols: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', INR: '₹',
    CNY: '¥', KRW: '₩', SGD: 'S$'
  };
  return currencySymbols[currency] || currency;
};

// --- Date formatting helper for notifications ---
export const formatDateTime = (date: string | number | Date) => {
  return new Date(date).toLocaleString('en-GB');
};

// --- Context ---
const TransactionContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
  fetchTransactions: () => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, '_id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  resetState: () => void;
  toggleTheme: () => void;
  formatCurrency: (amount: number) => string;
} | undefined>(undefined);

// --- Reducer ---
function transactionReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SUMMARY':
      return { ...state, summary: action.payload };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t._id === action.payload._id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t._id !== action.payload),
      };
    case 'RESET_STATE':
      // Reset transactions, user, summary, notifications to initial
      return {
        ...state,
        transactions: [],
        user: null,
        summary: {
          monthly: { income: 0, expenses: 0, balance: 0 },
          yearly: { income: 0, expenses: 0, balance: 0 },
        },
        notifications: [],
      };
    case 'SET_THEME':
      localStorage.setItem('theme', action.payload);
      return { ...state, theme: action.payload };
    case 'TOGGLE_THEME':
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return { ...state, theme: newTheme };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    default:
      return state;
  }
}

// --- Provider ---
export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const themeFromStorage = (typeof window !== 'undefined' && localStorage.getItem('theme')) as 'light' | 'dark' | null;

  const [state, dispatch] = useReducer(transactionReducer, {
    ...initialState,
    theme: themeFromStorage === 'dark' ? 'dark' : 'light',
  });

  const fetchTransactions = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.get('/transactions');
      dispatch({ type: 'SET_TRANSACTIONS', payload: response.data });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/default'); // Now JWT required, correct user only
      dispatch({ type: 'SET_USER', payload: response.data });
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/transactions/summary');
      dispatch({ type: 'SET_SUMMARY', payload: response.data });
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, '_id'>) => {
    try {
      const response = await api.post('/transactions', transaction);
      dispatch({ type: 'ADD_TRANSACTION', payload: response.data });
      await fetchSummary();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    try {
      const response = await api.put(`/transactions/${id}`, transaction);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: response.data });
      await fetchSummary();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      await fetchSummary();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await api.put('/users/profile', userData);
      dispatch({ type: 'SET_USER', payload: response.data });
      await fetchSummary();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const toggleTheme = () => dispatch({ type: 'TOGGLE_THEME' });

  // Check monthly budget
  useEffect(() => {
    if (
      state.user &&
      state.user.monthlyBudget > 0 &&
      state.summary.monthly.expenses > state.user.monthlyBudget
    ) {
      const now = new Date();
      const alreadyNotified = state.notifications.some(
        n =>
          n.message.includes('Monthly budget exceeded') &&
          new Date(n.timestamp).getMonth() === now.getMonth() &&
          new Date(n.timestamp).getFullYear() === now.getFullYear()
      );
      if (!alreadyNotified) {
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            id: `budget-${Date.now()}`,
            message: `Monthly budget exceeded! You spent ₹${state.summary.monthly.expenses.toLocaleString()}, the budget is ₹${state.user.monthlyBudget.toLocaleString()}.`,
            timestamp: Date.now() // still raw Milliseconds
          }
        });
      }
    }
  }, [state.user, state.summary.monthly.expenses]);

  const formatCurrencyWithUserPreference = (amount: number): string =>
    formatCurrency(amount, state.user?.currency || 'USD');

  useEffect(() => {
    fetchUser();
    fetchTransactions();
    fetchSummary();
  }, []);

  useEffect(() => {
    if (state.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state.theme]);

  return (
    <TransactionContext.Provider
      value={{
        state,
        dispatch,
        fetchTransactions,
        fetchUser,
        fetchSummary,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateUser,
        resetState,
        toggleTheme,
        formatCurrency: formatCurrencyWithUserPreference,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransaction() {
  const context = useContext(TransactionContext);
  if (context === undefined) throw new Error('useTransaction must be used within a TransactionProvider');
  return context;
}