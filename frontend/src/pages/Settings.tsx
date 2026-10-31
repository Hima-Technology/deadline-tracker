import { useEffect, useState } from 'react'
import api, { errMsg } from '../api/client'
import Toast from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

type Tab = 'profile' | 'password' | 'preferences'

export default function Settings() {
  const { user } = useAuth()
  const { language, setLanguage, darkMode, setDarkMode, appFont, setAppFont, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, new: false, confirm: false })

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
          {t('Loading...')}
        </div>
      </div>
    )
  }

  // Update Profile
  async function saveProfile() {
    setBusy(true); setError('')
    showToast(t('UPDATING PROFILE...'), 'loading')
    try {
      await api.put('/users/profile', profile)
      showToast(t('PROFILE UPDATED'), 'success')
    } catch (e) {
      setError(errMsg(e))
      showToast(t('UPDATE FAILED'), 'error')
    } finally {
      setBusy(false)
    }
  }

  // Change Password
  async function savePassword() {
    if (passwords.new !== passwords.confirm) {
      setError(t('New passwords do not match'))
      return
    }
    if (passwords.new.length < 8) {
      setError(t('New password must be at least 8 characters'))
      return
    }
    setBusy(true); setError('')
    showToast(t('CHANGING PASSWORD...'), 'loading')
    try {
      await api.put('/users/change-password', {
        current_password: passwords.current,
        new_password: passwords.new
      })
      showToast(t('PASSWORD CHANGED'), 'success')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (e) {
      setError(errMsg(e))
      showToast(t('UPDATE FAILED'), 'error')
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
          <span className="px-2 py-0.5 bg-cyan-100/50 text-cyan-800 text-[10px] uppercase tracking-widest font-bold border border-cyan-200">{t('My Account')}</span>
          <span className="text-gray-400 text-[10px]">//</span>
          <span className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">{t('Settings')}</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk] uppercase">{t('Account Settings')}</h2>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 border border-red-200 rounded text-sm font-mono">{error}</div>}

      {/* TABS */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button onClick={() => setActiveTab('profile')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider font-mono transition-colors border-b-2 whitespace-nowrap ${activeTab === 'profile' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}>{t('My Profile')}</button>
        <button onClick={() => setActiveTab('password')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider font-mono transition-colors border-b-2 whitespace-nowrap ${activeTab === 'password' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}>{t('Change Password')}</button>
        <button onClick={() => setActiveTab('preferences')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider font-mono transition-colors border-b-2 whitespace-nowrap ${activeTab === 'preferences' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-slate-800'}`}>{t('Preferences')}</button>
      </div>

      <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-sm">
        
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">{t('Personal Information')}</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Full Name')}</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Email Address')}</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Phone Number')}</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
            </div>
            <div className="pt-4 border-t border-gray-100 mt-4">
              <button onClick={saveProfile} disabled={busy} className="px-6 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 transition-colors shadow-sm rounded-sm disabled:opacity-50">
                {busy ? t('Saving...') : t('Save Profile')}
              </button>
            </div>
          </div>
        )}

        {/* PASSWORD TAB */}
        {activeTab === 'password' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">{t('Security')}</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Current Password')}</label>
              <div className="relative">
                <input className="w-full px-3 py-2 pr-11 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" type={visiblePasswords.current ? 'text' : 'password'} value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
                <button type="button" onClick={() => setVisiblePasswords({ ...visiblePasswords, current: !visiblePasswords.current })} aria-label={t(visiblePasswords.current ? 'Hide password' : 'Show password')} title={t(visiblePasswords.current ? 'Hide password' : 'Show password')} className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-cyan-700">
                  <span className="material-symbols-outlined text-xl">{visiblePasswords.current ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('New Password')}</label>
              <div className="relative">
                <input className="w-full px-3 py-2 pr-11 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" type={visiblePasswords.new ? 'text' : 'password'} value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
                <button type="button" onClick={() => setVisiblePasswords({ ...visiblePasswords, new: !visiblePasswords.new })} aria-label={t(visiblePasswords.new ? 'Hide password' : 'Show password')} title={t(visiblePasswords.new ? 'Hide password' : 'Show password')} className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-cyan-700">
                  <span className="material-symbols-outlined text-xl">{visiblePasswords.new ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Confirm New Password')}</label>
              <div className="relative">
                <input className="w-full px-3 py-2 pr-11 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" type={visiblePasswords.confirm ? 'text' : 'password'} value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />
                <button type="button" onClick={() => setVisiblePasswords({ ...visiblePasswords, confirm: !visiblePasswords.confirm })} aria-label={t(visiblePasswords.confirm ? 'Hide password' : 'Show password')} title={t(visiblePasswords.confirm ? 'Hide password' : 'Show password')} className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-cyan-700">
                  <span className="material-symbols-outlined text-xl">{visiblePasswords.confirm ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 mt-4">
              <button onClick={savePassword} disabled={busy} className="px-6 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 transition-colors shadow-sm rounded-sm disabled:opacity-50">
                {busy ? t('Changing...') : t('Change Password')}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="max-w-lg space-y-6">
            <section>
              <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">{t('Language')}</h3>
              <p className="mb-3 text-sm text-slate-500">{t('Choose the language used across the application.')}</p>
              <select value={language} onChange={event => setLanguage(event.target.value as 'en' | 'sw')} className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm">
                <option value="en">English</option>
                <option value="sw">Kiswahili</option>
              </select>
            </section>
            <section className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">{t('Font')}</h3>
              <p className="mb-3 text-sm text-slate-500">{t('Choose the typeface used across the application.')}</p>
              <select value={appFont} onChange={event => setAppFont(event.target.value as typeof appFont)} className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm">
                <option value="space">Space Grotesk</option>
                <option value="arial">Arial</option>
                <option value="georgia">Georgia</option>
                <option value="system">{t('System default')}</option>
                <option value="mono">JetBrains Mono</option>
              </select>
              <p className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700" style={{ fontFamily: 'var(--app-font)' }}>
                {t('Font preview')} — SBC Deadline Tracker 0123
              </p>
            </section>
            <section className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-slate-800 uppercase mb-1">{t('Appearance')}</h3>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{t('Dark mode')}</p>
                  <p className="text-sm text-slate-500">{t('Use a dark color theme throughout the application.')}</p>
                </div>
                <button type="button" role="switch" aria-checked={darkMode} onClick={() => setDarkMode(!darkMode)} className={`relative h-6 w-11 rounded-full transition-colors ${darkMode ? 'bg-cyan-600' : 'bg-slate-300'}`} aria-label={t('Dark mode')}>
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
  )
}