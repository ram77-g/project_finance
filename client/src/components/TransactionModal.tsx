import React, { useState, useEffect } from 'react';
import { useTransaction } from '../context/TransactionContext';
import { getCurrencySymbol } from '../context/TransactionContext';
import { currencyService } from '../services/currencyService';
import { X, DollarSign, FileText, Calendar, Tag, AlertTriangle } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: any;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, transaction }) => {
  const { addTransaction, updateTransaction, state } = useTransaction();
  const { user, transactions } = state;
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateTransactions, setDuplicateTransactions] = useState<any[]>([]);

  const incomeCategories = [
    'Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other Income'
  ];

  const expenseCategories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities',
    'Healthcare', 'Education', 'Travel', 'Insurance', 'Other Expenses'
  ];

  useEffect(() => {
    const initializeForm = async () => {
      if (transaction) {
        let displayAmount = transaction.amount.toString();
        if (user?.currency && user.currency !== 'USD') {
          const converted = await currencyService.convertCurrency(transaction.amount, 'USD', user.currency);
          if (converted !== null) {
            displayAmount = converted.toFixed(2);
          }
        }
        setFormData({
          title: transaction.title,
          amount: displayAmount,
          type: transaction.type,
          category: transaction.category,
          description: transaction.description,
          date: new Date(transaction.date).toISOString().split('T')[0]
        });
      } else {
        setFormData({
          title: '',
          amount: '',
          type: 'expense',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
      setShowDuplicateWarning(false);
      setDuplicateTransactions([]);
    };

    initializeForm();
  }, [transaction, user?.currency]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const checkForDuplicates = () => {
    if (transaction) return []; // Skip duplicate check for edits

    const duplicates = transactions.filter(existingTransaction => {
      return (
        existingTransaction.title.toLowerCase() === formData.title.toLowerCase() &&
        existingTransaction.amount === parseFloat(formData.amount) &&
        existingTransaction.type === formData.type &&
        existingTransaction.category === formData.category &&
        existingTransaction.description.toLowerCase() === formData.description.toLowerCase() &&
        new Date(existingTransaction.date).toDateString() === new Date(formData.date).toDateString()
      );
    });

    return duplicates;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicates only when adding new transactions
    if (!transaction) {
      const duplicates = checkForDuplicates();
      if (duplicates.length > 0) {
        setDuplicateTransactions(duplicates);
        setShowDuplicateWarning(true);
        return;
      }
    }

    await saveTransaction();
  };

  const saveTransaction = async () => {
    setLoading(true);

    try {
      let amountInUSD = parseFloat(formData.amount);
      if (user?.currency && user.currency !== 'USD') {
        const converted = await currencyService.convertCurrency(amountInUSD, user.currency, 'USD');
        if (converted !== null) {
          amountInUSD = converted;
        } else {
          console.error('Currency conversion failed.');
          setLoading(false);
          return;
        }
      }

      const transactionData = {
        title: formData.title,
        amount: amountInUSD,
        type: formData.type as 'income' | 'expense',
        category: formData.category,
        description: formData.description,
        date: formData.date
      };

      if (transaction) {
        await updateTransaction(transaction._id, transactionData);
      } else {
        await addTransaction(transactionData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDuplicate = async () => {
    setShowDuplicateWarning(false);
    await saveTransaction();
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateWarning(false);
    setDuplicateTransactions([]);
  };

  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;
  const currencySymbol = getCurrencySymbol(user?.currency || 'USD');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {transaction ? 'Edit Transaction' : 'Add New Transaction'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Duplicate Warning Modal */}
          {showDuplicateWarning && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Possible Duplicate Transaction
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    We found {duplicateTransactions.length} existing transaction{duplicateTransactions.length > 1 ? 's' : ''} with identical details:
                  </p>
                  <div className="space-y-2 mb-4">
                    {duplicateTransactions.map((dup, index) => (
                      <div key={dup._id} className="text-xs bg-yellow-100 dark:bg-yellow-800/30 p-2 rounded">
                        <strong>{dup.title}</strong> - {currencySymbol}{dup.amount} ({dup.category}) on {new Date(dup.date).toLocaleDateString()}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                    Do you still want to add this transaction?
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleConfirmDuplicate}
                      disabled={loading}
                      className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Yes, Add Anyway'}
                    </button>
                    <button
                      onClick={handleCancelDuplicate}
                      className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter transaction title"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Amount ({currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Add a description..."
              />
            </div>

            {/* Actions */}
            {!showDuplicateWarning && (
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    formData.type === 'income'
                      ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white'
                  }`}
                >
                  {loading ? 'Saving...' : (transaction ? 'Update' : 'Add')} Transaction
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;