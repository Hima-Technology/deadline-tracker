import { useEffect, useState } from 'react'
import api, { errMsg } from '../api/client'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import Swal from 'sweetalert2'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import AuditorMessages from './AuditorMessages'
import { CLIENT_TAX_TYPES } from '../types'

// ---------- Helpers ----------
function formatNumber(val: number | string): string {
  const num = typeof val === 'string' ? parseInt(val.replace(/,/g, ''), 10) : val
  if (isNaN(num)) return '0'
  return num.toLocaleString('en-US')
}
function parseNumber(val: string): number {
  return parseInt(val.replace(/,/g, ''), 10) || 0
}

// ---------- Permission labels ----------
const PERMISSION_LABELS: Record<string, string> = {
  upload_tra: 'Upload TRA Docs',
  upload_zra: 'Upload ZRA Docs',
  upload_bpra: 'Upload BPRA Docs',
  upload_zssf: 'Upload ZSSF Docs',
  edit_clients: 'Edit Clients',
  view_clients: 'View Clients',
  view_compliance_profile: 'View Compliance Profile',
  edit_compliance_profile: 'Edit Compliance Profile',
  view_passwords: 'Reveal Passwords',
  add_clients: 'Add Client',
  delete_clients: 'Delete Client',
}

const TABS = [
  { key: 'tra',  label: 'TRA',  perm: 'upload_tra', color: 'text-blue-600' },
  { key: 'zra',  label: 'ZRA',  perm: 'upload_zra', color: 'text-emerald-600' },
  { key: 'bpra', label: 'BPRA', perm: 'upload_bpra', color: 'text-purple-600' },
  { key: 'zssf', label: 'ZSSF', perm: 'upload_zssf', color: 'text-orange-600' },
]

// ---------- Empty form (Add Client) ----------
const emptyForm = {
  company_name: '', contact_person: '', phone: '', email: '', notes: '',
  contract_start_date: '', contract_end_date: '', service_type: 'Audit',
  total_contract_amount: 0, amount_paid: 0, assessment_info: '',
  location: 'Mainland', industry: '', tin: '', company_registration_number: '',
  business_type: '', financial_year_end: '', enabled_tax_types: [] as string[],

  tra_number: '', tra_username: '', tra_password: '', tra_phone: '',
  tra_reg_date: '', tra_start_date: '', tra_end_date: '', tra_attachment: null as File | null,

  zra_number: '', zra_username: '', zra_password: '', zra_phone: '',
  zra_reg_date: '', zra_start_date: '', zra_end_date: '', zra_attachment: null as File | null,

  bpra_number: '', bpra_username: '', bpra_password: '',
  bpra_reg_date: '', bpra_start_date: '', bpra_end_date: '', bpra_attachment: null as File | null,

  zssf_number: '', zssf_username: '', zssf_password: '',
  zssf_reg_date: '', zssf_start_date: '', zssf_end_date: '', zssf_attachment: null as File | null,
}

type CreateTab = 'general' | 'compliance' | 'tra' | 'zra' | 'bpra' | 'zssf' | 'finance'
type ClientDocument = {
  id: number
  authority: string
  original_name: string
  uploader_role: 'staff' | 'auditor'
  created_at: string
  feedback?: string | null
  feedback_by_name?: string | null
  feedback_at?: string | null
}

function parseEnabledTaxTypes(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

const createTabs: { key: CreateTab; label: string }[] = [
  { key: 'general', label: 'General Info' },
  { key: 'compliance', label: 'Compliance Profile' },
  { key: 'tra',     label: 'TRA' },
  { key: 'zra',     label: 'ZRA' },
  { key: 'bpra',    label: 'BPRA' },
  { key: 'zssf',    label: 'ZSSF' },
  { key: 'finance', label: 'Finance' },
]

export default function MyPrivileges() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const isAuditor = user?.role.toLowerCase() === 'auditor'
  const [privileges, setPrivileges] = useState<any[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')

  // Manage modal
  const [manageModal, setManageModal] = useState(false)
  const [selectedPrivilege, setSelectedPrivilege] = useState<any>(null)
  const [clientData, setClientData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('tra')
  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({})
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([])

  // View modal
  const [viewClient, setViewClient] = useState<any>(null)
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)

  // Security
  const [revealModal, setRevealModal] = useState(false)
  const [sysPassword, setSysPassword] = useState('')
  const [revealedData, setRevealedData] = useState<any>(null)
  const [revealBusy, setRevealBusy] = useState(false)
  const [revealError, setRevealError] = useState('')

  // Add Client modal
  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState(emptyForm)
  const [createTab, setCreateTab] = useState<CreateTab>('general')
  const [createError, setCreateError] = useState('')
  const [createBusy, setCreateBusy] = useState(false)

  const [toast, setToast] = useState({ show: false, message: '', type: 'loading' as 'loading' | 'success' | 'error' })
  function showToast(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
    setToast({ show: true, message, type })
    if (type !== 'loading') setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
  }

  async function load() {
    try {
      const r = await api.get('/privileges/mine')
      setPrivileges(r.data.data || [])
    } catch (e) {
      setError(errMsg(e))
    }
  }
  useEffect(() => { load() }, [])

  // ---------- Manage ----------
  async function openManage(p: any) {
    if (!p.client_id) return showToast('Privilege hii ni ya Global', 'error')
    setBusy(true)
    try {
      const [clientResponse, documentsResponse] = await Promise.all([
        api.get(`/clients/${p.client_id}`),
        api.get(`/clients/${p.client_id}/documents`),
      ])
      setClientData(clientResponse.data.data)
      setClientDocuments(documentsResponse.data.data || [])
      setSelectedPrivilege(p)
      const allowedTabs = TABS.filter(t => p.permissions.includes(t.perm))
      if (allowedTabs.length > 0) setActiveTab(allowedTabs[0].key)
      setUploadFiles({})
      setRevealedData(null)
      setManageModal(true)
    } catch (e) {
      showToast('Imeshindwa kupata taarifa za mteja', 'error')
    } finally {
      setBusy(false)
    }
  }

  // ---------- View ----------
  async function openView(p: any) {
    if (!p.client_id) return showToast('Privilege hii ni ya Global', 'error')
    if (!(p.permissions || []).some((permission: string) =>
      ['view_clients', 'view_compliance_profile', 'edit_compliance_profile'].includes(permission)
    )) {
      return showToast('Hauna ruhusa ya kuona taarifa za mteja', 'error')
    }
    setBusy(true)
    try {
      const r = await api.get(`/clients/${p.client_id}`)
      setViewClient(r.data.data)
      setRevealedData(null)
      setSysPassword('')
    } catch (e) {
      showToast('Imeshindwa kupata taarifa za mteja', 'error')
    } finally {
      setBusy(false)
    }
  }

  // ---------- Delete ----------
  async function handleDelete(p: any) {
    if (!p.client_id) return showToast('Privilege hii ni ya Global', 'error')
    if (!(p.permissions || []).includes('delete_clients')) {
      return showToast('Hauna ruhusa ya kufuta mteja', 'error')
    }

    const result = await Swal.fire({
      title: 'Futa Mteja?',
      text: `Una uhakika unataka kufuta ${p.company_name || 'mteja huyu'}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ndiyo, futa!',
      cancelButtonText: 'Ghairi',
    })
    if (!result.isConfirmed) return

    setBusy(true)
    showToast('INAONDOLEWA...', 'loading')
    try {
      await api.delete(`/clients/${p.client_id}`)
      showToast('MTEJA AMETOLEWA', 'success')
      load()
    } catch (e: any) {
      showToast(e.response?.data?.message || errMsg(e) || 'Imeshindwa kufuta', 'error')
    } finally {
      setBusy(false)
    }
  }

  // ---------- Add Client ----------
  function openCreate() {
    setCreateForm(emptyForm)
    setCreateTab('general')
    setCreateError('')
    setCreateModal(true)
  }

  async function saveNewClient() {
    if (!createForm.company_name.trim()) {
      setCreateError('Jina la kampuni linahitajika')
      return
    }
    setCreateBusy(true)
    setCreateError('')
    showToast('REGISTERING CLIENT...', 'loading')
    try {
      const fd = new FormData()
      Object.entries(createForm).forEach(([k, v]) => {
        if (v === null || v === undefined) return
        if (Array.isArray(v)) {
          fd.append(k, JSON.stringify(v))
          return
        }
        if (v instanceof File) {
          fd.append(k, v)
          return
        }
        if (typeof v === 'string') {
          if (k.endsWith('_password') && v === '') return
          fd.append(k, v)
          return
        }
        if (typeof v === 'number') fd.append(k, String(v))
      })

      await api.post('/clients', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      showToast('NEW CLIENT REGISTERED', 'success')
      setCreateModal(false)
      load()
    } catch (e: any) {
      setCreateError(errMsg(e))
      showToast('ACTION FAILED', 'error')
    } finally {
      setCreateBusy(false)
    }
  }

  // ---------- Reveal ----------
  async function handleRevealPasswords(targetId: number) {
    if (!sysPassword) {
      setRevealError('Weka password yako ya mfumo')
      return
    }
    setRevealBusy(true)
    setRevealError('')
    try {
      const r = await api.post(`/clients/${targetId}/passwords`, { system_password: sysPassword })
      if (r.data && r.data.data) {
        setRevealedData(r.data.data)
        setRevealModal(false)
        setSysPassword('')
        showToast('Password zimefunguliwa', 'success')
      } else {
        throw new Error('Server haikurudisha data')
      }
    } catch (e: any) {
      setRevealError(errMsg(e))
    } finally {
      setRevealBusy(false)
    }
  }

  // ---------- Save manage changes ----------
  async function saveChanges() {
    if (!clientData || !selectedPrivilege) return
    setBusy(true)
    showToast('SAVING CHANGES...', 'loading')
    try {
      const fd = new FormData()
      const canEdit = selectedPrivilege.permissions.includes('edit_clients')
      const canEditCompliance = canEdit || selectedPrivilege.permissions.includes('edit_compliance_profile')
      if (canEdit) {
        TABS.forEach(t => {
          fd.append(`${t.key}_number`, clientData[`${t.key}_number`] || '')
          fd.append(`${t.key}_username`, clientData[`${t.key}_username`] || '')
          fd.append(`${t.key}_reg_date`, clientData[`${t.key}_reg_date`] || '')
          fd.append(`${t.key}_start_date`, clientData[`${t.key}_start_date`] || '')
          fd.append(`${t.key}_end_date`, clientData[`${t.key}_end_date`] || '')
          if (revealedData && revealedData[`${t.key}_password`] !== undefined) {
            fd.append(`${t.key}_password`, revealedData[`${t.key}_password`])
          }
        })
      }
      if (canEditCompliance) {
        fd.append('company_registration_number', clientData.company_registration_number || '')
        fd.append('business_type', clientData.business_type || '')
        fd.append('financial_year_end', clientData.financial_year_end || '')
        fd.append('enabled_tax_types', JSON.stringify(parseEnabledTaxTypes(clientData.enabled_tax_types)))
      }
      const uploads = Object.entries(uploadFiles).filter((entry): entry is [string, File] => entry[1] !== null)
      const hasFile = uploads.length > 0
      if (!canEdit && !canEditCompliance && !hasFile) throw new Error('Hakuna mabadiliko ya kuhifadhi.')
      if (canEdit || canEditCompliance) {
        await api.post(`/clients/${clientData.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      for (const [authority, file] of uploads) {
        const document = new FormData()
        document.append('authority', authority.toUpperCase())
        document.append('document', file)
        await api.post(`/clients/${clientData.id}/documents`, document, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      const documentsResponse = await api.get(`/clients/${clientData.id}/documents`)
      setClientDocuments(documentsResponse.data.data || [])
      setUploadFiles({})
      showToast('RECORDS SAVED SUCCESSFULLY', 'success')
      load()
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message || 'Kuna tatizo limetokea', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function downloadClientDocument(document: ClientDocument) {
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

  // ---------- Filter ----------
  const filtered = privileges.filter(p =>
    !search ||
    (p.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.permissions || []).some((perm: string) =>
      (PERMISSION_LABELS[perm] || perm).toLowerCase().includes(search.toLowerCase())
    )
  )

  const canAddClient = privileges.some(p => (p.permissions || []).includes('add_clients'))

  return (
    <div className="space-y-6 relative">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-cyan-100/50 text-cyan-800 text-[10px] uppercase tracking-widest font-bold border border-cyan-200">
              {isAuditor ? 'AUDITOR // WORKSPACE' : 'STAFF // WORKSPACE'}
            </span>
            <span className="text-gray-400 text-[10px]">//</span>
            <span className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">
              {isAuditor ? 'MY WORK' : 'MY PRIVILEGES'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk] uppercase">
            {isAuditor ? 'My Work' : 'My Assigned Privileges'}
          </h2>
        </div>

        {canAddClient && (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all text-xs font-bold uppercase active:scale-95"
            onClick={openCreate}
          >
            <span className="material-symbols-outlined text-[16px]">domain_add</span>
            Add Client
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 p-3 border border-red-200 rounded text-sm font-mono">
          {error}
        </div>
      )}

      {isAuditor && <AuditorMessages />}

      {/* SEARCH */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-gray-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by company or permission..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          Displaying {filtered.length} of {privileges.length} privileges
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 font-semibold">Company / Scope</th>
              <th className="px-4 py-4 font-semibold">Permissions</th>
              <th className="px-4 py-4 font-semibold">Assigned</th>
              <th className="px-4 py-4 font-semibold">Status</th>
              <th className="px-4 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(p => {
              const allowedTabs = TABS.filter(t => (p.permissions || []).includes(t.perm))
              const canView = (p.permissions || []).some((permission: string) =>
                ['view_clients', 'edit_clients'].includes(permission)
              )
              const canManageCompliance = (p.permissions || []).some((permission: string) =>
                ['view_compliance_profile', 'edit_compliance_profile'].includes(permission)
              )
              const canDelete = (p.permissions || []).includes('delete_clients')

              return (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 border border-gray-200 flex items-center justify-center text-cyan-600">
                        <span className="material-symbols-outlined text-[18px]">badge</span>
                      </div>
                      <div>
                        <div>{p.company_name || 'Global Access'}</div>
                        <div className="text-[10px] text-gray-400 font-mono font-normal">
                          {p.client_id ? `CLIENT-${String(p.client_id).padStart(4, '0')}` : 'GLOBAL SCOPE'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {Array.isArray(p.permissions) && p.permissions.length > 0 ? (
                        p.permissions.map((key: string) => (
                          <span
                            key={key}
                            className="px-2 py-0.5 bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-bold rounded"
                          >
                            {PERMISSION_LABELS[key] || key}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">{t('No permissions')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs font-mono">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                        p.is_active
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      {p.client_id && canView && (
                        <button
                          className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                          onClick={() => openView(p)}
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      )}
                      {p.client_id && (allowedTabs.length > 0 || canManageCompliance) && (
                        <button
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          onClick={() => openManage(p)}
                          title="Manage Records"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit_document</span>
                        </button>
                      )}
                      {p.client_id && canDelete && (
                        <button
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          onClick={() => handleDelete(p)}
                          title="Delete Client"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-12 font-mono text-xs uppercase">
                  No privileges assigned yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= ADD CLIENT MODAL ================= */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Register New Client"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {createError && (
            <div className="text-xs text-red-600 bg-red-50 p-2 border border-red-100 rounded font-mono">
              {createError}
            </div>
          )}

          <div className="flex border-b border-gray-200 overflow-x-auto">
            {createTabs.map(t => (
              <button
                key={t.key}
                onClick={() => setCreateTab(t.key)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider font-mono transition-colors border-b-2 whitespace-nowrap ${
                  createTab === t.key
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {createTab === 'general' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-cyan-600 uppercase tracking-wider border-b border-gray-100 pb-1">
                Company Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Company Name</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                    value={createForm.company_name}
                    onChange={e => setCreateForm({ ...createForm, company_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Location</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                    value={createForm.location}
                    onChange={e => setCreateForm({ ...createForm, location: e.target.value })}
                  >
                    <option value="Mainland">Mainland Tanzania</option>
                    <option value="Zanzibar">Zanzibar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Industry</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                    value={createForm.industry}
                    onChange={e => setCreateForm({ ...createForm, industry: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">TIN</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={createForm.tin}
                    onChange={e => setCreateForm({ ...createForm, tin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Contact Person</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm"
                    value={createForm.contact_person}
                    onChange={e => setCreateForm({ ...createForm, contact_person: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Phone</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={createForm.phone}
                    onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {createTab === 'compliance' && (
            <div className="space-y-5">
              <div>
                <h4 className="border-b pb-1 text-xs font-bold uppercase tracking-wider text-cyan-700">Company Compliance Profile</h4>
                <p className="mt-1 text-[11px] text-slate-500">
                  Select only registrations and tax types that apply. These selections do not automatically create obligations.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Company Registration Number</span>
                  <input
                    value={createForm.company_registration_number}
                    onChange={event => setCreateForm({ ...createForm, company_registration_number: event.target.value })}
                    className="w-full border border-gray-200 bg-slate-50 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Entity / Business Type</span>
                  <select
                    value={createForm.business_type}
                    onChange={event => setCreateForm({ ...createForm, business_type: event.target.value })}
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
                    value={createForm.financial_year_end}
                    onChange={event => setCreateForm({ ...createForm, financial_year_end: event.target.value })}
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
                          checked={createForm.enabled_tax_types.includes(type.value)}
                          onChange={event => setCreateForm(current => ({
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

          {(['tra', 'zra', 'bpra', 'zssf'] as const).map(a => createTab === a && (
            <div key={a} className="space-y-4">
              <h4 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${
                a === 'tra' ? 'text-blue-600' : a === 'zra' ? 'text-emerald-600' : a === 'bpra' ? 'text-purple-600' : 'text-orange-600'
              }`}>
                {a.toUpperCase()} Credentials & Dates
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{a.toUpperCase()} Number</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={(createForm as any)[`${a}_number`]}
                    onChange={e => setCreateForm({ ...createForm, [`${a}_number`]: e.target.value } as any)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Registration Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={(createForm as any)[`${a}_reg_date`]}
                    onChange={e => setCreateForm({ ...createForm, [`${a}_reg_date`]: e.target.value } as any)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={(createForm as any)[`${a}_start_date`]}
                    onChange={e => setCreateForm({ ...createForm, [`${a}_start_date`]: e.target.value } as any)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">End Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={(createForm as any)[`${a}_end_date`]}
                    onChange={e => setCreateForm({ ...createForm, [`${a}_end_date`]: e.target.value } as any)}
                  />
                </div>
                {(a === 'tra' || a === 'zra') && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{a.toUpperCase()} Phone</label>
                    <input
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                      value={(createForm as any)[`${a}_phone`]}
                      onChange={e => setCreateForm({ ...createForm, [`${a}_phone`]: e.target.value } as any)}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Username</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={(createForm as any)[`${a}_username`]}
                    onChange={e => setCreateForm({ ...createForm, [`${a}_username`]: e.target.value } as any)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={(createForm as any)[`${a}_password`]}
                    onChange={e => setCreateForm({ ...createForm, [`${a}_password`]: e.target.value } as any)}
                  />
                </div>
                <p className="sm:col-span-2 text-xs text-slate-500">
                  After the client is registered and the admin assigns your institution permissions, upload its documents from My Work.
                </p>
              </div>
            </div>
          ))}

          {createTab === 'finance' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider border-b pb-1">Financial Records</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Total Contract (TZS)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={formatNumber(createForm.total_contract_amount)}
                    onChange={e => setCreateForm({ ...createForm, total_contract_amount: parseNumber(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Amount Paid (TZS)</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm rounded-sm font-mono"
                    value={formatNumber(createForm.amount_paid)}
                    onChange={e => setCreateForm({ ...createForm, amount_paid: parseNumber(e.target.value) })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Remaining Balance</label>
                  <div className={`p-2 border rounded font-mono font-bold text-lg ${
                    createForm.total_contract_amount - createForm.amount_paid > 0
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-green-50 text-green-600 border-green-200'
                  }`}>
                    TZS {formatNumber(createForm.total_contract_amount - createForm.amount_paid)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
            <button
              className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 rounded-sm"
              onClick={() => setCreateModal(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 rounded-sm flex items-center gap-2 disabled:opacity-50"
              onClick={saveNewClient}
              disabled={createBusy}
            >
              {createBusy ? (
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

      {/* ================= VIEW CLIENT MODAL ================= */}
      <Modal
        open={!!viewClient}
        onClose={() => {
          setViewClient(null)
          setRevealedData(null)
          setRevealModal(false)
          setSysPassword('')
        }}
        title="Client Details"
      >
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
          const PasswordRow = ({ label, field }: { label: string; field: string }) => {
            const val = revealedData ? revealedData[field] : '••••••••'
            if (!v[field] && !revealedData) {
              return (
                <div className="flex justify-between border-b border-gray-100 py-1.5 text-xs">
                  <span className="text-slate-500 uppercase font-mono">{label}</span>
                  <span className="text-gray-300 italic">—</span>
                </div>
              )
            }
            return (
              <div className="flex justify-between border-b border-gray-100 py-1.5 text-xs items-center">
                <span className="text-slate-500 uppercase font-mono">{label}</span>
                <span className="font-mono text-slate-800 font-semibold">{val || '—'}</span>
              </div>
            )
          }

          const canViewPass =
            selectedPrivilege?.permissions?.includes('view_passwords') ||
            privileges.find(pr => pr.client_id === v.id)?.permissions?.includes('view_passwords')

          return (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-gray-200 rounded-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded bg-white border border-gray-200 flex items-center justify-center text-cyan-500 shadow-sm">
                    <span className="material-symbols-outlined text-2xl">corporate_fare</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 uppercase font-[Space_Grotesk]">
                      {v.company_name}
                    </h3>
                    <p className="text-xs font-mono text-gray-500">
                      ID: SBC-{v.id?.toString().padStart(4, '0') || '----'}
                    </p>
                  </div>
                </div>
                {canViewPass && !revealedData && (
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
                <Row label="TIN" value={v.tin} />
                <Row label="Company Registration Number" value={v.company_registration_number} />
                <Row label="Business Type" value={v.business_type?.replaceAll('_', ' ')} />
                <Row label="Financial Year-End" value={v.financial_year_end} />
                <Row
                  label="Enabled Compliance Types"
                  value={CLIENT_TAX_TYPES
                    .filter(type => parseEnabledTaxTypes(v.enabled_tax_types).includes(type.value))
                    .map(type => `${type.authority}: ${type.label}`)
                    .join(', ')}
                />
                <Row label="Contact Person" value={v.contact_person} />
                <Row label="Phone" value={v.phone} />
                <Row label="Email" value={v.email} />
              </div>

              {(['tra', 'zra', 'bpra', 'zssf'] as const).map(a => (
                <div key={a}>
                  <h4
                    className={`text-[10px] font-bold uppercase tracking-wider mb-2 border-b pb-1 ${
                      a === 'tra' ? 'text-blue-600'
                      : a === 'zra' ? 'text-emerald-600'
                      : a === 'bpra' ? 'text-purple-600'
                      : 'text-orange-600'
                    }`}
                  >
                    {a.toUpperCase()}
                  </h4>
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
                          let file = v[`${a}_attachment`]
                          if (Array.isArray(file)) file = file[0]
                          if (typeof file === 'string' && (file.startsWith('[') || file.startsWith('{'))) {
                            try {
                              const parsed = JSON.parse(file)
                              if (Array.isArray(parsed)) file = parsed[0]
                              else if (typeof parsed === 'string') file = parsed
                            } catch (e) {}
                          }
                          if (typeof file === 'string') {
                            file = file.replace(/^\[|\]$/g, '').replace(/["']/g, '').trim()
                          }
                          if (!file || typeof file !== 'string' || file === 'Array') {
                            alert('Attachment haipo au ni batili. Tafadhali pakia tena.')
                            return
                          }
                          const base = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
                          setPdfPreview(`${base}/files/uploads/clients/${file}`)
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
                <Row
                  label="Balance"
                  value={`TZS ${formatNumber((v.total_contract_amount || 0) - (v.amount_paid || 0))}`}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  className="px-6 py-2 bg-slate-800 text-white text-xs font-bold uppercase hover:bg-slate-700 rounded-sm"
                  onClick={() => {
                    setViewClient(null)
                    setRevealedData(null)
                  }}
                >
                  Close Record
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ================= MANAGE MODAL ================= */}
      <Modal
        open={manageModal}
        onClose={() => setManageModal(false)}
        title={`Manage ${clientData?.company_name || ''} Records`}
      >
        {clientData && selectedPrivilege && (() => {
          const canEdit = selectedPrivilege.permissions.includes('edit_clients')
          const canViewCompliance = canEdit
            || selectedPrivilege.permissions.includes('view_compliance_profile')
            || selectedPrivilege.permissions.includes('edit_compliance_profile')
          const canEditCompliance = canEdit || selectedPrivilege.permissions.includes('edit_compliance_profile')
          const canViewPass = selectedPrivilege.permissions.includes('view_passwords')
          const allowedTabs = TABS.filter(tab => selectedPrivilege.permissions.includes(tab.perm))

          return (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              {canViewCompliance && (
                <section className="space-y-4 border border-cyan-100 bg-cyan-50/40 p-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-800">Compliance Profile</h4>
                    <p className="mt-1 text-[10px] text-slate-500">Applicable registrations and tax types for this client.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Company Registration Number</span>
                      <input
                        disabled={!canEditCompliance}
                        value={clientData.company_registration_number || ''}
                        onChange={event => setClientData({ ...clientData, company_registration_number: event.target.value })}
                        className="w-full border border-gray-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Entity / Business Type</span>
                      <select
                        disabled={!canEditCompliance}
                        value={clientData.business_type || ''}
                        onChange={event => setClientData({ ...clientData, business_type: event.target.value })}
                        className="w-full border border-gray-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
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
                        disabled={!canEditCompliance}
                        value={(clientData.financial_year_end || '').split('T')[0]}
                        onChange={event => setClientData({ ...clientData, financial_year_end: event.target.value })}
                        className="w-full border border-gray-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {CLIENT_TAX_TYPES.map(taxType => {
                      const enabledTypes = parseEnabledTaxTypes(clientData.enabled_tax_types)
                      const enabled = enabledTypes.includes(taxType.value)
                      return (
                        <label key={taxType.value} className="flex items-start gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            disabled={!canEditCompliance}
                            checked={enabled}
                            onChange={event => setClientData({
                              ...clientData,
                              enabled_tax_types: event.target.checked
                                ? [...enabledTypes, taxType.value]
                                : enabledTypes.filter(value => value !== taxType.value),
                            })}
                            className="mt-0.5 accent-cyan-600"
                          />
                          <span><b className="mr-1">{taxType.authority}</b>{taxType.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </section>
              )}

              {canViewPass && !revealedData && (
                <div className="flex justify-end pb-2">
                  <button
                    onClick={() => setRevealModal(true)}
                    className="flex items-center gap-1 px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase rounded-sm hover:bg-slate-700 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">lock_open</span>
                    Reveal Passwords
                  </button>
                </div>
              )}

              <div className="flex border-b border-gray-200 overflow-x-auto">
                {allowedTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider font-mono transition-colors border-b-2 whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'border-cyan-500 text-cyan-600'
                        : 'border-transparent text-gray-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {allowedTabs.map(tab => activeTab === tab.key && (
                <div key={tab.key} className="space-y-4 pt-2">
                  <h4 className={`text-xs font-bold uppercase tracking-wider border-b pb-1 ${tab.color}`}>
                    {tab.label} Credentials & Dates
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{tab.label} Number</label>
                      <input
                        disabled={!canEdit}
                        className={`w-full px-3 py-2 border border-gray-200 text-sm rounded-sm font-mono ${!canEdit ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'}`}
                        value={clientData[`${tab.key}_number`] || ''}
                        onChange={e => setClientData({ ...clientData, [`${tab.key}_number`]: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Username</label>
                      <input
                        disabled={!canEdit}
                        className={`w-full px-3 py-2 border border-gray-200 text-sm rounded-sm font-mono ${!canEdit ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'}`}
                        value={clientData[`${tab.key}_username`] || ''}
                        onChange={e => setClientData({ ...clientData, [`${tab.key}_username`]: e.target.value })}
                      />
                    </div>

                    {canViewPass && (
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">{tab.label} Password</label>
                        <input
                          disabled={!revealedData || !canEdit}
                          className={`w-full px-3 py-2 border border-gray-200 text-sm rounded-sm font-mono ${
                            !revealedData ? 'bg-slate-100 text-slate-400' : !canEdit ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'
                          }`}
                          value={revealedData ? revealedData[`${tab.key}_password`] || '' : '••••••••'}
                          onChange={e =>
                            setRevealedData({ ...revealedData, [`${tab.key}_password`]: e.target.value })
                          }
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Registration Date</label>
                      <input
                        type="date"
                        disabled={!canEdit}
                        className={`w-full px-3 py-2 border border-gray-200 text-sm rounded-sm font-mono ${!canEdit ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'}`}
                        value={clientData[`${tab.key}_reg_date`]?.split('T')[0] || ''}
                        onChange={e => setClientData({ ...clientData, [`${tab.key}_reg_date`]: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Start Date</label>
                      <input
                        type="date"
                        disabled={!canEdit}
                        className={`w-full px-3 py-2 border border-gray-200 text-sm rounded-sm font-mono ${!canEdit ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'}`}
                        value={clientData[`${tab.key}_start_date`]?.split('T')[0] || ''}
                        onChange={e => setClientData({ ...clientData, [`${tab.key}_start_date`]: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">End Date</label>
                      <input
                        type="date"
                        disabled={!canEdit}
                        className={`w-full px-3 py-2 border border-gray-200 text-sm rounded-sm font-mono ${!canEdit ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'}`}
                        value={clientData[`${tab.key}_end_date`]?.split('T')[0] || ''}
                        onChange={e => setClientData({ ...clientData, [`${tab.key}_end_date`]: e.target.value })}
                      />
                    </div>

                    <div className="sm:col-span-2 mt-2">
                      <label className="block text-[10px] font-bold text-cyan-600 uppercase mb-1 font-mono">
                        Upload {tab.label} Attachment
                      </label>
                      <input
                        type="file"
                        accept="application/pdf,image/*,.doc,.docx"
                        className="w-full px-3 py-2 bg-slate-50 border border-cyan-300 text-sm rounded-sm file:mr-4 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-cyan-100 file:text-cyan-700 hover:file:bg-cyan-200"
                        onChange={e =>
                          setUploadFiles({ ...uploadFiles, [tab.key]: e.target.files?.[0] || null })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {isAuditor ? 'My Auditor Documents' : 'My Staff Documents'}
                    </h5>
                    {clientDocuments.filter(document => document.authority === tab.key.toUpperCase()).length > 0 ? (
                      clientDocuments
                        .filter(document => document.authority === tab.key.toUpperCase())
                        .map(document => (
                          <div key={document.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-slate-200 bg-white p-2 text-xs">
                            <div className="min-w-0 flex-1">
                              <p className="break-all font-medium text-slate-700">{document.original_name}</p>
                              {isAuditor && (
                                <span className={`mt-1 inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[9px] font-bold uppercase ${
                                  document.feedback?.trim()
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-amber-200 bg-amber-50 text-amber-700'
                                }`}>
                                  <span className="material-symbols-outlined text-[12px]">
                                    {document.feedback?.trim() ? 'mark_email_read' : 'schedule'}
                                  </span>
                                  {document.feedback?.trim() ? 'Admin replied' : 'Awaiting admin reply'}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => void downloadClientDocument(document)}
                              className="shrink-0 text-cyan-700 underline"
                            >
                              Download
                            </button>
                            {isAuditor && document.feedback?.trim() && (
                              <div className="w-full border-t border-emerald-100 pt-2 text-emerald-900">
                                <p className="whitespace-pre-wrap break-words">{document.feedback}</p>
                                <p className="mt-1 text-[10px] text-slate-400">
                                  {document.feedback_by_name ? `Replied by ${document.feedback_by_name}` : 'Admin reply'}
                                  {document.feedback_at ? ` · ${new Date(document.feedback_at).toLocaleString()}` : ''}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                    ) : (
                      <p className="text-xs italic text-slate-400">No documents uploaded for this institution yet.</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
                <button
                  className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 rounded-sm"
                  onClick={() => setManageModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 rounded-sm flex items-center gap-2 disabled:opacity-50"
                  onClick={saveChanges}
                  disabled={busy}
                >
                  {busy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ================= SECURITY CHECK MODAL ================= */}
      <Modal open={revealModal} onClose={() => setRevealModal(false)} title="Security Check">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Ili kuona password za mteja, tafadhali weka password yako ya mfumo (System Password).
          </p>
          {revealError && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{revealError}</div>
          )}
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
            <button
              className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 rounded-sm"
              onClick={() => setRevealModal(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 rounded-sm flex items-center gap-2 disabled:opacity-50"
              onClick={() => {
                const targetId = viewClient?.id || clientData?.id
                if (targetId) handleRevealPasswords(targetId)
                else setRevealError('Mteja hajulikani')
              }}
              disabled={revealBusy}
            >
              {revealBusy ? 'Checking...' : 'Reveal'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ================= PDF PREVIEW ================= */}
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
              <button
                className="px-6 py-2 bg-slate-800 text-white text-xs font-bold uppercase hover:bg-slate-700 rounded-sm"
                onClick={() => setPdfPreview(null)}
              >
                Funga
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}