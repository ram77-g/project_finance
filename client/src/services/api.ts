import axios from 'axios';

// ✅ Use production URL from env or fallback to /api for dev
const baseURL: string = import.meta.env.VITE_API_BASE_URL || 'https://project-finance-u6w2.onrender.com/api';

// ✅ Create JSON and file upload clients
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 🔥 ensures cookies + auth headers are allowed across origins
});

const uploadApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true, // 🔥 important for file uploads too
});

// ✅ Helper to get JWT token from localStorage
function getAuthToken() {
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