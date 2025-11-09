import axios, { AxiosInstance } from 'axios';

// ✅ Define the shape of your environment variables (for Vite)
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ✅ Base URL: Render for prod, /api for local
const baseURL: string =
  import.meta.env.VITE_API_BASE_URL || '/api';

// 🔍 Optional: log baseURL in development for sanity
if (import.meta.env.MODE !== 'production') {
  console.log('🌐 Using API base URL:', baseURL);
}

// ✅ Create Axios instances
const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // allows cross-domain cookies and headers
});

const uploadApi: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true,
});

// ✅ Helper to get JWT token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// ✅ Interceptor: attach token to every request
[api, uploadApi].forEach((instance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
});

export { uploadApi };
export default api;