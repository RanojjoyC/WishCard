import axios from 'axios';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const cleanBase = rawApiBase.trim().replace(/\/+$/, '');
export const API_BASE = cleanBase.endsWith('/api') ? cleanBase : `${cleanBase}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('wishcard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized on a protected route, token is expired or invalid
      // Do not hard reload, but let caller handle or clear stale session
    }
    return Promise.reject(error);
  }
);

export default api;
