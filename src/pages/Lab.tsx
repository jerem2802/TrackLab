import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LabLayout from '../components/LabLayout'

export default function Lab() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // ✅ Protection : redirection si pas connecté
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null

  // ✅ Délégation à un vrai composant stylé
  return user ? <LabLayout user={user} /> : null
}
