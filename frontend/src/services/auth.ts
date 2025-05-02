import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for CORS with credentials
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to handle CSRF token
api.interceptors.request.use(async (config) => {
  // Only add CSRF token for non-GET requests
  if (config.method !== 'get') {
    try {
      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
      
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      } else {
        // If no CSRF token in cookie, make a request to get it
        await axios.get(`${API_URL}/csrf/`, {
          withCredentials: true,
        });
        // The cookie will be set automatically
        const newCsrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='))
          ?.split('=')[1];
        if (newCsrfToken) {
          config.headers['X-CSRFToken'] = newCsrfToken;
        }
      }
    } catch (error) {
      console.error('Error getting CSRF token:', error);
    }
  }
  return config;
});

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password1: string;
  password2: string;
}

export interface User {
  email: string;
  name: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  uid: string;
  new_password1: string;
  new_password2: string;
}

class AuthService {
  private getAuthHeaders() {
    // Get CSRF token from cookie
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];

    return {
      headers: {
        'X-CSRFToken': csrfToken || '',
      },
    };
  }

  private async getCsrfToken() {
    try {
      // Make a GET request to the API root to get the CSRF token
      await api.get('/');
    } catch (error) {
      console.error('Error getting CSRF token:', error);
    }
  }

  async login(credentials: LoginCredentials) {
    try {
      // Get CSRF token before login
      await this.getCsrfToken();

      // Log the request payload for debugging
      console.log('Login request payload:', {
        email: credentials.email,
        password: '********', // Don't log the actual password
        remember: credentials.remember || false
      });

      const response = await api.post(
        '/auth/login/',
        {
          email: credentials.email,
          password: credentials.password,
          remember: credentials.remember || false
        },
        {
          ...this.getAuthHeaders(),
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        }
      );

      // Log the response for debugging
      console.log('Login response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      if (response.status !== 200) {
        const errorMessage = response.data?.detail || 
                           response.data?.non_field_errors?.[0] ||
                           'Failed to login. Please check your credentials.';
        throw new Error(errorMessage);
      }

      // Store the access token if it's in the response
      if (response.data.access) {
        localStorage.setItem('access_token', response.data.access);
      }

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        const errorMessage = error.response.data?.detail || 
                           error.response.data?.non_field_errors?.[0] ||
                           'Failed to login. Please check your credentials.';
        throw new Error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error('An error occurred while setting up the request.');
      }
    }
  }

  async loginWithGoogle() {
    try {
      window.location.href = `${API_URL}/auth/google/login/`;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  async handleGoogleCallback(code: string) {
    try {
      const response = await axios.post(
        `${API_URL}/auth/google/callback/`,
        { code },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Google callback error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.getCsrfToken();
      await api.post(
        '/auth/logout/',
        {},
        this.getAuthHeaders()
      );
      // Clear the access token
      localStorage.removeItem('access_token');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await api.get<User>(
        '/auth/user/',
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  async register(credentials: RegisterCredentials) {
    try {
      await this.getCsrfToken();

      const response = await api.post(
        '/auth/registration/',
        credentials,
        {
          ...this.getAuthHeaders(),
          validateStatus: (status) => status < 500,
        }
      );

      if (response.status !== 201) {
        const errorMessage = response.data?.detail || 
                           response.data?.non_field_errors?.[0] ||
                           'Failed to register. Please check your information.';
        throw new Error(errorMessage);
      }

      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response) {
        const errorMessage = error.response.data?.detail || 
                           error.response.data?.non_field_errors?.[0] ||
                           'Failed to register. Please check your information.';
        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw new Error('An error occurred while setting up the request.');
      }
    }
  }

  async requestPasswordReset(data: PasswordResetRequest) {
    try {
      await this.getCsrfToken();
      const response = await api.post(
        '/auth/password/reset/',
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  async confirmPasswordReset(data: PasswordResetConfirm) {
    try {
      await this.getCsrfToken();
      const response = await api.post(
        '/auth/password/reset/confirm/',
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      throw error;
    }
  }

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  }
}

export const authService = new AuthService(); 