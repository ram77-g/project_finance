import React, { useRef, useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Eye, X, Check } from 'lucide-react';
import api, { uploadApi } from '../services/api';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const TEXT_TYPES = ['text/plain'];
const PDF_TYPE = 'application/pdf';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const BACKEND_URL = 'http://localhost:5000'; // Adjust if server is different

interface Receipt {
  _id: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

const Receipts: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await api.get('/receipts', { withCredentials: true });
      setReceipts(res.data);
      setError(null);
    } catch {
      setError('Unable to load receipts');
    }
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = e.target.files;
    let formData = new FormData();
    let hasInvalidFile = false;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (![...IMAGE_TYPES, ...TEXT_TYPES, PDF_TYPE].includes(file.type)) {
        setError('Invalid file type. Please upload images, PDFs, or text files.');
        hasInvalidFile = true;
        break;
      }
      if (file.size > MAX_SIZE) {
        setError('File size exceeds 5MB limit.');
        hasInvalidFile = true;
        break;
      }
      formData.append('receipts', file);
    }
    if (hasInvalidFile) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const res = await uploadApi.post('/receipts/upload', formData, { withCredentials: true });
      setReceipts(prev => [...res.data, ...prev]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setError('Failed to upload receipts. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleDeleteRequest = (id: string) => setConfirmDeleteId(id);
  const handleDeleteCancel = () => setConfirmDeleteId(null);

  const handleDeleteConfirm = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/receipts/${id}`, { withCredentials: true });
      setReceipts(prev => prev.filter(r => r._id !== id));
      setConfirmDeleteId(null);
    } catch {
      setError('Failed to delete receipt.');
    } finally {
      setDeletingId(null);
    }
  };

  // Clicking download now fetches as blob and triggers a download
  const handleDownload = async (receipt: Receipt) => {
    setDownloadingId(receipt._id);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${BACKEND_URL}/api/receipts/${receipt._id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Could not download file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = receipt.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download receipt.');
    } finally {
      setDownloadingId(null);
    }
  };

  const openPreview = async (receipt: Receipt) => {
    setPreviewReceipt(receipt);
    if (TEXT_TYPES.includes(receipt.fileType)) {
      setLoadingPreview(true);
      try {
        const response = await fetch(`${BACKEND_URL}${receipt.fileUrl}`);
        const text = await response.text();
        setPreviewText(text);
      } catch {
        setPreviewText('Could not load preview.');
      } finally {
        setLoadingPreview(false);
      }
    } else {
      setPreviewText(null);
    }
    setModalOpen(true);
  };

  const closePreview = () => {
    setModalOpen(false);
    setPreviewReceipt(null);
    setPreviewText(null);
  };

  return (
    <>
      <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Receipts</h1>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          Upload your receipts here. Supported files: Images, PDFs, and Text files (TXT).
        </p>
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.txt"
          onChange={handleFilesChange}
          ref={fileInputRef}
          className="hidden"
          disabled={uploading}
        />
        <button
          onClick={triggerFileInput}
          disabled={uploading}
          className="mb-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          <Upload className="mr-2" /> {uploading ? 'Uploading...' : 'Upload Receipts'}
        </button>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {receipts.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-20">No receipts uploaded yet.</p>
        ) : (
          <ul className="space-y-4">
            {receipts.map(r => (
              <li
                key={r._id}
                className="flex items-center space-x-4 bg-gray-100 dark:bg-gray-700 p-3 rounded"
              >
                <div className="flex-shrink-0 cursor-pointer" onClick={() => openPreview(r)}>
                  {IMAGE_TYPES.includes(r.fileType) ? (
                    <img
                      src={`${BACKEND_URL}${r.fileUrl}`}
                      alt={r.originalName}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <FileText className="h-12 w-12 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{r.originalName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(r.fileSize / 1024).toFixed(1)} KB · {r.fileType}
                  </p>
                </div>
                <div className="flex space-x-2 items-center">
                  <button
                    title="Preview"
                    onClick={() => openPreview(r)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye />
                  </button>
                  <button
                    title="Download"
                    onClick={() => handleDownload(r)}
                    disabled={downloadingId === r._id}
                    className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {downloadingId === r._id ? (
                      <svg className="inline-block w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <svg
                        className="inline-block w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v16h16" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v8m0 0l-4-4m4 4l4-4" />
                      </svg>
                    )}
                  </button>
                  {confirmDeleteId === r._id ? (
                    <>
                      <button
                        className="text-green-600 hover:text-green-900 ml-1"
                        title="Confirm Delete"
                        disabled={deletingId === r._id}
                        onClick={() => handleDeleteConfirm(r._id)}
                      >
                        <Check size={20} />
                      </button>
                      <button
                        className="text-gray-400 hover:text-gray-600 ml-0.5"
                        title="Cancel"
                        disabled={deletingId === r._id}
                        onClick={handleDeleteCancel}
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <button
                      title="Delete"
                      onClick={() => handleDeleteRequest(r._id)}
                      className="text-red-600 hover:text-red-800 ml-1"
                    >
                      <Trash2 />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Preview Modal */}
      {modalOpen && previewReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-md max-w-4xl w-full max-h-full overflow-auto p-4 relative">
            <button
              onClick={closePreview}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              aria-label="Close preview"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold mb-4">{previewReceipt.originalName}</h2>
            {loadingPreview && <p>Loading preview...</p>}
            {!loadingPreview && (
              <>
                {IMAGE_TYPES.includes(previewReceipt.fileType) && (
                  <img
                    src={`${BACKEND_URL}${previewReceipt.fileUrl}`}
                    alt={previewReceipt.originalName}
                    className="max-w-full max-h-[70vh] rounded"
                  />
                )}
                {previewReceipt.fileType === PDF_TYPE && (
                  <iframe
                    src={`${BACKEND_URL}${previewReceipt.fileUrl}`}
                    className="w-full h-[70vh]"
                    title={previewReceipt.originalName}
                  />
                )}
                {TEXT_TYPES.includes(previewReceipt.fileType) && previewText && (
                  <pre className="overflow-auto max-h-[70vh] bg-gray-100 dark:bg-gray-900 p-4 rounded whitespace-pre-wrap">
                    {previewText}
                  </pre>
                )}
                {(!IMAGE_TYPES.includes(previewReceipt.fileType)
                  && previewReceipt.fileType !== PDF_TYPE
                  && !TEXT_TYPES.includes(previewReceipt.fileType)) && (
                  <p>Cannot preview this file type. Please download to view.</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Receipts;