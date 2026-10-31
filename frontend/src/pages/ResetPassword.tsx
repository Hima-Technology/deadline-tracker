import { useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api, { errMsg } from '../api/client'
import { useLanguage } from '../context/LanguageContext'

export default function ResetPassword() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const nav = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError(t('Passwords do not match'))
      return
    }
    if (password.length < 8) {
      setError(t('Password must be at least 8 characters'))
      return
    }
    setBusy(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => nav('/login'), 3000)
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return <div className="p-8 text-center text-red-500">{t('Invalid reset link. Please request a new one.')}</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8ff] p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">{t('Set New Password')}</h2>

        {success ? (
          <div className="text-green-600 text-center p-3 bg-green-50 rounded border border-green-200">
            {t('Password reset successfully! Redirecting to login...')}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded">{error}</div>}
            <div>
              <label className="block text-sm font-medium mb-1">{t('New Password')}</label>
              <input 
                type="password" 
                className="w-full px-3 py-2 border rounded" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('Confirm Password')}</label>
              <input 
                type="password" 
                className="w-full px-3 py-2 border rounded" 
                value={confirm} 
                onChange={(e) => setConfirm(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" disabled={busy} className="w-full bg-cyan-500 text-white py-2 rounded font-bold">
              {busy ? t('Saving...') : t('Reset Password')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}