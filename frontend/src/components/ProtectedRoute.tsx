import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({
  adminOnly = false,
  staffOnly = false,
  auditorOnly = false,
  adminOrAuditor = false,
}: {
  adminOnly?: boolean
  staffOnly?: boolean
  auditorOnly?: boolean
  adminOrAuditor?: boolean
}) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-muted">Loading…</div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/my-closings" replace />
  if (staffOnly && user.role !== 'staff') {
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/my-privileges'} replace />
  }
  if (auditorOnly && user.role !== 'auditor') {
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/my-closings'} replace />
  }
  if (adminOrAuditor && !['admin', 'auditor'].includes(user.role)) {
    return <Navigate to="/my-closings" replace />
  }
  return <Outlet />
}