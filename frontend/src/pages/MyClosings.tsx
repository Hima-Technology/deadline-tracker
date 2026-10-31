import { useEffect, useState } from 'react'
import api, { errMsg } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import { AUTHORITIES } from '../types'
import type { Authority, Closing } from '../types'
import { useLanguage } from '../context/LanguageContext'

export default function MyClosings() {
  const { t } = useLanguage()
  const [rows, setRows] = useState<Closing[]>([])
  const [target, setTarget] = useState<Closing | null>(null)
  const [ref, setRef] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'loading' as 'loading' | 'success' | 'error' })
  function showToast(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
    setToast({ show: true, message, type })
    if (type !== 'loading') {
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000)
    }
  }

  async function load() {
    try {
      const r = await api.get('/closings/mine'); setRows(r.data.data)
    } catch (e) { setError(errMsg(e)) }
  }
  useEffect(() => { load() }, [])

  async function markClosed() {
    if (!target) return
    setBusy(true); setError('')
    showToast('MARKING AS CLOSED...', 'loading')
    
    try {
      const fd = new FormData()
      fd.append('reference_number', ref)
      fd.append('authorities', JSON.stringify(authorities))
      if (file) fd.append('proof', file)
      await api.post(`/closings/${target.id}/close`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      showToast('TASK CLOSED SUCCESSFULLY', 'success')
      setTarget(null); setRef(''); setFile(null); setAuthorities([]); load()
    } catch (e) { 
      setError(errMsg(e)) 
      showToast('ACTION FAILED', 'error')
    }
    finally { setBusy(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto relative">
      
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-cyan-100/50 text-cyan-800 text-[10px] uppercase tracking-widest font-bold border border-cyan-200">{t('STAFF // WORKSPACE')}</span>
          <span className="text-gray-400 text-[10px]">//</span>
          <span className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">{t('ASSIGNED TASKS')}</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk] uppercase">{t('My Closings')}</h2>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 border border-red-200 rounded text-sm font-mono">{error}</div>}

      <div className="space-y-3">
        {rows.map((c) => (
          <div key={c.id} className="bg-white p-4 shadow-sm border border-gray-200 rounded-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{c.obligation_title}</h3>
                <p className="text-sm text-slate-500 font-medium">{c.company_name}</p>
              </div>
              <Badge status={c.status} />
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-500 font-mono mb-4 mt-2">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                Due: {c.due_date}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                Period: {c.period_label}
              </span>
            </div>

            {c.status !== 'closed' && (
              <button 
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(6,182,212,0.3)] active:scale-[0.99]" 
                onClick={() => {
                  setTarget(c)
                  setRef('')
                  setFile(null)
                  setAuthorities(
                    c.authority && AUTHORITIES.some(({ value }) => value === c.authority)
                      ? [c.authority as Authority]
                      : c.authority === 'ALL'
                        ? AUTHORITIES.map(({ value }) => value)
                        : []
                  )
                  setError('')
                }}
              >
                <span className="material-symbols-outlined text-[18px]">task_alt</span>
                Mark Task as Closed
              </button>
            )}
            
            {c.status === 'closed' && (
              <div className="bg-green-50 border border-green-100 p-2.5 rounded-sm flex items-center justify-between gap-2 text-sm text-green-700 font-medium">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
                  Closed Successfully {c.reference_number && `— Ref: ${c.reference_number}`}
                </div>
                {c.authorities && c.authorities.length > 0 && (
                  <span className="text-xs font-mono">{c.authorities.join(', ')}</span>
                )}
                {c.proof_file_path && (
                  <a 
                    href={`http://localhost:8000/api/files${c.proof_file_path}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-xs font-bold uppercase"
                  >
                    View Proof
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="bg-white p-10 border border-gray-200 shadow-sm text-center text-gray-400 font-mono text-xs uppercase rounded-sm">
            No tasks assigned to you at the moment
          </div>
        )}
      </div>

      {/* MODAL YA KUFUNGA KAZI */}
      <Modal open={!!target} onClose={() => setTarget(null)} title="Mark as Closed">
        <div className="space-y-4">
          {error && <div className="text-xs text-red-600 bg-red-50 p-2 border border-red-100 rounded font-mono">{error}</div>}
          
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-sm text-xs text-blue-800 font-mono mb-2">
            Closing task for <strong>{target?.company_name}</strong> ({target?.period_label})
          </div>

          <fieldset>
            <legend className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Choose institution(s) *</legend>
            <div className="flex flex-wrap gap-2">
              {AUTHORITIES.map(({ value, label }) => (
                <label key={value} className={`px-3 py-2 border rounded-sm text-xs font-bold cursor-pointer ${
                  authorities.includes(value)
                    ? 'bg-cyan-50 border-cyan-400 text-cyan-700'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}>
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={authorities.includes(value)}
                    onChange={() => setAuthorities(current =>
                      current.includes(value)
                        ? current.filter(authority => authority !== value)
                        : [...current, value]
                    )}
                  />
                  {label}
                </label>
              ))}
              <button
                type="button"
                className="px-3 py-2 border border-gray-200 rounded-sm text-xs font-bold text-slate-600 hover:bg-slate-50"
                onClick={() => setAuthorities(
                  authorities.length === AUTHORITIES.length
                    ? []
                    : AUTHORITIES.map(({ value }) => value)
                )}
              >
                {authorities.length === AUTHORITIES.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
          </fieldset>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Reference Number *')}</label>
            <input 
              className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" 
              value={ref} 
              onChange={(e) => setRef(e.target.value)} 
              placeholder="e.g. TRA-2026-..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Proof (PDF / Image, optional)')}</label>
            <input 
              className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm file:mr-4 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" 
              type="file" 
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
            <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 transition-colors rounded-sm" onClick={() => setTarget(null)}>
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 transition-colors shadow-sm rounded-sm flex items-center gap-2 disabled:opacity-50" 
              onClick={markClosed} 
              disabled={busy || !ref.trim() || authorities.length === 0}
            >
              {busy ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                  Saving...
                </>
              ) : (
                'Confirm Closure'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}