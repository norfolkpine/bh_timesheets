"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authService, type LoginCredentials } from "@/services/auth-service"

// Update the User interface to include role
export interface User {
  id: string
  email: string
  name: string
  role: "employee" | "manager"
  is_staff?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Make sure the useEffect properly sets the user role
  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      setIsLoading(true)
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        // Clear any invalid auth state
        localStorage.removeItem("access_token")
        localStorage.removeItem("current_user")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const response = await authService.login(credentials)
      setUser(response.user)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authService.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
