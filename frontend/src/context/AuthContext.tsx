import { createContext, useContext, useEffect, useState, useRef } from 'react'
import type { ReactNode } from 'react'
import Swal from 'sweetalert2'
import api from '../api/client'
import type { User } from '../types'

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  isAdmin: () => boolean
}

const Ctx = createContext<AuthCtx | null>(null)

// Session idle timeout — dakika 45
const IDLE_TIMEOUT = 45 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(true)

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }

  function resetIdleTimer() {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
    }

    if (!localStorage.getItem('token')) return

    idleTimerRef.current = setTimeout(() => {
      logout()

      Swal.fire({
        title: 'Session Expired',
        text: 'Muda wako wa kukaa umeisha (Dakika 45 bila kugusa kitu). Umelazimika kutoka nje kwa usalama.',
        icon: 'warning',
        confirmButtonColor: '#06b6d4',
        confirmButtonText: 'Login Tena',
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
          popup: 'rounded-xl shadow-2xl font-sans',
          title: 'text-slate-800 font-bold',
          htmlContainer: 'text-slate-600',
        },
      }).then(() => {
        window.location.href = '/login'
      })
    }, IDLE_TIMEOUT)
  }

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    resetIdleTimer()
    events.forEach((event) => document.addEventListener(event, resetIdleTimer))

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      events.forEach((event) => document.removeEventListener(event, resetIdleTimer))
    }
  }, [user])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    api
      .get('/auth/me')
      .then((r) => {
        setUser(r.data.data)
        localStorage.setItem('user', JSON.stringify(r.data.data))
      })
      .catch(() => {
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string): Promise<User> {
    const r = await api.post('/auth/login', { email, password })
    const { token, user: u } = r.data.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
    resetIdleTimer()
    return u
  }

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: () => user?.role === 'admin',
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be inside AuthProvider')
  return c
}