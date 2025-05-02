import axios from "axios"

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Add withCredentials to handle CORS with credentials
  withCredentials: true,
  // Add timeout for faster feedback
  timeout: 15000,
})

// Add a request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making request to: ${config.baseURL}${config.url}`, {
      method: config.method,
      headers: config.headers,
      data: config.data ? "(data present)" : "(no data)",
    })

    // Get token from localStorage
    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Get CSRF token from cookie for non-GET requests
    if (config.method !== "get") {
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1]

      if (csrfToken) {
        config.headers["X-CSRFToken"] = csrfToken
      }
    }

    return config
  },
  (error) => {
    console.error("Request error:", error)
    return Promise.reject(error)
  },
)

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}: Status ${response.status}`, {
      data: response.data ? "(data received)" : "(no data)",
      headers: response.headers,
    })
    return response
  },
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.log("Authentication error, redirecting to login")
      localStorage.removeItem("access_token")
      localStorage.removeItem("current_user")

      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login"
      }
    }

    // Log more detailed error information
    console.error("API Error:", error.message)
    if (error.response) {
      console.error("Response data:", error.response.data)
      console.error("Response status:", error.response.status)
      console.error("Response headers:", error.response.headers)
    } else if (error.request) {
      console.error("No response received. Request details:", {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
      })
    }

    return Promise.reject(error)
  },
)

export default apiClient
