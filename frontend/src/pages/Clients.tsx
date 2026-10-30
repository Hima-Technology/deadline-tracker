import { useEffect, useState } from 'react'
import api, { errMsg } from '../api/client'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import Swal from 'sweetalert2'
import type { Client, User } from '../types'

// ---------- Helpers ----------
function formatNumber(val: number | string): string {
  const num = typeof val === 'string' ? parseInt(val.replace(/,/g, ''), 10) : val
  if (isNaN(num)) return '0'
  return num.toLocaleString('en-US')
}
function parseNumber(val: string): number {
  return parseInt(val.replace(/,/g, ''), 10) || 0
}

// ---------- Role types ----------
const ROLE_TYPES = [
  { value: 'tra_only',         label: 'TRA Only (Fungua/Funga TRA)' },
  { value: 'zra_only',         label: 'ZRA Only' },
  { value: 'bpra_only',        label: 'BPRA Only' },
  { value: 'zssf_only',        label: 'ZSSF Only' },
  { value: 'tra_annual',       label: 'TRA Annual Return' },
  { value: 'zra_annual',       label: 'ZRA Annual Return' },
  { value: 'bpra_annual',      label: 'BPRA Annual Return' },
  { value: 'zssf_annual',      label: 'ZSSF Annual Return' },
  { value: 'all_authorities',  label: 'All Authorities' },
  { value: 'upload_only',      label: 'Upload Report Only' },
  { value: 'view_only',        label: 'View Only' },
]

const PASSWORD_FIELDS = [
  { key: 'tra_password',  label: 'TRA Password' },
  { key: 'zra_password',  label: 'ZRA Password' },
  { key: 'bpra_password', label: 'BPRA Password' },
  { key: 'zssf_password', label: 'ZSSF Password' },
]

// ---------- Empty form ----------
const empty = {
  company_name: '', contact_person: '', phone: '', email: '', notes: '',
  contract_start_date: '', contract_end_date: '', service_type: 'Audit',
  total_contract_amount: 0, amount_paid: 0, assessment_info: '',
  location: 'Mainland', industry: '', financial_year_start: '',

  tra_number: '', tra_username: '', tra_password: '', tra_phone: '',
  tra_reg_date: '', tra_start_date: '', tra_end_date: '', tra_attachment: null as File | null,

  zra_number: '', zra_username: '', zra_password: '', zra_phone: '',
  zra_reg_date: '', zra_start_date: '', zra_end_date: '', zra_attachment: null as File | null,

  bpra_number: '', bpra_username: '', bpra_password: '',
  bpra_reg_date: '', bpra_start_date: '', bpra_end_date: '', bpra_attachment: null as File | null,

  zssf_number: '', zssf_username: '', zssf_password: '',
  zssf_reg_date: '', zssf_start_date: '', zssf_end_date: '', zssf_attachment: null as File | null,
}

// ---------- Assignment row type ----------
type Assignment = {
  id?: number
  staff_id: number
  role_type: string
  can_view_passwords: string[]
  can_upload: boolean
  staff_name?: string
  staff_email?: string
  staff_role?: string
}

type Tab = 'general' | 'tra' | 'zra' | 'bpra' | 'zssf' | 'finance' | 'roles'

const tabs: { key: Tab; label: string; color: string; icon: string }[] = [
  { key: 'general', label: 'General Info', color: 'bg-slate-500',   icon: 'info' },
  { key: 'tra',     label: 'TRA',          color: 'bg-blue-600',    icon: 'account_balance' },
  { key: 'zra',     label: 'ZRA',          color: 'bg-emerald-600', icon: 'account_balance_wallet' },
  { key: 'bpra',    label: 'BPRA',         color: 'bg-purple-600',  icon: 'domain' },
  { key: 'zssf',    label: 'ZSSF',         color: 'bg-orange-500',  icon: 'groups' },
  { key: 'finance', label: 'Finance',      color: 'bg-amber-500',   icon: 'payments' },
  { key: 'roles',   label: 'Staff Roles',  color: 'bg-indigo-600',  icon: 'badge' },
]

export default function Clients() {
  const [rows, setRows]     = useState<Client[]>([])
  const [staff, setStaff]   = useState<User[]>([])
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm]     = useState(empty)
  const [error, setError]   = useState('')
  const [busy, setBusy]     = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('general')
  
  const [viewClient, setViewClient] = useState<Client | null>(null)
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)
  
  // State za Password Security
  const [revealModal, setRevealModal] = useState(false)
  const [sysPassword, setSysPassword] = useState('')
  const [revealedData, setRevealedData] = useState<any>(null)
  const [revealBusy, setRevealBusy] = useState(false)
  const [revealError, setRevealError] = useState('')

  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [toast, setToast] = useState({ show: false, message: '', type: 'loading' as 'loading' | 'success' | 'error' })
  function showToast(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
    setToast({ show: true, message, type })
    if (type !== 'loading') setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  async function load() {
    try {
      const [c, u] = await Promise.all([api.get('/clients'), api.get('/users')])
      setRows(c.data.data || [])
      setStaff(u.data.data || [])
    } catch (e) { setError(errMsg(e)) }
  }
  useEffect(() => { load() }, [])

  async function loadPermissions(clientId: number) {
    try {
      const r = await api.get(`/clients/${clientId}/permissions`)
      const data = r.data?.data || []
      setAssignments(data.map((p: any) => ({
        id: p.id, staff_id: p.staff_id, role_type: p.role_type,
        can_view_passwords: p.can_view_passwords || [],
        can_upload: !!p.can_upload,
        staff_name: p.staff_name, staff_email: p.staff_email, staff_role: p.staff_role,
      })))
    } catch { setAssignments([]) }
  }

  function openCreate() {
    setEditing(null); setForm(empty); setAssignments([])
    setActiveTab('general'); setModal(true); setError('')
  }

  function openEdit(c: Client) {
    if (!c || !c.id) return showToast('Invalid client data', 'error')
    setEditing(c)
    setForm({
      company_name: c.company_name,
      contact_person: c.contact_person || '',
      phone: c.phone || '',
      email: c.email || '',
      notes: c.notes || '',
      contract_start_date: (c as any).contract_start_date || '',
      contract_end_date: (c as any).contract_end_date || '',
      service_type: (c as any).service_type || 'Audit',
      total_contract_amount: (c as any).total_contract_amount || 0,
      amount_paid: (c as any).amount_paid || 0,
      assessment_info: (c as any).assessment_info || '',
      location: (c as any).location || 'Mainland',
      industry: (c as any).industry || '',
      financial_year_start: (c as any).financial_year_start || '',

      tra_number: (c as any).tra_number || '',
      tra_username: (c as any).tra_username || '',
      tra_password: (c as any).tra_password || '',
      tra_phone: (c as any).tra_phone || '',
      tra_reg_date: (c as any).tra_reg_date || '',
      tra_start_date: (c as any).tra_start_date || '',
      tra_end_date: (c as any).tra_end_date || '',
      tra_attachment: null,

      zra_number: (c as any).zra_number || '',
      zra_username: (c as any).zra_username || '',
      zra_password: (c as any).zra_password || '',
      zra_phone: (c as any).zra_phone || '',
      zra_reg_date: (c as any).zra_reg_date || '',
      zra_start_date: (c as any).zra_start_date || '',
      zra_end_date: (c as any).zra_end_date || '',
      zra_attachment: null,

      bpra_number: (c as any).bpra_number || '',
      bpra_username: (c as any).bpra_username || '',
      bpra_password: (c as any).bpra_password || '',
      bpra_reg_date: (c as any).bpra_reg_date || '',
      bpra_start_date: (c as any).bpra_start_date || '',
      bpra_end_date: (c as any).bpra_end_date || '',
      bpra_attachment: null,

      zssf_number: (c as any).zssf_number || '',
      zssf_username: (c as any).zssf_username || '',
      zssf_password: (c as any).zssf_password || '',
      zssf_reg_date: (c as any).zssf_reg_date || '',
      zssf_start_date: (c as any).zssf_start_date || '',
      zssf_end_date: (c as any).zssf_end_date || '',
      zssf_attachment: null,
    })
    loadPermissions(c.id)
    setActiveTab('general'); setModal(true); setError('')
    setRevealedData(null) // Reset revealed data
  }

  async function save() {
    setBusy(true); setError('')
    showToast(editing ? 'UPDATING CLIENT...' : 'REGISTERING CLIENT...', 'loading')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v === null || v === undefined) return
        
        if (v instanceof File) { 
          fd.append(k, v); 
          return 
        }
        
        if (typeof v === 'string') {
          if (k.endsWith('_password') && v === '') return 
          fd.append(k, v)
          return
        }
        
        if (typeof v === 'number') fd.append(k, String(v))
      })

      let clientId = editing?.id

      if (editing) {
        fd.append('_method', 'PUT')
        await api.post(`/clients/${editing.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        const r = await api.post('/clients', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        let responseData = r.data;
        if (typeof responseData === 'string') {
          const jsonStart = responseData.indexOf('{');
          if (jsonStart !== -1) {
            try { responseData = JSON.parse(responseData.substring(jsonStart)); } catch (e) {}
          }
        }
        
        if (responseData?.data?.id) {
          clientId = responseData.data.id;
        } else if (responseData?.id) {
          clientId = responseData.id;
        } else if (typeof responseData === 'number') {
          clientId = responseData;
        } else {
          throw new Error("Server haikurudisha ID ya mteja mpya.");
        }
      }

      if (clientId && assignments.length >= 0) {
        await api.post(`/clients/${clientId}/permissions`, {
          assignments: assignments.map(a => ({
            staff_id: a.staff_id,
            role_type: a.role_type,
            can_view_passwords: a.can_view_passwords,
            can_upload: a.can_upload,
          })),
        })
      }

      showToast(editing ? 'CLIENT UPDATED' : 'NEW CLIENT REGISTERED', 'success')
      setModal(false); load()
    } catch (e: any) {
      console.error("SAVE ERROR:", e)
      setError(errMsg(e)); showToast('ACTION FAILED', 'error')
    } finally { setBusy(false) }
  }

  async function remove(c: Client) {
    const r = await Swal.fire({
      title: 'Delete Client?',
      text: `Are you sure you want to delete ${c.company_name}?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!', cancelButtonText: 'Cancel',
    })
    if (!r.isConfirmed) return
    showToast('DELETING CLIENT...', 'loading')
    try { await api.delete(`/clients/${c.id}`); showToast('CLIENT DELETED', 'success'); load() }
    catch (e) { Swal.fire('Error!', errMsg(e), 'error'); showToast('DELETE FAILED', 'error') }
  }

  function addAssignment() {
    setAssignments(a => [...a, { staff_id: 0, role_type: 'tra_only', can_view_passwords: [], can_upload: false }])
  }
  function updateAssignment(idx: number, patch: Partial<Assignment>) {
    setAssignments(a => a.map((x, i) => i === idx ? { ...x, ...patch } : x))
  }
  function removeAssignment(idx: number) {
    setAssignments(a => a.filter((_, i) => i !== idx))
  }

  async function handleRevealPasswords() {
    if (!sysPassword) {
      setRevealError('Weka password yako ya mfumo')
      return
    }
    setRevealBusy(true); setRevealError('')
    
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const r = await api.post(`${base}/clients/${viewClient?.id}/passwords`, { system_password: sysPassword })
      
      setRevealedData(r.data.data)
      setRevealModal(false)
      setSysPassword('')
      showToast('Password zimefunguliwa', 'success')
    } catch (e: any) {
      console.error("REVEAL ERROR:", e.response || e)
      setRevealError(errMsg(e))
    } finally {
      setRevealBusy(false)
    }
  }

  const filteredRows = rows.filter(c =>
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.contact_person || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 relative">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

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
          onClick={openCreate}>
          <span className="material-symbols-outlined text-[16px]">domain_add</span>
          Add Client
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 border border-red-200 rounded text-sm font-mono">{error}</div>}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-gray-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
          <input type="text" placeholder="Search client by company, contact, or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          Displaying {filteredRows.length} of {rows.length} clients
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 font-semibold">Company Name</th>
              <th className="px-4 py-4 font-semibold">Location</th>
              <th className="px-4 py-4 font-semibold">Contact</th>
              <th className="px-4 py-4 font-semibold text-right">Balance (TZS)</th>
              <th className="px-4 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.map(c => {
              const total   = Number((c as any).total_contract_amount || 0)
              const paid    = Number((c as any).amount_paid || 0)
              const balance = total - paid
              return (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 border border-gray-200 flex items-center justify-center text-cyan-600">
                      <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
                    </div>
                    <span>{c.company_name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{(c as any).location || 'Mainland'}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.contact_person || '—'}</td>
                  <td className={`px-4 py-3 text-right font-mono text-xs font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatNumber(balance)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      <button
                        className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                        onClick={() => setViewClient(c)}
                        title="View Details">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        onClick={() => openEdit(c)} title="Edit">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        onClick={() => remove(c)} title="Delete">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filteredRows.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-400 py-12 font-mono text-xs uppercase">No clients found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* VIEW MODAL */}
      <Modal open={!!viewClient} onClose={() => {
        setViewClient(null)
        setRevealedData(null)
        setRevealModal(false)
        setSysPassword('')
      }} title="Client Details">
        {viewClient && (() => {
          const v: any = viewClient
          
          const Row = ({ label, value }: any) => (
            <div className="flex justify-between border-b border-gray-100 py-1.5 text-xs">
              <span className="text-slate-500 uppercase font-mono">{label}</span>
              <span className="text-slate-800 font-semibold text-right ml-2 break-all">
                {value || <span className="text-gray-300 italic">—</span>}
              </span>
            </div>
          )

          const PasswordRow = ({ label, field }: { label: string, field: string }) => {
            const val = revealedData ? revealedData[field] : '••••••••';
            
            if (!v[field] && !val) return (
              <div className="flex justify-between border-b border-gray-100 py-1.5 text-xs">
                <span className="text-slate-500 uppercase font-mono">{label}</span>
                <span className="text-gray-300 italic">—</span>
              </div>
            );

            return (
              <div className="flex justify-between border-b border-gray-100 py-1.5 text-xs items-center">
                <span className="text-slate-500 uppercase font-mono">{label}</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {val || '—'}
                </span>
              </div>
            );
          };
          
          return (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-gray-200 rounded-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded bg-white border border-gray-200 flex items-center justify-center text-cyan-500 shadow-sm">
                    <span className="material-symbols-outlined text-2xl">corporate_fare</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 uppercase font-[Space_Grotesk]">{v.company_name}</h3>
                    <p className="text-xs font-mono text-gray-500">ID: SBC-{v.id?.toString().padStart(4, '0') || '----'}</p>
                  </div>
                </div>
                
                {!revealedData && (
                  <button 
                    onClick={() => setRevealModal(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold uppercase rounded-sm hover:bg-slate-700"
                  >
                    <span className="material-symbols-outlined text-[16px]">lock_open</span>
                    Reveal Passwords
                  </button>
                )}
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-2 border-b pb-1">General Info</h4>
                <Row label="Location" value={v.location} />
                <Row label="Industry" value={v.industry} />
                <Row label="Contact Person" value={v.contact_person} />
                <Row label="Phone" value={v.phone} />
                <Row label="Email" value={v.email} />
                <Row label="Financial Year Start" value={v.financial_year_start} />
              </div>

              {(['tra','zra','bpra','zssf'] as const).map(a => (
                <div key={a}>
                  <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 border-b pb-1 ${
                    a==='tra' ? 'text-blue-600' : a==='zra' ? 'text-emerald-600'
                    : a==='bpra' ? 'text-purple-600' : 'text-orange-600'
                  }`}>{a.toUpperCase()}</h4>
                  <Row label="Number" value={v[`${a}_number`]} />
                  <Row label="Username" value={v[`${a}_username`]} />
                  
                  <PasswordRow label="Password" field={`${a}_password`} />
                  
                  <Row label="Reg Date" value={v[`${a}_reg_date`]} />
                  <Row label="Start Date" value={v[`${a}_start_date`]} />
                  <Row label="End Date" value={v[`${a}_end_date`]} />
                  
                  {v[`${a}_attachment`] && (
                    <div className="flex justify-between border-b border-gray-100 py-1.5 text-xs items-center">
                      <span className="text-slate-500 uppercase font-mono">Attachment</span>
                      <button 
                        onClick={() => {
                          let file = v[`${a}_attachment`];
                          if (Array.isArray(file)) file = file[0];
                          if (typeof file === 'string' && (file.startsWith('[') || file.startsWith('{'))) {
                            try {
                              const parsed = JSON.parse(file);
                              if (Array.isArray(parsed)) file = parsed[0];
                              else if (typeof parsed === 'string') file = parsed;
                            } catch (e) {}
                          }
                          if (typeof file === 'string') {
                            file = file.replace(/^\[|\]$/g, '').replace(/["']/g, '').trim();
                          }
                          if (!file || typeof file !== 'string' || file === 'Array') {
                            alert("Attachment haipo au ni batili. Tafadhali pakia tena.");
                            return;
                          }
                          const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
                          setPdfPreview(`${base}/files/uploads/clients/${file}`);
                        }}
                        className="flex items-center gap-1 text-cyan-600 hover:text-cyan-800 font-bold bg-cyan-50 px-2 py-1 rounded"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        View File
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div>
                <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2 border-b pb-1">Finance</h4>
                <Row label="Contract Amount" value={`TZS ${formatNumber(v.total_contract_amount || 0)}`} />
                <Row label="Amount Paid" value={`TZS ${formatNumber(v.amount_paid || 0)}`} />
                <Row label="Balance" value={`TZS ${formatNumber((v.total_contract_amount||0) - (v.amount_paid||0))}`} />
              </div>

              <div className="flex justify-end pt-2">
                <button className="px-6 py-2 bg-slate-800 text-white text-xs font-bold uppercase hover:bg-slate-700 rounded-sm"
                  onClick={() => {
                    setViewClient(null)
                    setRevealedData(null)
                  }}>Close Record</button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* MODAL YA KUWEKA SYSTEM PASSWORD ILI KUFUNUA */}
      <Modal open={revealModal} onClose={() => setRevealModal(false)} title="Security Check">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Ili kuona password za mteja, tafadhali weka password yako ya mfumo (System Password).
          </p>
          
          {revealError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{revealError}</div>}
          
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">System Password</label>
            <input 
              type="password" 
              className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono focus:border-cyan-500 focus:outline-none"
              value={sysPassword} 
              onChange={e => setSysPassword(e.target.value)} 
              placeholder="Weka password yako..."
              autoFocus
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 rounded-sm"
              onClick={() => setRevealModal(false)}>Cancel</button>
            <button 
              className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 rounded-sm flex items-center gap-2 disabled:opacity-50"
              onClick={handleRevealPasswords} 
              disabled={revealBusy}
            >
              {revealBusy ? 'Checking...' : 'Reveal'}
            </button>
          </div>
        </div>
      </Modal>

      {/* PDF PREVIEW MODAL */}
      <Modal open={!!pdfPreview} onClose={() => setPdfPreview(null)} title="Document Preview">
        {pdfPreview && (
          <div className="space-y-4">
            <iframe 
              src={pdfPreview} 
              className="w-full h-[65vh] border border-gray-200 rounded-sm bg-gray-50"
              title="PDF Preview"
            />
            <div className="flex justify-between items-center">
              <a 
                href={pdfPreview} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-cyan-600 hover:underline font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Fungua kwenye Tab Mpya
              </a>
              <button className="px-6 py-2 bg-slate-800 text-white text-xs font-bold uppercase hover:bg-slate-700 rounded-sm"
                onClick={() => setPdfPreview(null)}>Funga</button>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE/EDIT MODAL */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Client' : 'Register New Client'}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {error && <div className="text-xs text-red-600 bg-red-50 p-2 border border-red-100 rounded font-mono">{error}</div>}

          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider font-mono transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === t.key ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-gray-500 hover:text-slate-800'
                }`}>{t.label}</button>
            ))}
          </div>

          {activeTab === 'general' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-wider border-b border-gray-100 pb-1">Company Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Company Name</label>
                  <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                    value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Location</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                    value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}>
                    <option value="Mainland">Mainland Tanzania</option>
                    <option value="Zanzibar">Zanzibar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Industry</label>
                  <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                    value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Financial Year Start</label>
                  <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={form.financial_year_start} onChange={e => setForm({ ...form, financial_year_start: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Contact Person</label>
                  <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                    value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Phone</label>
                  <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Email</label>
                  <input type="email" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {(['tra','zra','bpra','zssf'] as const).map(a => activeTab === a && (
            <div key={a} className="space-y-4">
              <h4 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${
                a==='tra'?'text-blue-600':a==='zra'?'text-emerald-600':a==='bpra'?'text-purple-600':'text-orange-600'
              }`}>{a.toUpperCase()} Credentials & Dates</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{a.toUpperCase()} Number</label>
                  <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={(form as any)[`${a}_number`]} onChange={e => setForm({ ...form, [`${a}_number`]: e.target.value } as any)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{a.toUpperCase()} Registration Date</label>
                  <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={(form as any)[`${a}_reg_date`]} onChange={e => setForm({ ...form, [`${a}_reg_date`]: e.target.value } as any)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{a.toUpperCase()} Start Date</label>
                  <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={(form as any)[`${a}_start_date`]} onChange={e => setForm({ ...form, [`${a}_start_date`]: e.target.value } as any)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{a.toUpperCase()} End Date</label>
                  <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={(form as any)[`${a}_end_date`]} onChange={e => setForm({ ...form, [`${a}_end_date`]: e.target.value } as any)} />
                </div>
                {(a === 'tra' || a === 'zra') && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{a.toUpperCase()} Phone</label>
                    <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                      value={(form as any)[`${a}_phone`]} onChange={e => setForm({ ...form, [`${a}_phone`]: e.target.value } as any)} />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{a.toUpperCase()} Username</label>
                  <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={(form as any)[`${a}_username`]} onChange={e => setForm({ ...form, [`${a}_username`]: e.target.value } as any)} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{a.toUpperCase()} Password</label>
                  <input type="password" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={(form as any)[`${a}_password`]} onChange={e => setForm({ ...form, [`${a}_password`]: e.target.value } as any)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Upload Attachment (Optional)</label>
                  <input type="file" accept="application/pdf,image/*,.doc,.docx"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm file:mr-4 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold"
                    onChange={e => setForm({ ...form, [`${a}_attachment`]: e.target.files?.[0] || null } as any)} />
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'finance' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider border-b pb-1">Financial Records</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Total Contract (TZS)</label>
                  <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={formatNumber(form.total_contract_amount)} onChange={e => setForm({ ...form, total_contract_amount: parseNumber(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Amount Paid (TZS)</label>
                  <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={formatNumber(form.amount_paid)} onChange={e => setForm({ ...form, amount_paid: parseNumber(e.target.value) })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Remaining Balance</label>
                  <div className={`p-2 border rounded font-mono font-bold text-lg ${
                    form.total_contract_amount - form.amount_paid > 0
                      ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'
                  }`}>TZS {formatNumber(form.total_contract_amount - form.amount_paid)}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-1">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Staff Roles & Permissions</h4>
                <button onClick={addAssignment}
                  className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-bold uppercase rounded-sm hover:bg-indigo-400">
                  + Ongeza Staff
                </button>
              </div>

              {assignments.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-4">
                  Hakuna staff aliyepangiwa. Bonyeza "+ Ongeza Staff".
                </p>
              )}

              {assignments.map((a, idx) => (
                <div key={idx} className="p-3 border border-gray-200 rounded-sm bg-slate-50 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Staff</label>
                      <select className="w-full px-3 py-2 bg-white border border-gray-200 text-sm rounded-sm"
                        value={a.staff_id} onChange={e => updateAssignment(idx, { staff_id: Number(e.target.value) })}>
                        <option value={0}>— Chagua staff —</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Role / Kazi</label>
                      <select className="w-full px-3 py-2 bg-white border border-gray-200 text-sm rounded-sm"
                        value={a.role_type} onChange={e => updateAssignment(idx, { role_type: e.target.value })}>
                        {ROLE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Anaweza Kuona Password</label>
                    <div className="flex flex-wrap gap-2">
                      {PASSWORD_FIELDS.map(p => {
                        const checked = a.can_view_passwords.includes(p.key)
                        return (
                          <label key={p.key} className={`px-2 py-1 border rounded-sm text-[11px] cursor-pointer ${
                            checked ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'
                          }`}>
                            <input type="checkbox" className="mr-1" checked={checked}
                              onChange={e => updateAssignment(idx, {
                                can_view_passwords: e.target.checked
                                  ? [...a.can_view_passwords, p.key]
                                  : a.can_view_passwords.filter(x => x !== p.key)
                              })} />
                            {p.label}
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-[11px] font-mono">
                      <input type="checkbox" checked={a.can_upload}
                        onChange={e => updateAssignment(idx, { can_upload: e.target.checked })} />
                      Upload report
                    </label>
                    <button onClick={() => removeAssignment(idx)}
                      className="text-[10px] text-red-600 hover:underline uppercase font-bold">
                      Ondoa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
            <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 rounded-sm"
              onClick={() => setModal(false)}>Cancel</button>
            <button className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 rounded-sm flex items-center gap-2 disabled:opacity-50"
              onClick={save} disabled={busy}>
              {busy ? (<><span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span> Saving...</>) : 'Save Client'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}