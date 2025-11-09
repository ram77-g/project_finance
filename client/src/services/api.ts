import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/* -------------------------------------------------------------------------- */
/* 🌐 Environment Setup                                                       */
/* -------------------------------------------------------------------------- */

// ✅ Define the shape of environment variables for TypeScript (Vite-style)
interface ImportMetaEnv {
  readonly MODE?: string;
  readonly PROD?: boolean;
  readonly DEV?: boolean;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ✅ Dynamically select correct backend URL based on environment
const baseURL: string =
  import.meta.env.PROD
    ? import.meta.env.VITE_API_BASE_URL ||
      'https://project-finance-u6w2.onrender.com/api' // Production Render
    : 'http://localhost:5000/api';                    // Local Development

// ✅ Optional: log baseURL in dev for sanity check
if (import.meta.env.DEV) {
  console.log('🌍 Using API base URL:', baseURL);
}

/* -------------------------------------------------------------------------- */
/* ⚙️ Axios Instance Creation                                                 */
/* -------------------------------------------------------------------------- */

// JSON-based API instance
const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 🔥 required for cross-origin cookies + JWT
});

// Multipart (file upload) API instance
const uploadApi: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true,
});

/* -------------------------------------------------------------------------- */
/* 🔐 Token Handling                                                          */
/* -------------------------------------------------------------------------- */

// ✅ Helper: safely get token from localStorage
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('token');
  } catch (err) {
    console.warn('⚠️ Unable to access localStorage:', err);
    return null;
  }
}

// ✅ Helper: attach Authorization header
function attachAuthHeader(config: AxiosRequestConfig): AxiosRequestConfig {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}

/* -------------------------------------------------------------------------- */
/* 🔄 Interceptors                                                            */
/* -------------------------------------------------------------------------- */

// ✅ Request interceptor: adds token to every request
[api, uploadApi].forEach((instance) => {
  instance.interceptors.request.use(
    (config) => attachAuthHeader(config),
    (error) => Promise.reject(error)
  );
});

// ✅ Response interceptor: auto-handle 401 errors gracefully (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('🚫 Unauthorized! Redirecting to login...');
      // Optional: clear storage or redirect logic here
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

/* -------------------------------------------------------------------------- */
/* 🧰 Optional Utility                                                        */
/* -------------------------------------------------------------------------- */

// Simple helper to verify backend connectivity
export async function pingServer(): Promise<void> {
  try {
    const { data } = await api.get('/ping');
    console.log('✅ Backend reachable:', data.message);
  } catch (err) {
    console.error('❌ Backend not reachable:', err);
  }
}

/* -------------------------------------------------------------------------- */
/* 📦 Export                                                                 */
/* -------------------------------------------------------------------------- */

export { uploadApi };
export default api;