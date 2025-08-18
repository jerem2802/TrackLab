import jwtDecode from 'jwt-decode'
import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react'

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

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)

  // Définir logout avec useCallback pour éviter les re-renders inutiles
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      try {
        const decoded: DecodedToken = jwtDecode<DecodedToken>(storedToken)
        
        // Vérifier si le token n'est pas expiré
        if (decoded.exp * 1000 < Date.now()) {
          console.log('Token expiré')
          logout()
          return
        }
        
        console.log('DECODED TOKEN :', decoded)
        setUser({ id: decoded.userId, email: decoded.email })
        setToken(storedToken)
      } catch (err) {
        console.error('Token invalide', err)
        logout()
      }
    }
  }, [logout])

  const login = (newToken: string) => {
    try {
      const decoded: DecodedToken = jwtDecode<DecodedToken>(newToken)
      
      // Vérifier si le token n'est pas expiré
      if (decoded.exp * 1000 < Date.now()) {
        console.error('Token expiré lors du login')
        return
      }
      
      localStorage.setItem('token', newToken)
      setUser({ id: decoded.userId, email: decoded.email })
      setToken(newToken)
    } catch (err) {
      console.error('Erreur lors du décodage du token', err)
    }
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

// Hook personnalisé
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}