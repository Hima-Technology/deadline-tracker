import { useEffect, useState } from 'react'
import api, { errMsg } from '../api/client'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import Swal from 'sweetalert2'
import type { User } from '../types'

const empty = { name: '', email: '', phone: '', password: '', role: 'staff' as 'staff' | 'admin' }

export default function Staff() {
  const [rows, setRows] = useState<User[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')

  // State ya Ku-view Mtumiaji
  const [viewUser, setViewUser] = useState<User | null>(null)

  const [toast, setToast] = useState({ show: false, message: '', type: 'loading' as 'loading' | 'success' | 'error' })

  function showToast(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
    setToast({ show: true, message, type })
    if (type !== 'loading') {
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000)
    }
  }

  async function load() {
    try {
      const r = await api.get('/users')
      setRows(r.data.data)
    } catch (e) { setError(errMsg(e)) }
  }
  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null); setForm(empty); setModal(true); setError('')
  }
  function openEdit(u: User) {
    setEditing(u)
    setForm({ name: u.name, email: u.email, phone: u.phone || '', password: '', role: u.role })
    setModal(true); setError('')
  }

  async function save() {
    setBusy(true); setError('')
    showToast(editing ? 'UPDATING OPERATOR...' : 'REGISTERING OPERATOR...', 'loading')
    
    try {
      if (editing) {
        const payload: any = { name: form.name, phone: form.phone, role: form.role }
        if (form.password) payload.password = form.password
        await api.put(`/users/${editing.id}`, payload)
        showToast('OPERATOR UPDATED', 'success')
      } else {
        await api.post('/users', form)
        showToast('NEW OPERATOR REGISTERED', 'success')
      }
      setModal(false); 
      load()
    } catch (e) { 
      setError(errMsg(e))
      showToast('ACTION FAILED', 'error')
    } finally { 
      setBusy(false) 
    }
  }

  async function remove(u: User) {
    const result = await Swal.fire({
      title: 'Delete Operator?',
      text: `Are you sure you want to delete ${u.name}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-xl shadow-2xl font-sans' }
    })

    if (!result.isConfirmed) return
    
    showToast('DELETING OPERATOR...', 'loading')
    try { 
      await api.delete(`/users/${u.id}`)
      showToast('OPERATOR DELETED', 'success')
      load() 
    }
    catch (e) { 
      Swal.fire('Error!', errMsg(e), 'error')
      showToast('DELETE FAILED', 'error')
    }
  }

  async function toggleStatus(u: User) {
    const isBlocking = u.is_active
    const actionText = isBlocking ? 'Block' : 'Activate'

    const result = await Swal.fire({
      title: `${actionText} Operator?`,
      text: isBlocking 
        ? `If you block ${u.name}, they will no longer be able to log in.` 
        : `Are you sure you want to reactivate ${u.name}?`,
      icon: isBlocking ? 'warning' : 'info',
      showCancelButton: true,
      confirmButtonColor: isBlocking ? '#f59e0b' : '#06b6d4',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Yes, ${actionText.toLowerCase()}!`,
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-xl shadow-2xl font-sans' }
    })

    if (!result.isConfirmed) return

    showToast(`${actionText.toUpperCase()}ING OPERATOR...`, 'loading')
    try {
      // Hapa ndipo tunapotuma is_active mpya
      await api.put(`/users/${u.id}`, { is_active: !u.is_active })
      showToast(`OPERATOR ${isBlocking ? 'BLOCKED' : 'ACTIVATED'}`, 'success')
      load()
    } catch (e) {
      Swal.fire('Server Error!', errMsg(e), 'error')
      showToast('ACTION FAILED', 'error')
    }
  }

  const filteredRows = rows.filter((u) => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 relative">
      
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-cyan-100/50 text-cyan-800 text-[10px] uppercase tracking-widest font-bold border border-cyan-200">SYS.OPS // PERSONNEL</span>
            <span className="text-gray-400 text-[10px]">//</span>
            <span className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">DATA: USERS</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk] uppercase">Staff Management</h2>
        </div>
        
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all text-xs font-bold uppercase active:scale-95" 
          onClick={openCreate}
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          Add Operator
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 border border-red-200 rounded text-sm font-mono">{error}</div>}

      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-gray-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search operator by name or email..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          Displaying {filteredRows.length} of {rows.length} operators
        </div>
      </div>

      {/* JEDWALI */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 font-semibold">Operator Name</th>
              <th className="px-4 py-4 font-semibold">Comms (Email)</th>
              <th className="px-4 py-4 font-semibold">Phone</th>
              <th className="px-4 py-4 font-semibold text-center">Clearance (Role)</th>
              <th className="px-4 py-4 font-semibold text-center">Status</th>
              <th className="px-4 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.map((u) => (
              <tr key={u.id} className={`hover:bg-slate-50/70 transition-colors group ${!u.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-bold ${u.is_active ? 'bg-cyan-500' : 'bg-gray-400'}`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  {u.name}
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.phone || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                    u.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider ${
                    u.is_active ? 'text-green-600' : 'text-red-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {u.is_active ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap flex justify-end gap-1">
                  
                  {/* KITUFE CHA VIEW (MACHO) */}
                  <button 
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" 
                    onClick={() => setViewUser(u)}
                    title="View Profile"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </button>

                  {/* KITUFE CHA BLOCK/ACTIVATE */}
                  <button 
                    className={`p-1.5 rounded transition-colors ${
                      u.is_active 
                        ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50' 
                        : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                    }`}
                    onClick={() => toggleStatus(u)}
                    title={u.is_active ? 'Block Operator' : 'Activate Operator'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {u.is_active ? 'lock' : 'lock_open'}
                    </span>
                  </button>

                  <button 
                    className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors" 
                    onClick={() => openEdit(u)}
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  
                  <button 
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                    onClick={() => remove(u)}
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-12 font-mono text-xs uppercase">
                  No operator telemetry found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL YA KUONGEZA / KUHARIRI */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Operator Profile' : 'Register New Operator'}>
         {/* ... (Code ile ile ya fomu iliyopita) ... */}
         <div className="space-y-4">
          {error && <div className="text-xs text-red-600 bg-red-50 p-2 border border-red-100 rounded font-mono">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Full Name</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Phone Number</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Email Address</label>
            <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm disabled:opacity-50" type="email" value={form.email} disabled={!!editing} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {editing && <p className="text-[10px] text-gray-400 mt-1 font-mono">Email cannot be changed</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Clearance Level (Role)</label>
              <select className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm uppercase font-bold text-slate-700" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{editing ? 'New Password (Optional)' : 'Password'}</label>
              <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" type="password" value={form.password} placeholder={editing ? "••••••••" : ""} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
            <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 transition-colors rounded-sm" onClick={() => setModal(false)}>Cancel</button>
            <button className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 transition-colors shadow-sm rounded-sm flex items-center gap-2 disabled:opacity-50" onClick={save} disabled={busy}>
              {busy ? <><span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>Saving...</> : 'Save Operator'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL YA KU-VIEW MTUMIAJI (MPYA) */}
      <Modal open={!!viewUser} onClose={() => setViewUser(null)} title="Operator Profile Record">
        {viewUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-gray-200 rounded-sm">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl text-white font-bold ${viewUser.is_active ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-400'}`}>
                {viewUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 uppercase font-[Space_Grotesk]">{viewUser.name}</h3>
                <p className="text-xs font-mono text-gray-500">{viewUser.role.toUpperCase()} // {viewUser.is_active ? 'ACTIVE' : 'BLOCKED'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 border border-gray-100 bg-white">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Email Address</span>
                <span className="text-sm font-semibold text-slate-700 font-mono break-all">{viewUser.email}</span>
              </div>
              <div className="p-3 border border-gray-100 bg-white">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Phone Number</span>
                <span className="text-sm font-semibold text-slate-700 font-mono">{viewUser.phone || 'NOT PROVIDED'}</span>
              </div>
              <div className="p-3 border border-gray-100 bg-white sm:col-span-2">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">System Registered ID</span>
                <span className="text-sm font-semibold text-slate-700 font-mono">OP-{viewUser.id.toString().padStart(4, '0')}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button className="px-6 py-2 bg-slate-800 text-white text-xs font-bold uppercase hover:bg-slate-700 transition-colors shadow-sm rounded-sm" onClick={() => setViewUser(null)}>Close Record</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}