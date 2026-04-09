import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import BottomNav       from './components/BottomNav'
import Sidebar         from './components/Sidebar'
import LoadingSpinner  from './components/LoadingSpinner'
import ReloadPrompt   from './components/pwa/ReloadPrompt'

// Lazy load pages for better bundle performance
const Landing         = lazy(() => import('./pages/Landing'))
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const Analytics       = lazy(() => import('./pages/Analytics'))
const AddTransaction  = lazy(() => import('./pages/AddTransaction'))
const Borrow          = lazy(() => import('./pages/Borrow'))
const AIAssistant     = lazy(() => import('./pages/AIAssistant'))
const Settings        = lazy(() => import('./pages/Settings'))
const Categories      = lazy(() => import('./pages/Categories'))
const Login           = lazy(() => import('./pages/Login'))
const Signup          = lazy(() => import('./pages/Signup'))
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword   = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail     = lazy(() => import('./pages/VerifyEmail'))
const NotFound        = lazy(() => import('./pages/NotFound'))

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
const NAV_ROUTES = ['/', '/analytics', '/add', '/borrow', '/settings']

export default function App() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  console.log('[DEBUG] App Auth State:', { isAuthenticated, path: location.pathname });
  const showNav = NAV_ROUTES.includes(location.pathname) && isAuthenticated
  const isLanding = !isAuthenticated && location.pathname === '/'

  return (
    <div className={isLanding ? "" : "app-shell"}>
      {showNav && <Sidebar />}
      
      <main className={isLanding ? "" : "page-content"}>
        <Suspense fallback={<LoadingSpinner fullPage />}>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login"   element={<Login />} />
            <Route path="/signup"  element={<Signup />} />
            <Route path="/forgot-password"  element={<ForgotPassword />} />
            <Route path="/reset-password"   element={<ResetPassword />} />
            <Route path="/verify-email"    element={<VerifyEmail />} />

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
        </Suspense>
      </main>

      {showNav && <BottomNav />}
      <ReloadPrompt />
    </div>
  )
}
