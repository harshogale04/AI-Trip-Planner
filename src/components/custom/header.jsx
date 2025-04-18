// src/components/Header.jsx
import { Link } from 'react-router-dom'

export default function header() {
  return (
    <header className="p-4 bg-blue-600 text-white flex justify-between">
      <h1 className="text-xl font-bold">AI Trip Planner</h1>
      <nav className="space-x-4">
        <Link to="/">Home</Link>
        <Link to="/plan">Plan</Link>
      </nav>
    </header>
  )
}
