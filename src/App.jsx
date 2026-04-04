import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import BottomNav       from './components/BottomNav'
import Sidebar         from './components/Sidebar'
import LoadingSpinner  from './components/LoadingSpinner'

import Landing         from './pages/Landing'
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

/** Route root (/) conditionally to Dashboard or Landing */
function HomeRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner fullPage />
  if (isAuthenticated) return <Dashboard />
  return <Landing />
}

/** Routes that show the bottom nav shell */
const NAV_ROUTES = ['/', '/analytics', '/add', '/borrow', '/ai', '/settings']

export default function App() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const showNav = NAV_ROUTES.includes(location.pathname) && isAuthenticated
  const isLanding = !isAuthenticated && location.pathname === '/'

  return (
    <div className={isLanding ? "" : "app-shell"}>
      {showNav && <Sidebar />}
      
      <main className={isLanding ? "" : "page-content"}>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Signup />} />
          <Route path="/forgot-password"  element={<ForgotPassword />} />

          {/* Protected app routes */}
          <Route path="/" element={<HomeRoute />} />
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
