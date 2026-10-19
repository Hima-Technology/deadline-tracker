import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { errMsg } from '../api/client'
import Toast from '../components/Toast'
import Modal from '../components/Modal'
import api from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('admin@sbc.local')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  
  // States za Forgot Password Modal
  const [forgotModal, setForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotBusy, setForgotBusy] = useState(false)
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotErr, setForgotErr] = useState('')

  const { login } = useAuth()
  const nav = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      setTimeout(() => nav('/dashboard'), 800) 
    } catch (err) {
      setError(errMsg(err))
      setBusy(false)
    }
  }

  // Function ya kutuma Email ya Reset
  async function handleForgot(e: FormEvent) {
    e.preventDefault()
    setForgotErr('')
    setForgotMsg('')
    setForgotBusy(true)
    try {
      const r = await api.post('/auth/forgot-password', { email: forgotEmail })
      setForgotMsg(r.data.message)
      setTimeout(() => setForgotModal(false), 3000)
    } catch (err) {
      setForgotErr(errMsg(err))
    } finally {
      setForgotBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8ff] relative overflow-hidden font-sans selection:bg-[#06b6d4] selection:text-white">
      
      <Toast show={busy} message={error ? "AUTHENTICATION FAILED" : "AUTHENTICATING SYSTEM..."} type={error ? "error" : "loading"} />

      {/* FLOATING CARD */}
      <div className="relative w-full max-w-[420px] bg-white rounded-3xl border border-[#06b6d4]/30 shadow-[0_12px_45px_-5px_rgba(6,182,212,0.18),0_2px_12px_rgba(15,23,42,0.06)] p-6 sm:p-10 z-10 mx-4">
        
        <div className="absolute -top-[1px] left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#06b6d4] to-transparent shadow-[0_0_12px_#06b6d4]" />

        <div className="flex flex-col items-center text-center mt-2 mb-8">
          <div className="relative mb-5 group">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#06b6d4] to-indigo-500 rounded-2xl blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-300" />
            <div className="relative w-16 h-16 rounded-xl bg-white border border-gray-200 p-2 shadow-sm flex items-center justify-center">
              <span className="text-2xl font-bold text-[#06b6d4]">SBC</span>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06b6d4] opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#06b6d4] border-2 border-white" />
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Welcome Back</h1>
          <p className="text-sm text-gray-500 max-w-sm leading-relaxed">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center font-mono">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-slate-700 tracking-wider font-mono">EMAIL</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center">
                <span className="material-symbols-outlined text-lg text-[#06b6d4]">mail</span>
              </div>
              <input className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 transition-all font-mono" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-xs font-semibold text-slate-700 tracking-wider font-mono">PASSWORD</label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-gray-400 pointer-events-none flex items-center">
                <span className="material-symbols-outlined text-lg text-[#06b6d4]">lock</span>
              </div>
              <input className="w-full pl-10 pr-11 py-3 bg-white text-slate-900 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 transition-all font-mono" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button className="absolute right-3 text-gray-400 hover:text-slate-800 p-1 transition-colors flex items-center" onClick={() => setShowPassword(!showPassword)} type="button">
                <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-left">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input defaultChecked className="w-4 h-4 accent-[#06b6d4] rounded border-gray-300 cursor-pointer" type="checkbox" />
              <span className="text-xs text-slate-600">Remember this device</span>
            </label>
            
            {/* BUTTON YA FORGOT PASSWORD SASA INAFUNGUA MODAL */}
            <button 
              type="button"
              onClick={() => setForgotModal(true)}
              className="text-xs text-[#00687a] hover:text-[#06b6d4] hover:underline transition-colors font-medium cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <button className="w-full py-3.5 px-4 bg-[#06b6d4] hover:bg-[#22d3ee] text-[#00424f] text-base uppercase tracking-wide font-bold rounded-xl shadow-[0_0_18px_rgba(6,182,212,0.4)] hover:shadow-[0_0_28px_rgba(6,182,212,0.6)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-6 group disabled:opacity-70 disabled:cursor-not-allowed" type="submit" disabled={busy}>
            <span>{busy ? 'AUTHENTICATING...' : 'SIGN IN'}</span>
            <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </form>

        <div className="absolute -bottom-[1px] left-1/3 right-1/3 h-[2px] bg-gradient-to-r from-transparent via-[#06b6d4] to-transparent opacity-80" />
      </div>

      {/* MODAL YA FORGOT PASSWORD */}
      <Modal open={forgotModal} onClose={() => setForgotModal(false)} title="Reset Your Password">
        <form onSubmit={handleForgot} className="space-y-4">
          <p className="text-xs text-gray-500">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          {forgotErr && <div className="text-xs text-red-600 bg-red-50 p-2 border border-red-200 rounded">{forgotErr}</div>}
          {forgotMsg && <div className="text-xs text-green-600 bg-green-50 p-2 border border-green-200 rounded">{forgotMsg}</div>}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Email Address</label>
            <input 
              className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" 
              type="email" 
              required 
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 transition-colors rounded-sm" onClick={() => setForgotModal(false)}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 transition-colors shadow-sm rounded-sm flex items-center gap-2 disabled:opacity-50" 
              disabled={forgotBusy}
            >
              {forgotBusy ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}