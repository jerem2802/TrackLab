import { Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-white to-[#dbeafe] flex items-center justify-center p-4 ">
      
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 border border-gray-200">
        <Outlet />
      </div>
    </div>
  )
}
