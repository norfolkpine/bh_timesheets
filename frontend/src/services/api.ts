import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication and CSRF token
api.interceptors.request.use(async (config) => {
  // Get the access token from localStorage
  const accessToken = localStorage.getItem('access_token');
  
  // Add the access token to the Authorization header if it exists
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }

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

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/token/refresh/`,
          {},
          { withCredentials: true }
        );

        // If successful, update the token and retry the original request
        if (response.data.access) {
          localStorage.setItem('access_token', response.data.access);
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
); 