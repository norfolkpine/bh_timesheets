import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for CSRF token
api.interceptors.request.use(async (config) => {
  // Only add CSRF token for non-GET requests
  if (config.method !== 'get') {
    try {
      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrftoken='))
        ?.split('=')[1];

      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      } else {
        // If no CSRF token in cookie, fetch it from the backend
        const response = await axios.get('/api/csrf/', { withCredentials: true });
        config.headers['X-CSRFToken'] = response.data.csrfToken;
      }
    } catch (error) {
      console.error('Error getting CSRF token:', error);
    }
  }
  return config;
}); 