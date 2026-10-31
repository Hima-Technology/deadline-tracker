import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Staff from './pages/Staff'
import Clients from './pages/Clients'
import Obligations from './pages/Obligations'
import Closings from './pages/Closings'
import MyClosings from './pages/MyClosings'
import Settings from './pages/Settings'
import ResetPassword from './pages/ResetPassword'
import Privileges from './pages/Privileges'
import MyPrivileges from './pages/MyPrivileges'
import Examinations from './pages/Examinations'
import AuditorFeedback from './pages/AuditorFeedback'
import AuditorMessages from './pages/AuditorMessages'
import { LanguageProvider } from './context/LanguageContext'

// Redirect kulingana na role baada ya login
function HomeRedirect() {
  const { user, isAdmin } = useAuth()
  const role = (user?.role || '').toLowerCase()

  if (isAdmin()) return <Navigate to="/dashboard" replace />
  if (role === 'auditor') return <Navigate to="/my-privileges" replace />
  return <Navigate to="/my-closings" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
       <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin routes */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route element={<Layout />}>
              <Route path="/dashboard"   element={<Dashboard />} />
              <Route path="/staff"       element={<Staff />} />
              <Route path="/clients"     element={<Clients />} />
              <Route path="/obligations" element={<Obligations />} />
              <Route path="/examinations" element={<Examinations />} />
              <Route path="/auditor-feedback" element={<AuditorFeedback />} />
              <Route path="/closings"    element={<Closings />} />
              <Route path="/privileges"  element={<Privileges />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute adminOrAuditor />}>
            <Route element={<Layout />}>
              <Route path="/auditor-messages" element={<AuditorMessages />} />
            </Route>
          </Route>

          {/* Staff + Auditor routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/my-privileges" element={<MyPrivileges />} />
              <Route path="/settings"      element={<Settings />} />
              <Route element={<ProtectedRoute staffOnly />}>
                <Route path="/my-closings" element={<MyClosings />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
       </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}