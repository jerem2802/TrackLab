import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LabLayout from '../components/LabLayout'

export default function Lab() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) navigate('/login')
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) return null

  // 🔐 Plein écran, aucune marge/padding héritée du layout parent
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      <LabLayout />
    </div>
  )
}
