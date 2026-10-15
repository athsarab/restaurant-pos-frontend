import axios from 'axios';

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  let url = value.toString().trim();

  // Common misconfig: ':4000' or ':4000/api' (missing protocol/host)
  if (url.startsWith(':')) {
    url = `http://localhost${url}`;
  }

  // Common misconfig: 'localhost:4000/api' or '127.0.0.1:4000/api'
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

// Ensure the inventory API points to the Express /api prefix
if (API_BASE && !API_BASE.endsWith('/api')) {
  API_BASE = `${API_BASE}/api`;
}

const api = axios.create({ 
  baseURL: API_BASE,
  timeout: 30000 // 30 second timeout instead of default 10 seconds
});

// Track last activity time for session refresh
let lastActivityTime = Date.now();
let refreshPromise = null;

// Function to refresh token
const refreshToken = async () => {
  if (refreshPromise) return refreshPromise;
  
  refreshPromise = axios.post(`${API_BASE}/auth/refresh`, {}, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      'x-domain': localStorage.getItem('domain') || 'restaurant'
    }
  }).then(response => {
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      lastActivityTime = Date.now();
    }
    refreshPromise = null;
    return response.data.token;
  }).catch(error => {
    refreshPromise = null;
    // If refresh fails, redirect to login
    localStorage.removeItem('token');
    window.location.href = '/inventory/login';
    throw error;
  });
  
  return refreshPromise;
};

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      // Decode token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      
      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 300) {
        const newToken = await refreshToken();
        config.headers.Authorization = `Bearer ${newToken}`;
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Token check error:', error);
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
   
  // Add domain header - get from localStorage or default to restaurant
  const domain = localStorage.getItem('domain') || 'restaurant';
  config.headers['x-domain'] = domain;
  
  return config;
});

// Response interceptor to handle expired tokens
api.interceptors.response.use(
  response => {
    // Check if server sent refresh signal
    if (response.headers['x-token-refresh-needed']) {
      refreshToken().catch(console.error);
    }
    return response;
  },
  error => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';

    // For any 401, clear token and force re-login (avoids silent failures in production)
    // Skip redirect loops for auth endpoints
    if (status === 401 && !requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/refresh')) {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/inventory/login')) {
        window.location.href = '/inventory/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
