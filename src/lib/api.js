/*
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/inventory/login';
    }
    return Promise.reject(error);
  }
);

export { api };
*/
import axios from 'axios';

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  let url = value.toString().trim();

  if (url.startsWith(':')) {
    url = `http://localhost${url}`;
  }
  if (/^(localhost|127\.0\.0\.1):\d+/i.test(url)) {
    url = `http://${url}`;
  }

  return url.replace(/\/+$/, '');
};

const rawBase =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:4000/api';

let API_BASE = normalizeBaseUrl(rawBase);
if (API_BASE && !API_BASE.endsWith('/api')) {
  API_BASE = `${API_BASE}/api`;
}

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add domain header - get from localStorage or default to restaurant
  const domain = localStorage.getItem('domain') || 'restaurant';
  config.headers['x-domain'] = domain;
  
  return config;
});

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/inventory/login';
    }
    return Promise.reject(error);
  }
);

export { api };
