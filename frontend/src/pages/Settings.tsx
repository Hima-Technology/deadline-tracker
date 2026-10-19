import { useEffect, useState } from 'react'
import api, { errMsg } from '../api/client'
import Toast from '../components/Toast'
import { useAuth } from '../context/AuthContext'

type Tab = 'profile' | 'password'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Profile State
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })

  // Password State
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'loading' as 'loading' | 'success' | 'error' })
  function showToast(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
    setToast({ show: true, message, type })
    if (type !== 'loading') setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000)
  }

  // Weka taarifa za mtumiaji kwenye fomu mara tu user anapopatikana
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  // Kama mtumiaji bado hajapakiwa (null), onyesha Loading ili kuzuia Blank Screen
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cyan-600 animate-pulse font-mono uppercase tracking-widest text-sm">
          Loading Account Profile...
        </div>
      </div>
    )
  }

  // Update Profile
  async function saveProfile() {
    setBusy(true); setError('')
    showToast('UPDATING PROFILE...', 'loading')
    try {
      await api.put('/users/profile', profile)
      showToast('PROFILE UPDATED', 'success')
    } catch (e) {
      setError(errMsg(e))
      showToast('UPDATE FAILED', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Change Password
  async function savePassword() {
    if (passwords.new !== passwords.confirm) {
      setError('New passwords do not match')
      return
    }
    if (passwords.new.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    setBusy(true); setError('')
    showToast('CHANGING PASSWORD...', 'loading')
    try {
      await api.put('/users/change-password', {
        current_password: passwords.current,
        new_password: passwords.new
      })
      showToast('PASSWORD CHANGED', 'success')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (e) {
      setError(errMsg(e))
      showToast('UPDATE FAILED', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 relative max-w-4xl mx-auto">
      
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-cyan-100/50 text-cyan-800 text-[10px] uppercase tracking-widest font-bold border border-cyan-200">MY ACCOUNT</span>
          <span className="text-gray-400 text-[10px]">//</span>
          <span className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">SETTINGS</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk] uppercase">Account Settings</h2>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 border border-red-200 rounded text-sm font-mono">{error}</div>}

      {/* TABS */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider font-mono transition-colors border-b-2 whitespace-nowrap ${activeTab === 'profile' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}>My Profile</button>
        <button onClick={() => setActiveTab('password')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider font-mono transition-colors border-b-2 whitespace-nowrap ${activeTab === 'password' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}>Change Password</button>
      </div>

      <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-sm">
        
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Personal Information</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Full Name</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Email Address</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Phone Number</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
            </div>
            <div className="pt-4 border-t border-gray-100 mt-4">
              <button onClick={saveProfile} disabled={busy} className="px-6 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 transition-colors shadow-sm rounded-sm disabled:opacity-50">
                {busy ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}

        {/* PASSWORD TAB */}
        {activeTab === 'password' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">Security</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Current Password</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">New Password</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Confirm New Password</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />
            </div>
            <div className="pt-4 border-t border-gray-100 mt-4">
              <button onClick={savePassword} disabled={busy} className="px-6 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 transition-colors shadow-sm rounded-sm disabled:opacity-50">
                {busy ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}