import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-transparent ">
      
      <div className="w-full max-w-md p-6 bg-white border border-gray-200 rounded-lg shadow-xl">
        <Outlet />
      </div>
    </div>
  )
}
