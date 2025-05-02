import axios from "axios"

const API_URL = "http://127.0.0.1:8000/api"

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for CORS with credentials
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to handle CSRF token
api.interceptors.request.use(async (config) => {
  // Only add CSRF token for non-GET requests
  if (config.method !== "get") {
    try {
      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1]

      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken
      } else {
        // If no CSRF token in cookie, make a request to get it
        await axios.get(`${API_URL}/csrf/`, {
          withCredentials: true,
        })
        // The cookie will be set automatically
        const newCsrfToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("csrftoken="))
          ?.split("=")[1]
        if (newCsrfToken) {
          config.headers["X-CSRFToken"] = newCsrfToken
        }
      }
    } catch (error) {
      console.error("Error getting CSRF token:", error)
    }
  }
  return config
})

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterCredentials {
  email: string
  password1: string
  password2: string
}

export interface User {
  id: string
  email: string
  name: string
  role: "employee" | "manager"
  is_staff?: boolean
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirm {
  token: string
  uid: string
  new_password1: string
  new_password2: string
}

class AuthService {
  private getAuthHeaders() {
    // Get token from localStorage
    const token = localStorage.getItem("access_token")
    // Get CSRF token from cookie
    const csrfToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("csrftoken="))
      ?.split("=")[1]

    const headers: Record<string, string> = {}

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken
    }

    return { headers }
  }

  private async getCsrfToken() {
    try {
      // Make a GET request to the API root to get the CSRF token
      await api.get("/")
    } catch (error) {
      console.error("Error getting CSRF token:", error)
    }
  }

  async login(credentials: LoginCredentials) {
    try {
      // Get CSRF token before login
      await this.getCsrfToken()

      // Log the request payload for debugging
      console.log("Login request payload:", {
        email: credentials.email,
        password: "********", // Don't log the actual password
        remember: credentials.remember || false,
      })

      const response = await api.post(
        "/auth/login/",
        {
          email: credentials.email,
          password: credentials.password,
          remember: credentials.remember || false,
        },
        {
          ...this.getAuthHeaders(),
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        },
      )

      // Log the response for debugging
      console.log("Login response:", {
        status: response.status,
        data: response.data,
        headers: response.headers,
      })

      if (response.status !== 200) {
        const errorMessage =
          response.data?.detail ||
          response.data?.non_field_errors?.[0] ||
          "Failed to login. Please check your credentials."
        throw new Error(errorMessage)
      }

      // Store the access token if it's in the response
      if (response.data.access) {
        localStorage.setItem("access_token", response.data.access)
      }

      // Fetch user info including role
      const userInfo = await this.getCurrentUser()

      return { user: userInfo }
    } catch (error: any) {
      console.error("Login error:", error)
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        })
        const errorMessage =
          error.response.data?.detail ||
          error.response.data?.non_field_errors?.[0] ||
          "Failed to login. Please check your credentials."
        throw new Error(errorMessage)
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error("No response from server. Please check your connection.")
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error("An error occurred while setting up the request.")
      }
    }
  }

  async logout() {
    try {
      await this.getCsrfToken()
      await api.post("/auth/logout/", {}, { headers: this.getAuthHeaders().headers })
      // Clear the access token and user data
      localStorage.removeItem("access_token")
      localStorage.removeItem("current_user")
    } catch (error) {
      console.error("Logout error:", error)
      // Still clear local storage even if the server request fails
      localStorage.removeItem("access_token")
      localStorage.removeItem("current_user")
      throw error
    }
  }

  async getCurrentUser() {
    try {
      // First check if we have the user in localStorage
      const userStr = localStorage.getItem("current_user")
      if (userStr) {
        return JSON.parse(userStr)
      }

      // If not, fetch from the server
      const response = await api.get("/user-info/", {
        headers: this.getAuthHeaders().headers,
      })

      // Store the user data
      localStorage.setItem("current_user", JSON.stringify(response.data))
      return response.data
    } catch (error) {
      console.error("Get current user error:", error)
      throw error
    }
  }

  isAuthenticated() {
    return !!localStorage.getItem("access_token")
  }
}

export const authService = new AuthService()
