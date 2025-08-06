import { useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

const API_URL = 'http://localhost:4000'

const navigate = useNavigate()

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || 'Erreur inconnue')
    } else {
      toast.success('Compte créé avec succès !')
      setEmail('')
      setPassword('')
      navigate('/login') // ✅ redirige après inscription
    }
  } catch (err) {
    console.error(err)
    toast.error('Erreur réseau')
  }
}


  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-center">Créer un compte</h2>

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
      />

      <button
        className="py-2 text-white transition bg-blue-500 rounded hover:bg-blue-600"
        type="submit"
      >
        S'inscrire
      </button>
    </form>
  )
}
