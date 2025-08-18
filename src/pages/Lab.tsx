import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LabLayout from '../components/LabLayout'

export default function Lab() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  // Si pas connecté, on redirige (pas besoin d'afficher quoi que ce soit)
  if (!isAuthenticated) return null

  // Si connecté, on affiche le LabLayout (qui utilise déjà useAuth() en interne)
  return <LabLayout />
}