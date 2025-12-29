'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from './api'

interface User {
  id: string
  email: string
  name: string
}

interface Organization {
  id: string
  name: string
  onboardingStatus?: string
}

interface AuthContextType {
  user: User | null
  organization: Organization | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; name: string; organizationName: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing token
    const storedToken = localStorage.getItem('iavoqado_token')
    if (storedToken) {
      // Validate token BEFORE setting it
      authApi.me(storedToken)
        .then((data) => {
          // Token is valid, set everything
          setToken(storedToken)
          setUser(data.user)
          setOrganization(data.organization)
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('iavoqado_token')
          setToken(null)
          setUser(null)
          setOrganization(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('iavoqado_token', data.token)
    setToken(data.token)
    setUser(data.user)
    // Fetch organization
    const meData = await authApi.me(data.token)
    setOrganization(meData.organization)
  }

  const register = async (data: { email: string; password: string; name: string; organizationName: string }) => {
    const response = await authApi.register(data)
    localStorage.setItem('iavoqado_token', response.token)
    setToken(response.token)
    setUser(response.user)
    // Fetch organization
    const meData = await authApi.me(response.token)
    setOrganization(meData.organization)
  }

  const logout = () => {
    localStorage.removeItem('iavoqado_token')
    setToken(null)
    setUser(null)
    setOrganization(null)
  }

  return (
    <AuthContext.Provider value={{ user, organization, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
