import { useEffect, useState } from 'react'
import api, { errMsg } from '../api/client'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import Swal from 'sweetalert2'
import type { Client, User } from '../types'
import { useLanguage } from '../context/LanguageContext'
import { useSearchParams } from 'react-router-dom'
import Obligations from './Obligations'

const AVAILABLE_PERMISSIONS = [
  { key: 'view_clients',      label: 'View Clients' },
  { key: 'add_clients',       label: 'Add Clients' },
  { key: 'edit_clients',      label: 'Edit Clients' },
  { key: 'view_compliance_profile', label: 'View Compliance Profile' },
  { key: 'edit_compliance_profile', label: 'Edit Compliance Profile' },
  { key: 'delete_clients',    label: 'Delete Clients' },
  { key: 'view_passwords',    label: 'Reveal Passwords' },
  { key: 'upload_tra',        label: 'Upload TRA Docs' },
  { key: 'upload_zra',        label: 'Upload ZRA Docs' },
  { key: 'upload_bpra',       label: 'Upload BPRA Docs' },
  { key: 'upload_zssf',       label: 'Upload ZSSF Docs' },
  { key: 'annual_tra',        label: 'TRA Annual Return' },
  { key: 'annual_zra',        label: 'ZRA Annual Return' },
  { key: 'assign_tasks',      label: 'Assign Tasks to Staff' },
]

export default function Privileges() {
  const { t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeSection, setActiveSection] = useState<'access' | 'tasks'>(
    searchParams.get('tab') === 'tasks' ? 'tasks' : 'access'
  )
  const [privileges, setPrivileges] = useState<any[]>([])
  const [staff, setStaff] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  
  // Modal States
  const [modal, setModal] = useState(false)
  const [viewLogsModal, setViewLogsModal] = useState(false)
  const [selectedLogs, setSelectedLogs] = useState<any[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({ staff_id: 0, client_id: 0, description: '' })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [availablePermissions, setAvailablePermissions] = useState(AVAILABLE_PERMISSIONS)

  const [toast, setToast] = useState({ show: false, message: '', type: 'loading' as 'loading' | 'success' | 'error' })
  function showToast(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
    setToast({ show: true, message, type })
    if (type !== 'loading') setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  async function load() {
    try {
      const [p, s, c] = await Promise.all([
        api.get('/privileges'), api.get('/users'), api.get('/clients')
      ])
      setPrivileges(p.data.data || [])
      setStaff(s.data.data || [])
      setClients(c.data.data || [])
    } catch (e) { setError(errMsg(e)) }
  }
  useEffect(() => { void load() }, [])
  useEffect(() => {
    if (searchParams.get('tab') === 'tasks') setActiveSection('tasks')
    if (searchParams.get('tab') === 'access') setActiveSection('access')
  }, [searchParams])

  function moveToChosen(key: string) {
    setSelectedPermissions([...selectedPermissions, key])
    setAvailablePermissions(availablePermissions.filter(p => p.key !== key))
  }

  function moveToAvailable(key: string) {
    setAvailablePermissions([...availablePermissions, AVAILABLE_PERMISSIONS.find(p => p.key === key)!])
    setSelectedPermissions(selectedPermissions.filter(k => k !== key))
  }

  function openCreate() {
    setEditingId(null)
    setForm({ staff_id: 0, client_id: 0, description: '' })
    setSelectedPermissions([])
    setAvailablePermissions(AVAILABLE_PERMISSIONS)
    setModal(true)
  }

  function openEdit(p: any) {
    setEditingId(p.id)
    setForm({ staff_id: p.staff_id, client_id: p.client_id || 0, description: p.description || '' })
    
    const perms = Array.isArray(p.permissions) ? p.permissions : []
    setSelectedPermissions(perms)
    setAvailablePermissions(AVAILABLE_PERMISSIONS.filter(ap => !perms.includes(ap.key)))
    setModal(true)
  }

  async function save() {
    if (!form.staff_id) return showToast('Chagua Staff kwanza', 'error')
    
    setBusy(true); setError('')
    showToast(editingId ? 'UPDATING...' : 'ASSIGNING...', 'loading')
    
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      
      const payload = {
        staff_id: form.staff_id,
        client_id: form.client_id,
        task_type: selectedPermissions[0] || 'custom',
        permissions: selectedPermissions,  
        description: form.description
      }

      if (editingId) {
        await api.post(`${base}/privileges/${editingId}`, payload)
      } else {
        await api.post(`${base}/privileges`, payload)
      }
      
      showToast(editingId ? 'PRIVILEGE UPDATED' : 'PRIVILEGE ASSIGNED', 'success')
      setModal(false); load()
    } catch (e: any) {
      setError(e.response?.data?.error_detail || 'Kuna tatizo limetokea.');
    } finally { setBusy(false) }
  }

  async function remove(id: number) {
    const r = await Swal.fire({
      title: 'Revoke Privilege?', icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, revoke!'
    })
    if (!r.isConfirmed) return
    try { await api.delete(`/privileges/${id}`); load(); showToast('REVOKED', 'success') }
    catch (e) { Swal.fire('Error', errMsg(e), 'error') }
  }

  function showLogs(logs: any[]) {
    setSelectedLogs(logs)
    setViewLogsModal(true)
  }

  return (
    <div className="space-y-6 relative">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk] uppercase">{t('Staff Access Management')}</h2>
          <p className="text-xs text-slate-500 font-mono mt-1">{t('Manage staff access and assigned work from one place.')}</p>
        </div>
        <div className="flex gap-2 border-b border-slate-200">
          <button type="button" onClick={() => { setActiveSection('access'); setSearchParams({ tab: 'access' }) }}
            className={`border-b-2 px-4 py-2 text-xs font-bold uppercase ${activeSection === 'access' ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-500'}`}>
            {t('Review Staff Privileges')}
          </button>
          <button type="button" onClick={() => { setActiveSection('tasks'); setSearchParams({ tab: 'tasks' }) }}
            className={`border-b-2 px-4 py-2 text-xs font-bold uppercase ${activeSection === 'tasks' ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-500'}`}>
            {t('Assign Tasks to Staff')}
          </button>
        </div>
      </div>

      {activeSection === 'tasks' ? (
        <Obligations />
      ) : (
      <>
      {error && <div className="text-red-600 bg-red-50 p-3 rounded text-sm font-mono">{error}</div>}

      <div className="flex justify-end">
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white transition-all text-xs font-bold uppercase rounded-sm">
          <span className="material-symbols-outlined text-[16px]">add_moderator</span>
          {t('Assign privilege')}
        </button>
      </div>
      <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-mono text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4">Staff Name</th>
              <th className="px-4 py-4">Assigned Permissions</th>
              <th className="px-4 py-4">{t('Target Client')}</th>
              <th className="px-4 py-4">Notifications</th>
              <th className="px-4 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {privileges.map(p => {
              const permsArray = Array.isArray(p.permissions) ? p.permissions : [];
              return (
                <tr key={p.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.staff_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {permsArray.map((permKey: string) => (
                        <span key={permKey} className="px-2 py-0.5 bg-cyan-50 text-cyan-700 text-[10px] font-bold uppercase rounded border border-cyan-200">
                          {AVAILABLE_PERMISSIONS.find(x => x.key === permKey)?.label || permKey}
                        </span>
                      ))}
                      {permsArray.length === 0 && <span className="text-xs text-gray-400 italic">None</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{p.company_name || '— Global —'}</td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => showLogs(p.notifications || [])}
                      className="flex gap-1 hover:opacity-80 transition-opacity"
                    >
                      {p.notifications?.length > 0 ? p.notifications.map((n: any, idx: number) => (
                        <span key={idx} className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          n.status === 'sent' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                        }`} title={n.channel}>
                          {n.channel}
                        </span>
                      )) : <span className="text-xs text-gray-400 italic">No messages</span>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => remove(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL YA KUPANGA KAZI (DUAL LIST) */}
      <Modal open={modal} onClose={() => setModal(false)} title={editingId ? "Edit Privileges" : "Assign Permissions"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Staff Member')}</label>
              <select className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                value={form.staff_id} onChange={e => setForm({ ...form, staff_id: Number(e.target.value) })}>
                <option value={0}>— Chagua Staff —</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Target Client (Optional)')}</label>
              <select className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                value={form.client_id} onChange={e => setForm({ ...form, client_id: Number(e.target.value) })}>
                <option value={0}>— Global (Wateja Wote) —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-2 h-64">
            <div className="flex-1 w-full h-full border border-gray-200 rounded bg-slate-50 flex flex-col">
              <div className="bg-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 uppercase">Available Permissions</div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {availablePermissions.map(p => (
                  <div key={p.key} onClick={() => moveToChosen(p.key)}
                    className="px-2 py-1 bg-white border border-gray-100 text-xs text-slate-700 cursor-pointer hover:bg-cyan-50 hover:border-cyan-300 rounded">
                    {p.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex md:flex-col gap-2">
              <button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center text-gray-500 hover:text-cyan-600">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              <button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center text-gray-500 hover:text-cyan-600">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
            </div>

            <div className="flex-1 w-full h-full border border-gray-200 rounded bg-slate-50 flex flex-col">
              <div className="bg-cyan-500 px-3 py-2 text-[10px] font-bold text-white uppercase">Chosen Permissions</div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {selectedPermissions.map(key => {
                  const p = AVAILABLE_PERMISSIONS.find(x => x.key === key);
                  return (
                    <div key={key} onClick={() => moveToAvailable(key)}
                      className="px-2 py-1 bg-white border border-gray-100 text-xs text-slate-700 cursor-pointer hover:bg-red-50 hover:border-red-300 rounded flex justify-between items-center">
                      {p?.label}
                      <span className="material-symbols-outlined text-[14px] text-gray-400 hover:text-red-500">close</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Additional Details')}</label>
            <textarea className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm" rows={2}
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Maelezo ya ziada..." />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase rounded-sm" onClick={() => setModal(false)}>{t('Cancel')}</button>
            <button className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase rounded-sm disabled:opacity-50" onClick={save} disabled={busy}>
              {busy ? 'Saving...' : (editingId ? 'Update Privilege' : 'Assign & Notify')}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL YA KUONA NOTIFICATIONS LOGS */}
      <Modal open={viewLogsModal} onClose={() => setViewLogsModal(false)} title="Notification Delivery Logs">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {selectedLogs.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-4">Hakuna ujumbe uliotumwa bado.</p>
          ) : (
            selectedLogs.map((log, idx) => (
              <div key={idx} className="p-3 border border-gray-200 rounded bg-slate-50 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold uppercase text-xs">{log.channel}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {log.status}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{log.message}</p>
                <p className="text-[10px] text-gray-400 mt-2 font-mono">Sent At: {log.sent_at}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end pt-4 border-t border-gray-100 mt-2">
          <button className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase rounded-sm" onClick={() => setViewLogsModal(false)}>{t('Close Logs')}</button>
        </div>
      </Modal>
      </>
      )}
    </div>
  )
}