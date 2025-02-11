import React, { createContext, useContext, useState } from 'react'

interface User {
  firstName: string
  lastName: string
  email: string
  hasCompletedOnboarding: boolean
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  hasCompletedSignup: boolean
  setHasCompletedSignup: (value: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [hasCompletedSignup, setHasCompletedSignup] = useState(false)

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    hasCompletedSignup,
    setHasCompletedSignup,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 