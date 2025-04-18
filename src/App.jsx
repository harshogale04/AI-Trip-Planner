import { Outlet, Link } from 'react-router-dom'
import logo from './assets/logo.svg'

function App() {
  return (
    <div>
      {/* Header Navbar */}
      <header className="bg-blue-100 p-6 shadow-md">
        <nav className="flex items-center justify-between">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-auto" />
            <span className="text-2xl font-bold text-blue-700">AI Trip Planner</span>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex gap-6 text-lg font-semibold text-blue-600">
            <Link to="/">Home</Link>
            <Link to="/Plan">Plan</Link>
          </div>

          {/* Right: Sign In Button */}
          <div>
            <button className="p-3 shadow-sm flex justify-between items-center px-5">
              Sign In
            </button>
          </div>
        </nav>
      </header>

      {/* Page Content */}
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default App
