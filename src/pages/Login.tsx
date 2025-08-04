import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { login, user, isAuthenticated } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Identifiants invalides')
      } else {
        login(data.token)
        toast.success('Connexion réussie !')
        // ⚠️ la redirection est gérée par useEffect maintenant
      }
    } catch (err) {
      console.error(err)
      toast.error('Erreur réseau')
    }
  }

  // ✅ Redirection une fois authentifié ET user chargé
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/Lab')
    }
  }, [isAuthenticated, user, navigate])

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col max-w-sm gap-4 p-6 mx-auto mt-20 border rounded shadow"
    >
      <h2 className="text-xl font-bold text-center">Se connecter</h2>

      <input
        className="px-3 py-2 border rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        className="px-3 py-2 border rounded"
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />

      <button
        className="py-2 text-white transition bg-blue-500 rounded hover:bg-blue-600"
        type="submit"
      >
        Se connecter
      </button>
    </form>
  )
}
