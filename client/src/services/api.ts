import axios from 'axios';

// Use .env for prod, relative /api for dev
const baseURL: string = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const uploadApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Helper to get current JWT
function getAuthToken() {
  return localStorage.getItem('token');
}

// Add Authorization header for every api request (including uploadApi)
[api, uploadApi].forEach(instance => {
  instance.interceptors.request.use(
    config => {
      const token = getAuthToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );
});

export { uploadApi };
export default api;