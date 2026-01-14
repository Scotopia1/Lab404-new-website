import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
  timeout: 30000, // 30 second timeout
});

// CSRF token cache
let csrfToken: string | null = null;

// Fetch CSRF token from server
const fetchCsrfToken = async (): Promise<string> => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/csrf-token`, {
      withCredentials: true,
    });
    csrfToken = data.csrfToken;
    if (!csrfToken) {
      throw new Error('CSRF token not received from server');
    }
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    throw error;
  }
};

// Public endpoints that don't require CSRF tokens
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/verify-reset-code',
  '/auth/reset-password',
  '/auth/verify-email',
];

// Request interceptor - add CSRF token for state-changing methods
api.interceptors.request.use(async (config) => {
  // Skip CSRF for public auth endpoints
  const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint =>
    config.url?.includes(endpoint)
  );

  // Add CSRF token for state-changing methods (except public endpoints)
  if (
    !isPublicEndpoint &&
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')
  ) {
    try {
      const token = await fetchCsrfToken();
      config.headers['x-csrf-token'] = token;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
    }
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      console.warn(`Rate limited. Retry after ${retryAfter} seconds.`);
    }
    // Handle unauthorized
    if (error.response?.status === 401) {
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
