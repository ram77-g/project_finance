import React, { useState, useEffect, useRef } from 'react';
import { useTransaction } from '../context/TransactionContext';
import {
  User, Mail, DollarSign, Globe, Save, Camera, Trash2, Upload, Check, X as XIcon, TrendingUp
} from 'lucide-react';
import api, { uploadApi, serverOrigin } from '../services/api';
import { useCurrencyConversion } from '../hooks/useCurrencyConversion';

const Profile: React.FC = () => {
  const { state, updateUser } = useTransaction();
  const { user } = state;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    monthlyBudget: 0,
    currency: 'USD'
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get currency conversion for monthly budget - always convert to USD
  const { convertedAmount, exchangeRate, loading: conversionLoading } = useCurrencyConversion(
    formData.monthlyBudget,
    formData.currency,
    'USD',
    formData.currency !== 'USD'
  );

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        monthlyBudget: user.monthlyBudget,
        currency: user.currency
      });
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'monthlyBudget' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser(formData); // Contains firstName and lastName
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formImage = new FormData();
      formImage.append('profilePicture', file);
      const response = await uploadApi.post('/users/profile/upload-picture', formImage);
      if (response.data.user) {
        await updateUser(response.data.user);
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setPreviewImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    setUploadingImage(true);
    try {
      const response = await uploadApi.delete('/users/profile/delete-picture');
      if (response.data.user) {
        await updateUser(response.data.user);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    } finally {
      setUploadingImage(false);
      setConfirmDelete(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getProfileImageSrc = () => {
    if (previewImage) return previewImage;
    const userWithPicture = user as any;
    if (userWithPicture?.profilePicture)
    return `${serverOrigin}${userWithPicture.profilePicture}`;
  return null;
  };


  const hasProfilePicture = () => {
    const userWithPicture = user as any;
    return userWithPicture?.profilePicture;
  };

  const currencyOptions = [
    { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
    { value: 'JPY', label: 'Japanese Yen (¥)', symbol: '¥' },
    { value: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
    { value: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
    { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
    { value: 'CNY', label: 'Chinese Yuan (¥)', symbol: '¥' },
    { value: 'KRW', label: 'South Korean Won (₩)', symbol: '₩' },
    { value: 'SGD', label: 'Singapore Dollar (S$)', symbol: 'S$' }
  ];


  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
      />

      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Manage your personal information and preferences</p>
      </div>

      <div className="dashboard-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-8 border border-white/20 dark:border-gray-700/20 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {getProfileImageSrc() ? (
                  <img
                    src={getProfileImageSrc()!}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-white" />
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <button
                onClick={triggerFileInput}
                disabled={uploadingImage}
                className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-lg transition-colors disabled:opacity-50"
                title="Change profile picture"
              >
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hasProfilePicture() && !confirmDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={uploadingImage}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                title="Delete profile picture"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {confirmDelete && (
              <div className="flex space-x-1">
                <button
                  onClick={handleDeleteImage}
                  disabled={uploadingImage}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                  title="Confirm delete"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={uploadingImage}
                  className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                  title="Cancel"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Upload Instructions */}
        {isEditing && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
              <Upload className="h-4 w-4" />
              <span className="text-sm font-medium">Profile Picture Tips:</span>
            </div>
            <ul className="text-sm text-blue-600 dark:text-blue-400 mt-1 ml-6 list-disc">
              <li>Click the camera icon to upload a new picture</li>
              <li>Supported formats: JPG, PNG, GIF</li>
              <li>Maximum file size: 5MB</li>
              <li>Square images work best</li>
            </ul>
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Globe className="inline h-4 w-4 mr-1" />
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {currencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Monthly Budget ({currencyOptions.find(c => c.value === formData.currency)?.symbol || formData.currency})
                </label>
                <input
                  type="number"
                  name="monthlyBudget"
                  value={formData.monthlyBudget}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {formData.currency !== 'USD' && !conversionLoading && (
                  <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    ≈ ${convertedAmount.toFixed(2)} USD
                  </div>
                )}
                {formData.currency !== 'USD' && conversionLoading && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Loading conversion...
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email,
                    monthlyBudget: user.monthlyBudget,
                    currency: user.currency,
                  });
                }}
                className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 mb-1">
                <User size={16} />
                <span className="text-sm font-medium">Full Name</span>
              </div>
              <p className="text-gray-900 dark:text-white font-semibold">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 mb-1">
                <Mail size={16} />
                <span className="text-sm font-medium">Email</span>
              </div>
              <p className="text-gray-900 dark:text-white font-semibold">{user.email}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 mb-1">
                <Globe size={16} />
                <span className="text-sm font-medium">Currency</span>
              </div>
              <p className="text-gray-900 dark:text-white font-semibold">
                {currencyOptions.find(c => c.value === user.currency)?.label || user.currency}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 mb-1">
                <DollarSign size={16} />
                <span className="text-sm font-medium">Monthly Budget</span>
              </div>
              <p className="text-gray-900 dark:text-white font-semibold">
                {currencyOptions.find(c => c.value === user.currency)?.symbol || user.currency}{user.monthlyBudget.toLocaleString()}
              </p>
              {user.currency !== 'USD' && !conversionLoading && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                  <div className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center space-x-1">
                    <TrendingUp size={12} />
                    <span>USD Conversion</span>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    <span className="font-semibold">≈ ${convertedAmount.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Exchange Rate: 1 USD = {exchangeRate.toFixed(2)} {user.currency}
                  </div>
                </div>
              )}
              {user.currency !== 'USD' && conversionLoading && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Loading conversion...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {state.transactions.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {new Date().toLocaleDateString('en-GB')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Today's Date</p>
          </div>
        </div>
      </div>

      {/* Currency Conversion Info */}
      <div className="dashboard-card bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Currency Information</h3>
          <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Your Base Currency</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {currencyOptions.find(c => c.value === user.currency)?.label || user.currency}
            </p>
          </div>
          {user.currency !== 'USD' && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Monthly Budget in USD</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                ${!conversionLoading ? convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Loading...'}
              </p>
              {!conversionLoading && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Real-time exchange rate: 1 USD = {exchangeRate.toFixed(2)} {user.currency}
                </p>
              )}
            </div>
          )}
          {user.currency === 'USD' && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                You're already using USD as your base currency.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;