import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import BottomNav       from './components/BottomNav'
import LoadingSpinner  from './components/LoadingSpinner'

import Dashboard       from './pages/Dashboard'
import Analytics       from './pages/Analytics'
import AddTransaction  from './pages/AddTransaction'
import Borrow          from './pages/Borrow'
import AIAssistant     from './pages/AIAssistant'
import Settings        from './pages/Settings'
import Categories      from './pages/Categories'
import Login           from './pages/Login'
import Signup          from './pages/Signup'
import ForgotPassword  from './pages/ForgotPassword'
import NotFound        from './pages/NotFound'

/** Redirect unauthenticated users to /login */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) return <LoadingSpinner fullPage />
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

/** Routes that show the bottom nav shell */
const NAV_ROUTES = ['/', '/analytics', '/add', '/borrow', '/ai', '/settings']

export default function App() {
  const location = useLocation()
  const showNav = NAV_ROUTES.includes(location.pathname)

  return (
    <div className="app-shell">
      <main className="page-content">
        <Routes>
          {/* Public auth routes */}
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Signup />} />
          <Route path="/forgot-password"  element={<ForgotPassword />} />

          {/* Protected app routes */}
          <Route path="/" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute><Analytics /></ProtectedRoute>
          } />
          <Route path="/add" element={
            <ProtectedRoute><AddTransaction /></ProtectedRoute>
          } />
          <Route path="/borrow" element={
            <ProtectedRoute><Borrow /></ProtectedRoute>
          } />
          <Route path="/ai" element={
            <ProtectedRoute><AIAssistant /></ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute><Categories /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {showNav && <BottomNav />}
    </div>
  )
}
