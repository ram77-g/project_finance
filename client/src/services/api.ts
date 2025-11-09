import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/* Env typing for Vite */
interface ImportMetaEnv {
  readonly MODE?: string;
  readonly PROD?: boolean;
  readonly DEV?: boolean;
  readonly VITE_API_BASE_URL?: string; // e.g. https://project-finance-u6w2.onrender.com/api
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/* Base URL selection
   - In production we prefer VITE_API_BASE_URL (set on Render) or fallback to the known host
   - In dev we use localhost backend
*/
const baseURL: string = import.meta.env.PROD
  ? import.meta.env.VITE_API_BASE_URL || 'https://project-finance-u6w2.onrender.com/api'
  : 'http://localhost:5000/api';

if (import.meta.env.DEV) {
  console.log('🌍 Using API base URL:', baseURL);
}

/* serverOrigin: same origin as backend but without the "/api" suffix.
   Useful for building file URLs (uploads/profile pictures etc.).
*/
export const serverOrigin: string = (() => {
  if (import.meta.env.PROD) {
    // If VITE_API_BASE_URL is provided (likely includes /api), remove trailing /api
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) return envUrl.replace(/\/api$/, '');
    return 'https://project-finance-u6w2.onrender.com';
  }
  return 'http://localhost:5000';
})();

/* Axios instances */
const api: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const uploadApi: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'multipart/form-data' },
  withCredentials: true,
});

/* Token helpers */
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('token');
  } catch (err) {
    console.warn('Unable to access localStorage', err);
    return null;
  }
}

/* Attach token */
function attachAuthHeader(config: AxiosRequestConfig) {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}

/* Interceptors */
[api, uploadApi].forEach((instance) => {
  instance.interceptors.request.use(
    (config) => attachAuthHeader(config),
    (error) => Promise.reject(error)
  );
});

/* Handle 401 globally (optional but useful) */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // Clear tokens so app logic knows user is not authenticated
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (_e) {}
    }
    return Promise.reject(err);
  }
);

export { uploadApi};
export default api;