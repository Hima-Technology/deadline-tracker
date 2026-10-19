import { useEffect, useState } from 'react'
import api, { errMsg } from '../api/client'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import Swal from 'sweetalert2'
import type { Client } from '../types'

// Tumeongeza vigezo vipya hapa
const empty = { 
  company_name: '', contact_person: '', phone: '', email: '', notes: '',
  contract_start_date: '', contract_end_date: '', service_type: 'Audit',
  total_contract_amount: 0, amount_paid: 0, assessment_info: ''
}

export default function Clients() {
  const [rows, setRows] = useState<Client[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')

  // State ya Ku-view Mteja
  const [viewClient, setViewClient] = useState<Client | null>(null)

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
      const r = await api.get('/clients')
      setRows(r.data.data)
    } catch (e) { setError(errMsg(e)) }
  }
  useEffect(() => { load() }, [])

  function openCreate() { 
    setEditing(null); setForm(empty); setModal(true); setError('') 
  }
  
  function openEdit(c: Client) {
    setEditing(c)
    setForm({
      company_name: c.company_name,
      contact_person: c.contact_person || '',
      phone: c.phone || '',
      email: c.email || '',
      notes: c.notes || '',
      // Hapa tunavuta data mpya kutoka kwenye database
      contract_start_date: (c as any).contract_start_date || '',
      contract_end_date: (c as any).contract_end_date || '',
      service_type: (c as any).service_type || 'Audit',
      total_contract_amount: (c as any).total_contract_amount || 0,
      amount_paid: (c as any).amount_paid || 0,
      assessment_info: (c as any).assessment_info || '',
    })
    setModal(true); setError('')
  }

  async function save() {
    setBusy(true); setError('')
    showToast(editing ? 'UPDATING CLIENT...' : 'REGISTERING CLIENT...', 'loading')
    
    try {
      if (editing) {
        await api.put(`/clients/${editing.id}`, form)
        showToast('CLIENT UPDATED', 'success')
      } else {
        await api.post('/clients', form)
        showToast('NEW CLIENT REGISTERED', 'success')
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

  async function remove(c: Client) {
    const result = await Swal.fire({
      title: 'Delete Client?',
      text: `Are you sure you want to delete ${c.company_name}? All associated obligations will also be removed.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-xl shadow-2xl font-sans' }
    })

    if (!result.isConfirmed) return

    showToast('DELETING CLIENT...', 'loading')
    try { 
      await api.delete(`/clients/${c.id}`)
      showToast('CLIENT DELETED', 'success')
      load() 
    }
    catch (e) { 
      Swal.fire('Error!', errMsg(e), 'error')
      showToast('DELETE FAILED', 'error')
    }
  }

  // Filter data kwa Search
  const filteredRows = rows.filter((c) => 
    c.company_name.toLowerCase().includes(search.toLowerCase()) || 
    (c.contact_person && c.contact_person.toLowerCase().includes(search.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6 relative">
      
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* HEADER YA UKURASA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-cyan-100/50 text-cyan-800 text-[10px] uppercase tracking-widest font-bold border border-cyan-200">SYS.OPS // ENTITIES</span>
            <span className="text-gray-400 text-[10px]">//</span>
            <span className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">DATA: CLIENTS</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk] uppercase">Client Directory</h2>
        </div>
        
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all text-xs font-bold uppercase active:scale-95" 
          onClick={openCreate}
        >
          <span className="material-symbols-outlined text-[16px]">domain_add</span>
          Add Client
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 border border-red-200 rounded text-sm font-mono">{error}</div>}

      {/* SEARCH BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-gray-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search client by company, contact, or email..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          Displaying {filteredRows.length} of {rows.length} clients
        </div>
      </div>

      {/* JEDWALI LA CLIENTS */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 font-semibold">Company Name</th>
              <th className="px-4 py-4 font-semibold">Contact Person</th>
              <th className="px-4 py-4 font-semibold">Contract Expiry</th>
              <th className="px-4 py-4 font-semibold text-right">Balance (TZS)</th>
              <th className="px-4 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.map((c) => {
              const total = (c as any).total_contract_amount || 0;
              const paid = (c as any).amount_paid || 0;
              const balance = total - paid;
              const isExpired = (c as any).contract_end_date && new Date((c as any).contract_end_date) < new Date();

              return (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 border border-gray-200 flex items-center justify-center text-cyan-600">
                      <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
                    </div>
                    {c.company_name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.contact_person || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono ${isExpired ? 'text-red-500 font-bold' : 'text-slate-600'}`}>
                      {(c as any).contract_end_date || '—'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-xs font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {balance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap flex justify-end gap-1">
                    
                    {/* KITUFE CHA VIEW */}
                    <button 
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" 
                      onClick={() => setViewClient(c)}
                      title="View Details"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>

                    <button 
                      className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors" 
                      onClick={() => openEdit(c)}
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    
                    <button 
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                      onClick={() => remove(c)}
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              )
            })}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-12 font-mono text-xs uppercase">
                  No client telemetry found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL YA KUONGEZA / KUHARIRI */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Client Record' : 'Register New Client'}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {error && <div className="text-xs text-red-600 bg-red-50 p-2 border border-red-100 rounded font-mono">{error}</div>}
          
          {/* 1. Taarifa za Msingi */}
          <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-wider border-b border-gray-100 pb-1">1. Company Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Company Name</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" 
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Contact Person</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" 
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Phone</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" 
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Email</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" 
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
              />
            </div>
          </div>

          {/* 2. Taarifa za Mkataba */}
          <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-wider border-b border-gray-100 pb-1 mt-6">2. Contract Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Service Type</label>
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm"
                value={form.service_type} 
                onChange={(e) => setForm({ ...form, service_type: e.target.value })}
              >
                <option value="Audit">Audit</option>
                <option value="Tax">Tax</option>
                <option value="Registration">Registration</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Contract Start</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" 
                type="date" 
                value={form.contract_start_date} 
                onChange={(e) => setForm({ ...form, contract_start_date: e.target.value })} 
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Contract End (Renewal)</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" 
                type="date" 
                value={form.contract_end_date} 
                onChange={(e) => setForm({ ...form, contract_end_date: e.target.value })} 
              />
            </div>
          </div>

          {/* 3. Fedha */}
          <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-wider border-b border-gray-100 pb-1 mt-6">3. Financial Records</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Total Contract Amount (TZS)</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" 
                type="number" 
                value={form.total_contract_amount} 
                onChange={(e) => setForm({ ...form, total_contract_amount: Number(e.target.value) })} 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Amount Paid (TZS)</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" 
                type="number" 
                value={form.amount_paid} 
                onChange={(e) => setForm({ ...form, amount_paid: Number(e.target.value) })} 
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Remaining Balance</label>
              <div className={`p-2 border rounded font-mono font-bold text-lg ${form.total_contract_amount - form.amount_paid > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                TZS {(form.total_contract_amount - form.amount_paid).toLocaleString()}
              </div>
            </div>
          </div>

          {/* 4. Assessment & Notes */}
          <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-wider border-b border-gray-100 pb-1 mt-6">4. Assessment Info</h4>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Assessment Notes (TRA/ZRA/BPRA Records)</label>
            <textarea 
              className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" 
              rows={3} 
              value={form.assessment_info} 
              onChange={(e) => setForm({ ...form, assessment_info: e.target.value })} 
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
            <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 transition-colors rounded-sm" onClick={() => setModal(false)}>
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 transition-colors shadow-sm rounded-sm flex items-center gap-2 disabled:opacity-50" 
              onClick={save} 
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                  Saving...
                </>
              ) : (
                'Save Client'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL YA KU-VIEW CLIENT */}
      <Modal open={!!viewClient} onClose={() => setViewClient(null)} title="Client Record Details">
        {viewClient && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-gray-200 rounded-sm">
              <div className="w-16 h-16 rounded bg-white border border-gray-200 flex items-center justify-center text-cyan-500 shadow-sm">
                <span className="material-symbols-outlined text-3xl">corporate_fare</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 uppercase font-[Space_Grotesk]">{viewClient.company_name}</h3>
                <p className="text-xs font-mono text-gray-500">CLIENT ID: SBC-{viewClient.id.toString().padStart(4, '0')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 border border-gray-100 bg-white sm:col-span-2">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Service & Contract</span>
                <span className="text-sm font-semibold text-slate-700 capitalize">
                  {(viewClient as any).service_type || 'N/A'} ({(viewClient as any).contract_start_date || 'N/A'} to {(viewClient as any).contract_end_date || 'N/A'})
                </span>
              </div>
              <div className="p-3 border border-gray-100 bg-white">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Total Amount</span>
                <span className="text-sm font-semibold text-slate-700 font-mono">TZS {((viewClient as any).total_contract_amount || 0).toLocaleString()}</span>
              </div>
              <div className="p-3 border border-gray-100 bg-white">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Amount Paid</span>
                <span className="text-sm font-semibold text-green-600 font-mono">TZS {((viewClient as any).amount_paid || 0).toLocaleString()}</span>
              </div>
              <div className="p-3 border border-gray-100 bg-white sm:col-span-2">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Assessment Info</span>
                <span className="text-sm text-slate-600 whitespace-pre-wrap">{(viewClient as any).assessment_info || 'No assessment available.'}</span>
              </div>
              
              <div className="p-3 border border-gray-100 bg-white sm:col-span-2">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Contact</span>
                <span className="text-sm font-semibold text-slate-700">{viewClient.contact_person} - {viewClient.phone}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button className="px-6 py-2 bg-slate-800 text-white text-xs font-bold uppercase hover:bg-slate-700 transition-colors shadow-sm rounded-sm" onClick={() => setViewClient(null)}>Close Record</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}