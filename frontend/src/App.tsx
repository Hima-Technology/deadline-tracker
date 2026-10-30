import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
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
import MyPrivileges from './pages/MyPrivileges' // <-- Imeongezwa hapa

export default function App() {
  return (
    <BrowserRouter>
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
              <Route path="/closings"    element={<Closings />} />
              
              <Route path="/privileges"  element={<Privileges />} />
            </Route>
          </Route>

          {/* Staff routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/my-closings"   element={<MyClosings />} />
              <Route path="/my-privileges" element={<MyPrivileges />} /> {/* <-- Imeongezwa hapa */}
              <Route path="/settings"      element={<Settings />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}