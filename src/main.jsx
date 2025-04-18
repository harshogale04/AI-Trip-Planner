import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Plan from './pages/Plan.jsx'
import TripResult from './pages/TripResult';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="plan" element={<Plan />} />
          <Route path="/trip" element={<TripResult />} />

        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
