export type User = {
  id: string
  email: string
}

export interface DecodedToken {
  user: User
  exp: number
  iat: number
}

export interface AuthContextType {
  token: string | null
  user: User | null
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
}
