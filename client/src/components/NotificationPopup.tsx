import React, { useEffect, useRef } from 'react';
import { X, Bell } from 'lucide-react';
import { useTransaction } from '../context/TransactionContext';

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ isOpen, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const { state } = useTransaction();
  const { notifications } = state;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-4 max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            No notifications yet
          </div>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-gray-900 dark:text-white"
              >
                <p>{n.message}</p>
                <div className="text-xs text-gray-500 dark:text-gray-300">
                  {new Date(n.timestamp).toLocaleString('en-GB')} {/* DD/MM/YYYY */}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationPopup;