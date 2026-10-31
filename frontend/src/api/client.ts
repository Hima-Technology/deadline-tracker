import axios from 'axios'

const api = axios.create({
  // Elekeza moja kwa moja kwenye PHP Backend
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401 → logout
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const isPasswordReveal = err.config?.url?.includes('/passwords')
    if (err.response?.status === 401 && !isPasswordReveal) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

export function errMsg(e: any): string {
  return e?.response?.data?.message || e?.message || 'Something went wrong'
}