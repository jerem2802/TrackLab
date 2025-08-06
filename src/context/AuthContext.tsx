import jwt_decode from 'jwt-decode'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

// Type du contexte
interface AuthContextType {
  token: string | null
  user: { id: string; email: string } | null
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
}

// Type du token JWT
interface DecodedToken {
  userId: string
  email: string
  exp: number
  iat: number
}



// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      try {
        const decoded: DecodedToken = jwt_decode<DecodedToken>(storedToken)
        console.log('DECODED TOKEN :', decoded)
        setUser({ id: decoded.userId, email: decoded.email })
        setToken(storedToken)
      } catch (err) {
        console.error('Token invalide', err)
        logout()
      }
    }
  }, [])

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken)
    const decoded: DecodedToken = jwt_decode<DecodedToken>(newToken)
    setUser({ id: decoded.userId, email: decoded.email })
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
  }

  const value: AuthContextType = {
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}
