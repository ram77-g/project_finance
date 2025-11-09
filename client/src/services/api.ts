import axios, { AxiosInstance } from 'axios';

// ✅ Define your environment variable type (for Vite)
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

// ✅ Use production URL or fallback for local dev
const baseURL: string =
  import.meta.env?.VITE_API_BASE_URL || 'https://project-finance-u6w2.onrender.com/api';

// ✅ Create Axios instances
const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 🔥 Keeps auth headers & cookies across domains
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