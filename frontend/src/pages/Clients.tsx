import { useEffect, useState } from 'react'
import api, { errMsg } from '../api/client'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import Swal from 'sweetalert2'
import { CLIENT_TAX_TYPES, type Client } from '../types'
import { useLanguage } from '../context/LanguageContext'
import { escapeHtml, openPrintDocument } from '../utils/printDocument'
import { useAuth } from '../context/AuthContext'

// ---------- Helpers ----------
function formatNumber(val: number | string): string {
  const num = typeof val === 'string' ? parseInt(val.replace(/,/g, ''), 10) : val
  if (isNaN(num)) return '0'
  return num.toLocaleString('en-US')
}
function parseNumber(val: string): number {
  return parseInt(val.replace(/,/g, ''), 10) || 0
}

// ---------- Empty form ----------
const empty = {
  company_name: '', contact_person: '', phone: '', email: '', notes: '',
  contract_start_date: '', contract_end_date: '', service_type: 'Audit',
  total_contract_amount: 0, amount_paid: 0, assessment_info: '',
  location: 'Mainland', industry: '', tin: '', financial_year_end: '',
  company_registration_number: '', business_type: '', enabled_tax_types: [] as string[],

  tra_number: '', tra_username: '', tra_password: '', tra_phone: '',
  tra_reg_date: '', tra_start_date: '', tra_end_date: '', tra_attachment: null as File | null,

  zra_number: '', zra_username: '', zra_password: '', zra_phone: '',
  zra_reg_date: '', zra_start_date: '', zra_end_date: '', zra_attachment: null as File | null,

  bpra_number: '', bpra_username: '', bpra_password: '',
  bpra_reg_date: '', bpra_start_date: '', bpra_end_date: '', bpra_attachment: null as File | null,

  zssf_number: '', zssf_username: '', zssf_password: '',
  zssf_reg_date: '', zssf_start_date: '', zssf_end_date: '', zssf_attachment: null as File | null,
}

type Tab = 'general' | 'compliance' | 'tra' | 'zra' | 'bpra' | 'zssf' | 'finance'
type AuditorDocument = {
  id: number
  authority: string
  original_name: string
  uploader_name: string
  created_at: string
  feedback?: string | null
  feedback_by_name?: string | null
  feedback_at?: string | null
}

const tabs: { key: Tab; label: string; color: string; icon: string }[] = [
  { key: 'general', label: 'General Info', color: 'bg-slate-500',   icon: 'info' },
  { key: 'compliance', label: 'Compliance Profile', color: 'bg-cyan-600', icon: 'fact_check' },
  { key: 'tra',     label: 'TRA',          color: 'bg-blue-600',    icon: 'account_balance' },
  { key: 'zra',     label: 'ZRA',          color: 'bg-emerald-600', icon: 'account_balance_wallet' },
  { key: 'bpra',    label: 'BPRA',         color: 'bg-purple-600',  icon: 'domain' },
  { key: 'zssf',    label: 'ZSSF',         color: 'bg-orange-500',  icon: 'groups' },
  { key: 'finance', label: 'Finance',      color: 'bg-amber-500',   icon: 'payments' },
]

export default function Clients() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [rows, setRows]     = useState<Client[]>([])
  const [modal, setModal]   = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm]     = useState(empty)
  const [error, setError]   = useState('')
  const [busy, setBusy]     = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('general')
  
  const [viewClient, setViewClient] = useState<Client | null>(null)
  const [auditorDocuments, setAuditorDocuments] = useState<AuditorDocument[]>([])
  const [auditorDocumentsBusy, setAuditorDocumentsBusy] = useState(false)
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)
  
  // State za Password Security
  const [revealModal, setRevealModal] = useState(false)
  const [sysPassword, setSysPassword] = useState('')
  const [revealedData, setRevealedData] = useState<any>(null)
  const [revealBusy, setRevealBusy] = useState(false)
  const [revealError, setRevealError] = useState('')


  const [toast, setToast] = useState({ show: false, message: '', type: 'loading' as 'loading' | 'success' | 'error' })
  function parseTaxTypes(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
    if (typeof value !== 'string' || !value.trim()) return []
    try {
      const parsed: unknown = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
    } catch {
      return []
    }
  }
  function showToast(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
    setToast({ show: true, message, type })
    if (type !== 'loading') setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  async function load() {
    try {
      const c = await api.get('/clients')
      setRows(c.data.data || [])
    } catch (e) { setError(errMsg(e)) }
  }
  useEffect(() => { load() }, [])

  async function openClientView(client: Client) {
    setViewClient(client)
    setAuditorDocuments([])
    setAuditorDocumentsBusy(true)
    try {
      const response = await api.get(`/clients/${client.id}/documents`)
      setAuditorDocuments(response.data.data || [])
    } catch (e) {
      showToast(errMsg(e), 'error')
    } finally {
      setAuditorDocumentsBusy(false)
    }
  }

  async function downloadAuditorDocument(document: AuditorDocument) {
    try {
      const response = await api.get(`/client-documents/${document.id}/file`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.original_name
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      showToast(errMsg(e), 'error')
    }
  }

  async function saveAuditorFeedback(document: AuditorDocument) {
    try {
      const response = await api.post(`/client-documents/${document.id}/feedback`, {
        feedback: document.feedback || '',
      })
      setAuditorDocuments(documents => documents.map(item =>
        item.id === document.id ? response.data.data : item
      ))
      showToast('AUDITOR FEEDBACK SAVED', 'success')
    } catch (e) {
      showToast(errMsg(e), 'error')
    }
  }

  function openCreate() {
    setEditing(null); setForm(empty)
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
      tin: c.tin || '',
      financial_year_end: (c.financial_year_end || '').split('T')[0],
      company_registration_number: c.company_registration_number || '',
      business_type: c.business_type || '',
      enabled_tax_types: parseTaxTypes(c.enabled_tax_types),

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
        if (Array.isArray(v)) {
          fd.append(k, JSON.stringify(v))
          return
        }
        
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

      if (editing) {
        fd.append('_method', 'PUT')
        await api.post(`/clients/${editing.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await api.post('/clients', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
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

  function printClient(client: Client) {
    const printWindowAllowed = openPrintDocument(
      `Client Record - ${client.company_name}`,
      buildClientPrintContent(client),
      user?.name || 'Admin'
    )
    if (!printWindowAllowed) {
      showToast('Ruhusu pop-ups ili kuchapisha taarifa za mteja', 'error')
    }
  }

  function buildClientPrintContent(client: Client): string {
    const value = (field: string) => {
      const current = (client as any)[field]
      return current === null || current === undefined || current === '' ? '—' : String(current)
    }
    const row = (label: string, field: string) =>
      `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value(field))}</td></tr>`
    const authorities = (['tra', 'zra', 'bpra', 'zssf'] as const).map(authority => {
      const prefix = authority.toUpperCase()
      const passwordField = `${authority}_password`
      const password = revealedData?.[passwordField]
        || ((client as any)[passwordField] ? '••••••••' : '—')
      return `
        <section>
          <h2>${prefix} Details</h2>
          <table>
            ${row(`${prefix} Number`, `${authority}_number`)}
            ${row(`${prefix} Username`, `${authority}_username`)}
            <tr><th>${prefix} Password</th><td>${escapeHtml(password)}</td></tr>
            ${row(`${prefix} Registration Date`, `${authority}_reg_date`)}
            ${row(`${prefix} Start Date`, `${authority}_start_date`)}
            ${row(`${prefix} End Date`, `${authority}_end_date`)}
            ${row(`${prefix} Attachment`, `${authority}_attachment`)}
          </table>
        </section>
      `
    }).join('')

    return `
          <h1>${escapeHtml(client.company_name)}</h1>
          <p>Client Record · ID: SBC-${String(client.id).padStart(4, '0')}</p>
          <section>
            <h2>General Information</h2>
            <table>
              ${row('Contact Person', 'contact_person')}
              ${row('Phone', 'phone')}
              ${row('Email', 'email')}
              ${row('Location', 'location')}
              ${row('Industry', 'industry')}
              ${row('TIN', 'tin')}
              ${row('Company Registration Number', 'company_registration_number')}
              ${row('Business Type', 'business_type')}
              ${row('Financial Year-End', 'financial_year_end')}
              <tr><th>Enabled Compliance Types</th><td>${escapeHtml(CLIENT_TAX_TYPES.filter(type => parseTaxTypes((client as any).enabled_tax_types).includes(type.value)).map(type => `${type.authority}: ${type.label}`).join(', ') || '—')}</td></tr>
              ${row('Notes', 'notes')}
            </table>
          </section>
          <section>
            <h2>Contract & Finance</h2>
            <table>
              ${row('Service Type', 'service_type')}
              ${row('Contract Start Date', 'contract_start_date')}
              ${row('Contract End Date', 'contract_end_date')}
              ${row('Contract Amount (TZS)', 'total_contract_amount')}
              ${row('Amount Paid (TZS)', 'amount_paid')}
              <tr><th>Balance (TZS)</th><td>${escapeHtml(formatNumber(Number(client.total_contract_amount || 0) - Number(client.amount_paid || 0)))}</td></tr>
              ${row('Assessment Information', 'assessment_info')}
            </table>
          </section>
          ${authorities}
        `
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
            <span className="px-2 py-0.5 bg-cyan-100/50 text-cyan-800 text-[10px] uppercase tracking-widest font-bold border border-cyan-200">{t('SYS.OPS // ENTITIES')}</span>
            <span className="text-gray-400 text-[10px]">//</span>
            <span className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">DATA: CLIENTS</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk] uppercase">{t('Client Directory')}</h2>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all text-xs font-bold uppercase active:scale-95"
          onClick={openCreate}>
          <span className="material-symbols-outlined text-[16px]">domain_add</span>
          {t('Add Client')}
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
                        onClick={() => void openClientView(c)}
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
        setAuditorDocuments([])
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printClient(viewClient)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 text-white text-xs font-bold uppercase rounded-sm hover:bg-cyan-700"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    Print Form
                  </button>
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
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-2 border-b pb-1">General Info</h4>
                <Row label="Location" value={v.location} />
                <Row label="Industry" value={v.industry} />
                <Row label="TIN" value={v.tin} />
                <Row label="Contact Person" value={v.contact_person} />
                <Row label="Phone" value={v.phone} />
                <Row label="Email" value={v.email} />
                <Row label="Financial Year-End" value={v.financial_year_end} />
                <Row label="Company Registration Number" value={v.company_registration_number} />
                <Row label="Business Type" value={v.business_type?.replaceAll('_', ' ')} />
                <Row
                  label="Enabled Compliance Types"
                  value={CLIENT_TAX_TYPES
                    .filter(type => parseTaxTypes(v.enabled_tax_types).includes(type.value))
                    .map(type => `${type.authority}: ${type.label}`)
                    .join(', ')}
                />
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

              <section className="space-y-3 border-t border-gray-200 pt-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Auditor Feedback</h4>
                  <p className="mt-1 text-[11px] text-slate-500">Documents uploaded by auditors only.</p>
                </div>
                {auditorDocumentsBusy ? (
                  <p className="text-xs text-slate-400">Loading auditor documents...</p>
                ) : auditorDocuments.length === 0 ? (
                  <p className="rounded-sm border border-slate-100 bg-slate-50 p-3 text-xs italic text-slate-400">
                    No auditor documents have been uploaded for this client.
                  </p>
                ) : auditorDocuments.map(document => (
                  <div key={document.id} className="space-y-2 rounded-sm border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-all text-xs font-bold text-slate-800">{document.original_name}</p>
                        <p className="mt-1 text-[10px] font-mono uppercase text-slate-500">
                          {document.authority} · Uploaded by {document.uploader_name} · {new Date(document.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void downloadAuditorDocument(document)}
                        className="shrink-0 text-xs font-bold text-cyan-700 underline"
                      >
                        Download
                      </button>
                    </div>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Admin feedback</span>
                      <textarea
                        maxLength={5000}
                        rows={3}
                        value={document.feedback || ''}
                        onChange={event => setAuditorDocuments(documents => documents.map(item =>
                          item.id === document.id ? { ...item, feedback: event.target.value } : item
                        ))}
                        className="w-full border border-slate-200 bg-white p-2 text-xs"
                        placeholder="Write feedback for the auditor..."
                      />
                    </label>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">
                        {document.feedback_by_name
                          ? `Last saved by ${document.feedback_by_name}${document.feedback_at ? ` · ${new Date(document.feedback_at).toLocaleDateString()}` : ''}`
                          : 'No feedback saved'}
                      </span>
                      <button
                        type="button"
                        onClick={() => void saveAuditorFeedback(document)}
                        className="rounded-sm bg-indigo-600 px-3 py-1.5 text-[10px] font-bold uppercase text-white hover:bg-indigo-700"
                      >
                        Save Feedback
                      </button>
                    </div>
                  </div>
                ))}
              </section>

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
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('System Password')}</label>
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
              <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-wider border-b border-gray-100 pb-1">{t('Company Details')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Company Name')}</label>
                  <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                    value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Location')}</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                    value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}>
                    <option value="Mainland">{t('Mainland Tanzania')}</option>
                    <option value="Zanzibar">Zanzibar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Industry')}</label>
                  <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                    value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">TIN</label>
                  <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={form.tin}
                    onChange={e => setForm({ ...form, tin: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Contact Person')}</label>
                  <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                    value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Phone')}</label>
                  <input className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Email')}</label>
                  <input type="email" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-5">
              <div>
                <h4 className="border-b pb-1 text-xs font-bold uppercase tracking-wider text-cyan-700">Company Compliance Profile</h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Select only registrations and tax types that apply to this client. Selection records applicability; it does not create obligations automatically.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Company Registration Number</span>
                  <input
                    value={form.company_registration_number}
                    onChange={event => setForm({ ...form, company_registration_number: event.target.value })}
                    className="w-full border border-gray-200 bg-slate-50 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Entity / Business Type</span>
                  <select
                    value={form.business_type}
                    onChange={event => setForm({ ...form, business_type: event.target.value })}
                    className="w-full border border-gray-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <option value="">Select type</option>
                    <option value="company">Tanzanian company</option>
                    <option value="foreign_company">Foreign company</option>
                    <option value="sole_proprietor">Sole proprietor / business name</option>
                    <option value="partnership">Partnership / business name</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Financial Year-End</span>
                  <input
                    type="date"
                    value={form.financial_year_end}
                    onChange={event => setForm({ ...form, financial_year_end: event.target.value })}
                    className="w-full border border-gray-200 bg-slate-50 px-3 py-2 text-sm font-mono"
                  />
                </label>
              </div>

              {(['TRA', 'ZRA', 'ZSSF', 'BPRA'] as const).map(authority => (
                <fieldset key={authority} className="space-y-2 border border-slate-200 p-3">
                  <legend className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-700">{authority} applicable registrations / taxes</legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {CLIENT_TAX_TYPES.filter(type => type.authority === authority).map(type => (
                      <label key={type.value} className="flex items-start gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={form.enabled_tax_types.includes(type.value)}
                          onChange={event => setForm(current => ({
                            ...current,
                            enabled_tax_types: event.target.checked
                              ? [...current.enabled_tax_types, type.value]
                              : current.enabled_tax_types.filter(value => value !== type.value),
                          }))}
                          className="mt-0.5 accent-cyan-600"
                        />
                        <span>{type.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Upload Attachment (Optional)')}</label>
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Total Contract (TZS)')}</label>
                  <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={formatNumber(form.total_contract_amount)} onChange={e => setForm({ ...form, total_contract_amount: parseNumber(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Amount Paid (TZS)')}</label>
                  <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={formatNumber(form.amount_paid)} onChange={e => setForm({ ...form, amount_paid: parseNumber(e.target.value) })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{t('Remaining Balance')}</label>
                  <div className={`p-2 border rounded font-mono font-bold text-lg ${
                    form.total_contract_amount - form.amount_paid > 0
                      ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'
                  }`}>TZS {formatNumber(form.total_contract_amount - form.amount_paid)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
            <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 rounded-sm"
              onClick={() => setModal(false)}>Cancel</button>
            <button className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 rounded-sm flex items-center gap-2 disabled:opacity-50"
              onClick={save} disabled={busy}>
              {busy ? (<><span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span> {t('Saving...')}</>) : t('Save Client')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}