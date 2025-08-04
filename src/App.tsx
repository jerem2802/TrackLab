import { Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Lab from './pages/Lab'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lab" element={<Lab />} />

      </Route>
    </Routes>
  )
}
