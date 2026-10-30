import { useEffect, useState } from 'react'
import api, { errMsg } from '../api/client'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import Swal from 'sweetalert2'

// ---------- Helpers ----------
function formatNumber(val: number | string): string {
  const num = typeof val === 'string' ? parseInt(val.replace(/,/g, ''), 10) : val
  if (isNaN(num)) return '0'
  return num.toLocaleString('en-US')
}

// ---------- Permission labels ----------
const PERMISSION_LABELS: Record<string, string> = {
  upload_tra: 'Upload TRA Docs',
  upload_zra: 'Upload ZRA Docs',
  upload_bpra: 'Upload BPRA Docs',
  upload_zssf: 'Upload ZSSF Docs',
  edit_clients: 'Edit Clients',
  view_clients: 'View Clients',
  view_passwords: 'Reveal Passwords',
}

const TABS = [
  { key: 'tra',  label: 'TRA',  perm: 'upload_tra', color: 'text-blue-600' },
  { key: 'zra',  label: 'ZRA',  perm: 'upload_zra', color: 'text-emerald-600' },
  { key: 'bpra', label: 'BPRA', perm: 'upload_bpra', color: 'text-purple-600' },
  { key: 'zssf', label: 'ZSSF', perm: 'upload_zssf', color: 'text-orange-600' },
]

export default function MyPrivileges() {
  const [privileges, setPrivileges] = useState<any[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')

  // Modals
  const [manageModal, setManageModal] = useState(false)
  const [selectedPrivilege, setSelectedPrivilege] = useState<any>(null)
  const [clientData, setClientData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('tra')
  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({})

  // View Client Modal
  const [viewClient, setViewClient] = useState<any>(null)
  const [pdfPreview, setPdfPreview] = useState<string | null>(null)

  // Security Check
  const [revealModal, setRevealModal] = useState(false)
  const [sysPassword, setSysPassword] = useState('')
  const [revealedData, setRevealedData] = useState<any>(null)
  const [revealBusy, setRevealBusy] = useState(false)
  const [revealError, setRevealError] = useState('')

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

  // ---------- Manage (edit/upload) ----------
  async function openManage(p: any) {
    if (!p.client_id) return showToast('Privilege hii ni ya Global', 'error')
    setBusy(true)
    try {
      const r = await api.get(`/clients/${p.client_id}`)
      setClientData(r.data.data)
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

  // ---------- View Client (read-only) ----------
  async function openView(p: any) {
    if (!p.client_id) return showToast('Privilege hii ni ya Global', 'error')
    // 🔒 Ulinzi: staff lazima awe na view_clients permission
    if (!(p.permissions || []).includes('view_clients')) {
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

  // ---------- Reveal Passwords ----------
  async function handleRevealPasswords(targetId: number) {
    if (!sysPassword) {
      setRevealError('Weka password yako ya mfumo')
      return
    }
    setRevealBusy(true); setRevealError('')
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

  // ---------- Save Changes (manage) ----------
  async function saveChanges() {
    if (!clientData || !selectedPrivilege) return
    setBusy(true)
    showToast('SAVING CHANGES...', 'loading')
    try {
      const fd = new FormData()
      const canEdit = selectedPrivilege.permissions.includes('edit_clients')
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
      let hasFile = false
      Object.entries(uploadFiles).forEach(([key, file]) => {
        if (file) {
          fd.append(`${key}_attachment`, file)
          hasFile = true
        }
      })
      if (!canEdit && !hasFile) throw new Error('Hakuna mabadiliko ya kuhifadhi.')
      await api.post(`/clients/${clientData.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      showToast('RECORDS SAVED SUCCESSFULLY', 'success')
      setManageModal(false)
      load()
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message || 'Kuna tatizo limetokea', 'error')
    } finally {
      setBusy(false)
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

  return (
    <div className="space-y-6 relative">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-cyan-100/50 text-cyan-800 text-[10px] uppercase tracking-widest font-bold border border-cyan-200">
            STAFF // WORKSPACE
          </span>
          <span className="text-gray-400 text-[10px]">//</span>
          <span className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">MY PRIVILEGES</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk] uppercase">
          My Assigned Privileges
        </h2>
      </div>

      {error && (
        <div className="text-red-600 bg-red-50 p-3 border border-red-200 rounded text-sm font-mono">
          {error}
        </div>
      )}

      {/* SEARCH BAR */}
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
              const canView = (p.permissions || []).includes('view_clients')
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
                        <span className="text-[10px] text-gray-400 italic">No permissions</span>
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
                      {/* 🔒 View button inaonekana tu kama staff ana view_clients */}
                      {p.client_id && canView && (
                        <button
                          className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                          onClick={() => openView(p)}
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      )}
                      {p.client_id && allowedTabs.length > 0 && (
                        <button
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          onClick={() => openManage(p)}
                          title="Manage Records"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit_document</span>
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

          const canViewPass = selectedPrivilege?.permissions?.includes('view_passwords')
            || privileges.find(pr => pr.client_id === v.id)?.permissions?.includes('view_passwords')

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
                <h4 className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-2 border-b pb-1">
                  General Info
                </h4>
                <Row label="Location" value={v.location} />
                <Row label="Industry" value={v.industry} />
                <Row label="Contact Person" value={v.contact_person} />
                <Row label="Phone" value={v.phone} />
                <Row label="Email" value={v.email} />
                <Row label="Financial Year Start" value={v.financial_year_start} />
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
                <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2 border-b pb-1">
                  Finance
                </h4>
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

      {/* ================= MANAGE (EDIT/UPLOAD) MODAL ================= */}
      <Modal
        open={manageModal}
        onClose={() => setManageModal(false)}
        title={`Manage ${clientData?.company_name || ''} Records`}
      >
        {clientData && selectedPrivilege && (() => {
          const canEdit = selectedPrivilege.permissions.includes('edit_clients')
          const canViewPass = selectedPrivilege.permissions.includes('view_passwords')
          const allowedTabs = TABS.filter(tab => selectedPrivilege.permissions.includes(tab.perm))

          return (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
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
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">
                        {tab.label} Number
                      </label>
                      <input
                        disabled={!canEdit}
                        className={`w-full px-3 py-2 border border-gray-200 text-sm rounded-sm font-mono ${
                          !canEdit ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'
                        }`}
                        value={clientData[`${tab.key}_number`] || ''}
                        onChange={e =>
                          setClientData({ ...clientData, [`${tab.key}_number`]: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">
                        Username
                      </label>
                      <input
                        disabled={!canEdit}
                        className={`w-full px-3 py-2 border border-gray-200 text-sm rounded-sm font-mono ${
                          !canEdit ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'
                        }`}
                        value={clientData[`${tab.key}_username`] || ''}
                        onChange={e =>
                          setClientData({ ...clientData, [`${tab.key}_username`]: e.target.value })
                        }
                      />
                    </div>

                    {canViewPass && (
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">
                          {tab.label} Password
                        </label>
                        <input
                          disabled={!revealedData || !canEdit}
                          className={`w-full px-3 py-2 border border-gray-200 text-sm rounded-sm font-mono ${
                            !revealedData
                              ? 'bg-slate-100 text-slate-400'
                              : !canEdit
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-slate-50'
                          }`}
                          value={revealedData ? revealedData[`${tab.key}_password`] || '' : '••••••••'}
                          onChange={e =>
                            setRevealedData({
                              ...revealedData,
                              [`${tab.key}_password`]: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">
                        Registration Date
                      </label>
                      <input
                        type="date"
                        disabled={!canEdit}
                        className={`w-full px-3 py-2 border border-gray-200 text-sm rounded-sm font-mono ${
                          !canEdit ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'
                        }`}
                        value={clientData[`${tab.key}_reg_date`]?.split('T')[0] || ''}
                        onChange={e =>
                          setClientData({ ...clientData, [`${tab.key}_reg_date`]: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">
                        Start Date
                      </label>
                      <input
                        type="date"
                        disabled={!canEdit}
                        className={`w-full px-3 py-2 border border-gray-200 text-sm rounded-sm font-mono ${
                          !canEdit ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'
                        }`}
                        value={clientData[`${tab.key}_start_date`]?.split('T')[0] || ''}
                        onChange={e =>
                          setClientData({ ...clientData, [`${tab.key}_start_date`]: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">
                        End Date
                      </label>
                      <input
                        type="date"
                        disabled={!canEdit}
                        className={`w-full px-3 py-2 border border-gray-200 text-sm rounded-sm font-mono ${
                          !canEdit ? 'bg-slate-100 text-slate-500' : 'bg-slate-50'
                        }`}
                        value={clientData[`${tab.key}_end_date`]?.split('T')[0] || ''}
                        onChange={e =>
                          setClientData({ ...clientData, [`${tab.key}_end_date`]: e.target.value })
                        }
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
                          setUploadFiles({
                            ...uploadFiles,
                            [tab.key]: e.target.files?.[0] || null,
                          })
                        }
                      />
                      {clientData[`${tab.key}_attachment`] && (
                        <p className="text-[10px] text-gray-500 mt-1">
                          Current file:{' '}
                          <a
                            href={`${
                              import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
                            }/files/uploads/clients/${clientData[`${tab.key}_attachment`]}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-600 underline"
                          >
                            View Existing
                          </a>
                        </p>
                      )}
                    </div>
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">
              System Password
            </label>
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

      {/* ================= PDF PREVIEW MODAL ================= */}
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