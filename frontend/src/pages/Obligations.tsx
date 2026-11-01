import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { errMsg } from '../api/client'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import Swal from 'sweetalert2'
import type { Client, Obligation, User, Frequency } from '../types'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { escapeHtml, openPrintDocument } from '../utils/printDocument'

interface FormData {
  client_id: number
  title: string
  frequency: Frequency
  due_day: number
  default_staff_id: number
  authority: string
  document_type: string
  confirmed_due_date: string
  reminder_days: number[]
  requires_upload: boolean
  instructions: string
  is_active: boolean
}

const empty: FormData = {
  client_id: 0, title: '', frequency: 'monthly',
  due_day: 15, default_staff_id: 0, authority: '', document_type: '',
  confirmed_due_date: '', reminder_days: [7, 3, 1, 0], requires_upload: true,
  instructions: '', is_active: true,
}

const reminderOptions = [14, 7, 3, 1, 0]

function parseReminderDays(value: unknown): number[] {
  if (Array.isArray(value)) return value.map(Number).filter(day => Number.isInteger(day) && day >= 0)
  if (typeof value !== 'string') return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(Number).filter(day => Number.isInteger(day) && day >= 0) : []
  } catch {
    return []
  }
}

type SortKey = 'title' | 'client' | 'frequency' | 'due_day' | 'staff'

export default function Obligations() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [rows, setRows] = useState<Obligation[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [staff, setStaff] = useState<User[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Obligation | null>(null)
  const [form, setForm] = useState<FormData>(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  
  // Data Table States
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(1)
  const rowsPerPage = 10

  // View State
  const [viewObligation, setViewObligation] = useState<Obligation | null>(null)

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'loading' as 'loading' | 'success' | 'error' })
  function showToast(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
    setToast({ show: true, message, type })
    if (type !== 'loading') {
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000)
    }
  }

  const [searchParams, setSearchParams] = useSearchParams()

  async function load() {
    try {
      const [o, c, u] = await Promise.all([
        api.get('/obligations'), api.get('/clients'), api.get('/users'),
      ])
      setRows(o.data.data || [])
      setClients(c.data.data || [])
      setStaff(u.data.data || [])
    } catch (e) {
      setError(errMsg(e))
    }
  }
  
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      openCreate()
      const tab = searchParams.get('tab')
      setSearchParams(tab ? { tab } : {})
    }
  }, [searchParams])

  function openCreate() {
    setEditing(null)
    setForm({ ...empty, client_id: clients[0]?.id || 0, default_staff_id: staff[0]?.id || 0 })
    setModal(true); setError('')
  }
  
  function openEdit(o: Obligation) {
    setEditing(o)
    const savedReminderDays = parseReminderDays(o.reminder_days)
    setForm({
      client_id: o.client_id, title: o.title, frequency: o.frequency,
      due_day: Number((o.confirmed_due_date || calculateDeadline(o).isoDate).slice(8, 10)) || o.due_day,
      default_staff_id: o.default_staff_id || 0,
      authority: o.authority || '', document_type: o.document_type || '',
      confirmed_due_date: o.confirmed_due_date?.slice(0, 10) || calculateDeadline(o).isoDate,
      reminder_days: savedReminderDays.length ? savedReminderDays : [7, 3, 1, 0],
      requires_upload: Boolean(o.requires_upload), instructions: o.instructions || '',
      is_active: o.is_active,
    })
    setModal(true); setError('')
  }
  
  async function save() {
    if (!form.client_id || !form.title.trim() || !form.authority || !form.document_type.trim()
      || !form.confirmed_due_date || !form.default_staff_id || form.reminder_days.length === 0) {
      setError(t('Complete all required obligation fields and select at least one reminder.'))
      return
    }
    setBusy(true); setError('')
    showToast(editing ? 'UPDATING OBLIGATION...' : 'CREATING OBLIGATION...', 'loading')
    
    try {
      if (editing) {
        await api.put(`/obligations/${editing.id}`, form)
        showToast('OBLIGATION UPDATED', 'success')
      } else {
        await api.post('/obligations', form)
        showToast('NEW OBLIGATION CREATED', 'success')
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

  async function remove(o: Obligation) {
    const result = await Swal.fire({
      title: 'Delete Obligation?',
      text: `Are you sure you want to delete "${o.title}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-xl shadow-2xl font-sans' }
    })

    if (!result.isConfirmed) return

    showToast('DELETING OBLIGATION...', 'loading')
    try { 
      await api.delete(`/obligations/${o.id}`)
      showToast('OBLIGATION DELETED', 'success')
      load() 
    }
    catch (e) { 
      Swal.fire('Error!', errMsg(e), 'error')
      showToast('DELETE FAILED', 'error')
    }
  }

  function clientName(id: number) {
    if (!id) return 'Unknown Client'
    return clients.find((c) => c.id === id)?.company_name || `#${id}`
  }
  function staffName(id?: number) {
    if (!id) return 'Unassigned'
    return staff.find((s) => s.id === id)?.name || '—'
  }

  function reminderDaysLabel(value: unknown): string {
    if (Array.isArray(value)) return value.join(', ') || '—'
    if (typeof value !== 'string' || !value.trim()) return '—'

    try {
      const parsed: unknown = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.join(', ') || '—'
      return String(parsed ?? '—')
    } catch {
      return value
    }
  }

  function printObligation(obligation: Obligation) {
    const row = (label: string, value: string | number | boolean | null | undefined) =>
      `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value === null || value === undefined || value === '' ? '—' : value)}</td></tr>`
    const content = `
      <h1>${escapeHtml(obligation.title)}</h1>
      <p>Obligation Record · ID: SBC-${String(obligation.id).padStart(4, '0')}</p>
      <section>
        <h2>Obligation Details</h2>
        <table>
          ${row('Client', clientName(obligation.client_id))}
          ${row('Institution', obligation.authority || '—')}
          ${row('Document Type', obligation.document_type)}
          ${row('Frequency', obligation.frequency.replace('_', ' '))}
          ${row('Confirmed Due Date', obligation.confirmed_due_date)}
          ${row('Due Day', `${obligation.due_day} of the period`)}
          ${row('Next Deadline', calculateDeadline(obligation).dateStr)}
          ${row('Confirmed Due Date', obligation.confirmed_due_date)}
          ${row('Assigned Staff', staffName(obligation.default_staff_id))}
          ${row('Filing Status', obligation.filing_status)}
          ${row('Reminder Days', reminderDaysLabel(obligation.reminder_days))}
          ${row('Proof Required', Boolean(obligation.requires_upload))}
          ${row('Instructions', obligation.instructions)}
          ${row('Status', obligation.is_active ? 'Active' : 'Inactive')}
        </table>
      </section>
    `
    if (!openPrintDocument(`Obligation - ${obligation.title}`, content, user?.name || 'Admin')) {
      showToast('Ruhusu pop-ups ili kuchapisha obligation', 'error')
    }
  }

  // DATA TABLE LOGIC - Nimebadilisha hapa kutumia String()
  const filteredData = useMemo(() => {
    return rows.filter((o) => {
      const clientNameStr = String(clientName(o.client_id)).toLowerCase()
      const staffNameStr = String(staffName(o.default_staff_id)).toLowerCase()
      const searchLower = search.toLowerCase()
      const titleStr = String(o.title || '').toLowerCase()
      
      return (
        titleStr.includes(searchLower) ||
        clientNameStr.includes(searchLower) ||
        staffNameStr.includes(searchLower)
      )
    })
  }, [rows, search, clients, staff])

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA: any = String(a.title || '')
      let valB: any = String(b.title || '')

      if (sortKey === 'client') {
        valA = clientName(a.client_id)
        valB = clientName(b.client_id)
      } else if (sortKey === 'staff') {
        valA = staffName(a.default_staff_id)
        valB = staffName(b.default_staff_id)
      } else if (sortKey === 'frequency') {
        valA = String(a.frequency || '')
        valB = String(b.frequency || '')
      } else if (sortKey === 'due_day') {
        valA = Number(a.due_day) || 0
        valB = Number(b.due_day) || 0
      }

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }, [filteredData, sortKey, sortAsc, clients, staff])

  const totalPages = Math.ceil(sortedData.length / rowsPerPage)
  const paginatedData = sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
    setPage(1)
  }

  function calculateDeadline(obligation: Obligation) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let deadline = new Date();
    const confirmedDate = obligation.confirmed_due_date
      ? new Date(`${obligation.confirmed_due_date.slice(0, 10)}T00:00:00`)
      : null
    const periodKey = (date: Date) => {
      if (obligation.frequency === 'monthly') return date.getFullYear() * 12 + date.getMonth()
      if (obligation.frequency === 'quarterly') return date.getFullYear() * 4 + Math.floor(date.getMonth() / 3)
      return date.getFullYear()
    }
    const confirmedIsCurrentOrFuture = confirmedDate
      && !Number.isNaN(confirmedDate.getTime())
      && (obligation.frequency === 'one_off' || periodKey(confirmedDate) >= periodKey(today))

    if (confirmedIsCurrentOrFuture && confirmedDate) {
      deadline = confirmedDate
    } else if (obligation.frequency === 'monthly') {
      deadline = new Date(today.getFullYear(), today.getMonth(), obligation.due_day);
      if (deadline < today) deadline.setMonth(deadline.getMonth() + 1);
    } else if (obligation.frequency === 'quarterly') {
      deadline = new Date(today.getFullYear(), today.getMonth(), obligation.due_day);
      const currentMonth = today.getMonth();
      const nextQuarterMonth = Math.ceil((currentMonth + 1) / 3) * 3; 
      deadline = new Date(today.getFullYear(), nextQuarterMonth - 1, obligation.due_day);
      if (deadline < today) deadline.setFullYear(deadline.getFullYear() + 1);
    } else if (obligation.frequency === 'annual') {
      deadline = new Date(today.getFullYear(), 0, obligation.due_day);
      if (deadline < today) deadline.setFullYear(deadline.getFullYear() + 1);
    } else {
      deadline = new Date(today.getFullYear(), today.getMonth(), obligation.due_day);
    }

    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      dateStr: deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      isoDate: `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-${String(deadline.getDate()).padStart(2, '0')}`,
      daysLeft: diffDays
    }
  }

  if (!rows) {
    return <div className="p-8 text-center text-cyan-600 animate-pulse font-mono">Loading obligations data...</div>
  }

  return (
    <div className="space-y-6 relative">
      
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-cyan-100/50 text-cyan-800 text-[10px] uppercase tracking-widest font-bold border border-cyan-200">{t('SYS.OPS // DEADLINES')}</span>
            <span className="text-gray-400 text-[10px]">//</span>
            <span className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">DATA: OBLIGATIONS</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk] uppercase">{t('Task Assignments')}</h2>
        </div>
        
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all text-xs font-bold uppercase active:scale-95" 
          onClick={openCreate}
        >
          <span className="material-symbols-outlined text-[16px]">add_task</span>
          {t('Assign task')}
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 border border-red-200 rounded text-sm font-mono">{error}</div>}

      {/* SEARCH & TABLE CONTROL BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 border border-gray-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search by title, client, or staff..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          Displaying {paginatedData.length} of {sortedData.length} obligations
        </div>
      </div>

      {/* JEDWALI LA OBLIGATIONS */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 font-semibold cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1">
                  Title {sortKey === 'title' && <span className="material-symbols-outlined text-[14px]">{sortAsc ? 'arrow_upward' : 'arrow_downward'}</span>}
                </div>
              </th>
              <th className="px-4 py-4 font-semibold cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('client')}>
                <div className="flex items-center gap-1">
                  Client {sortKey === 'client' && <span className="material-symbols-outlined text-[14px]">{sortAsc ? 'arrow_upward' : 'arrow_downward'}</span>}
                </div>
              </th>
              <th className="px-4 py-4 font-semibold cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('frequency')}>
                <div className="flex items-center gap-1">
                  Frequency {sortKey === 'frequency' && <span className="material-symbols-outlined text-[14px]">{sortAsc ? 'arrow_upward' : 'arrow_downward'}</span>}
                </div>
              </th>
              <th className="px-4 py-4 font-semibold cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('due_day')}>
                <div className="flex items-center gap-1">
                  Due Day {sortKey === 'due_day' && <span className="material-symbols-outlined text-[14px]">{sortAsc ? 'arrow_upward' : 'arrow_downward'}</span>}
                </div>
              </th>
              <th className="px-4 py-4 font-semibold cursor-pointer hover:bg-slate-100 select-none" onClick={() => handleSort('staff')}>
                <div className="flex items-center gap-1">
                  Assigned {sortKey === 'staff' && <span className="material-symbols-outlined text-[14px]">{sortAsc ? 'arrow_upward' : 'arrow_downward'}</span>}
                </div>
              </th>
              <th className="px-4 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/70 transition-colors group">
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {o.title}
                  <span className="mt-1 block text-[10px] font-medium text-slate-500">
                    {o.authority || '—'} · {o.document_type || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{clientName(o.client_id)}</td>
                <td className="px-4 py-3 text-slate-600 text-xs capitalize">
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-sm font-mono">
                    {o.frequency.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                  {o.confirmed_due_date ? o.confirmed_due_date.slice(0, 10) : `${t('Day')} ${o.due_day}`}
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs flex items-center gap-2">
                  {o.default_staff_id ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center text-[9px] text-cyan-700 font-bold">
                        {staffName(o.default_staff_id).charAt(0)}
                      </div>
                      {staffName(o.default_staff_id)}
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap flex justify-end gap-1">
                  <button 
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" 
                    onClick={() => setViewObligation(o)}
                    title="View"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                  <button 
                    className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors" 
                    onClick={() => printObligation(o)}
                    title="Print"
                  >
                    <span className="material-symbols-outlined text-[18px]">print</span>
                  </button>
                  <button 
                    className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors" 
                    onClick={() => openEdit(o)}
                    title="Edit"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button 
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                    onClick={() => remove(o)}
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-12 font-mono text-xs uppercase">
                  No obligations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-3 border border-gray-200 shadow-sm">
          <span className="text-[10px] text-gray-500 font-mono uppercase">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button 
              className="px-3 py-1 bg-slate-50 border border-gray-200 text-xs font-bold uppercase text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <button 
              className="px-3 py-1 bg-slate-50 border border-gray-200 text-xs font-bold uppercase text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODAL YA KUONGEZA / KUHARIRI */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t('Edit task') : t('Assign task')}>
        <div className="space-y-4">
          {error && <div className="text-xs text-red-600 bg-red-50 p-2 border border-red-100 rounded font-mono">{error}</div>}
          
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Client')} *</label>
            <select 
              required
              className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm"
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: Number(e.target.value) })}
            >
              <option value={0} disabled>-- Select Client --</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Title / Task Name')} *</label>
            <input 
              required
              className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm" 
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Authority')} *</label>
              <select
                required
                className="w-full rounded-sm border border-gray-200 bg-slate-50 px-3 py-2 text-sm"
                value={form.authority}
                onChange={event => setForm({ ...form, authority: event.target.value })}
              >
                <option value="">{t('Select authority')}</option>
                {['TRA', 'ZRA', 'BPRA', 'ZSSF', 'ALL', 'TWO'].map(authority => <option key={authority} value={authority}>{authority}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Document / Return Type')} *</label>
              <input
                required
                className="w-full rounded-sm border border-gray-200 bg-slate-50 px-3 py-2 text-sm"
                value={form.document_type}
                onChange={event => setForm({ ...form, document_type: event.target.value })}
                placeholder={t('e.g. VAT Return')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Frequency')} *</label>
              <select 
                required
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm uppercase font-bold text-slate-700"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
              >
                <option value="monthly">{t('Monthly')}</option>
                <option value="quarterly">{t('Quarterly')}</option>
                <option value="annual">{t('Annual')}</option>
                <option value="one_off">{t('One-off')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Confirmed Due Date')} *</label>
              <input
                required
                type="date"
                className="w-full rounded-sm border border-gray-200 bg-slate-50 px-3 py-2 text-sm"
                value={form.confirmed_due_date}
                onChange={event => setForm({
                  ...form,
                  confirmed_due_date: event.target.value,
                  due_day: Number(event.target.value.slice(-2)) || form.due_day,
                })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Assigned Staff')} *</label>
              <select
                required
                className="w-full rounded-sm border border-gray-200 bg-slate-50 px-3 py-2 text-sm"
                value={form.default_staff_id}
                onChange={event => setForm({ ...form, default_staff_id: Number(event.target.value) })}
              >
                <option value={0} disabled>{t('Select staff')}</option>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <fieldset>
              <legend className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('Send reminders')} *</legend>
              <div className="flex flex-wrap gap-2">
                {reminderOptions.map(day => (
                  <label key={day} className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold ${form.reminder_days.includes(day) ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                    <input
                      type="checkbox"
                      className="mr-2 accent-cyan-600"
                      checked={form.reminder_days.includes(day)}
                      onChange={() => setForm({
                        ...form,
                        reminder_days: form.reminder_days.includes(day)
                          ? form.reminder_days.filter(value => value !== day)
                          : [...form.reminder_days, day].sort((a, b) => b - a),
                      })}
                    />
                    {day === 0 ? t('Due date') : `${day} ${t('days before')}`}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <input
              type="checkbox"
              className="mt-1 accent-cyan-600"
              checked={form.requires_upload}
              onChange={event => setForm({ ...form, requires_upload: event.target.checked })}
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">{t('Proof attachment required')}</span>
              <span className="block text-xs text-slate-500">{t('Staff must upload evidence before closing this task.')}</span>
            </span>
          </label>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Task instructions')}</label>
            <textarea
              rows={3}
              className="w-full rounded-sm border border-gray-200 bg-slate-50 px-3 py-2 text-sm"
              value={form.instructions}
              onChange={event => setForm({ ...form, instructions: event.target.value })}
              placeholder={t('Describe the required steps or completion criteria.')}
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
                'Save Obligation'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL YA KU-VIEW OBLIGATION */}
      <Modal open={!!viewObligation} onClose={() => setViewObligation(null)} title="Obligation Record Details">
        {viewObligation && (() => {
          const { dateStr, daysLeft } = calculateDeadline(viewObligation);
          const isUrgent = daysLeft <= 5;

          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-gray-200 rounded-sm">
                <div className="w-16 h-16 rounded bg-white border border-gray-200 flex items-center justify-center text-cyan-500 shadow-sm">
                  <span className="material-symbols-outlined text-3xl">assignment</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 uppercase font-[Space_Grotesk]">{viewObligation.title}</h3>
                  <p className="text-xs font-mono text-gray-500">OBLIGATION ID: SBC-{viewObligation.id.toString().padStart(4, '0')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 border border-gray-100 bg-white sm:col-span-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Assigned Client</span>
                  <span className="text-sm font-semibold text-slate-700">{clientName(viewObligation.client_id)}</span>
                </div>
                <div className="p-3 border border-gray-100 bg-white">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">{t('Authority')}</span>
                  <span className="text-sm font-semibold text-slate-700">{viewObligation.authority || '—'}</span>
                </div>
                <div className="p-3 border border-gray-100 bg-white">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">{t('Document / Return Type')}</span>
                  <span className="text-sm font-semibold text-slate-700">{viewObligation.document_type || '—'}</span>
                </div>
                {viewObligation.instructions && (
                  <div className="p-3 border border-gray-100 bg-white sm:col-span-2">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">{t('Task instructions')}</span>
                    <span className="text-sm text-slate-700">{viewObligation.instructions}</span>
                  </div>
                )}
                <div className="p-3 border border-gray-100 bg-white sm:col-span-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">{t('Proof attachment')}</span>
                  <span className="text-sm font-semibold text-slate-700">{viewObligation.requires_upload ? t('Required') : t('Optional')}</span>
                </div>
                <div className="p-3 border border-gray-100 bg-white">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Frequency</span>
                  <span className="text-sm font-semibold text-slate-700 capitalize">{viewObligation.frequency.replace('_', ' ')}</span>
                </div>
                <div className="p-3 border border-gray-100 bg-white">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Due Day</span>
                  <span className="text-sm font-semibold text-slate-700 font-mono">{viewObligation.due_day} of the period</span>
                </div>
                
                <div className="p-3 border border-gray-100 bg-white sm:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Next Deadline</span>
                    <span className="text-sm font-semibold text-slate-700 font-mono">{dateStr}</span>
                  </div>
                  <div>
                    <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-sm ${
                      isUrgent ? 'bg-red-100 text-red-600 animate-pulse border border-red-200' : 'bg-green-100 text-green-600 border border-green-200'
                    }`}>
                      {daysLeft === 0 ? 'Due Today' : `${daysLeft} Days Left`}
                    </span>
                  </div>
                </div>

                <div className="p-3 border border-gray-100 bg-white sm:col-span-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Default Staff</span>
                  <span className="text-sm font-semibold text-slate-700">{staffName(viewObligation.default_staff_id)}</span>
                </div>
                <div className="p-3 border border-gray-100 bg-white sm:col-span-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Status</span>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider ${viewObligation.is_active ? 'text-green-600' : 'text-red-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${viewObligation.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {viewObligation.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-xs font-bold uppercase hover:bg-cyan-700 transition-colors shadow-sm rounded-sm"
                  onClick={() => printObligation(viewObligation)}
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  Print
                </button>
                <button className="px-6 py-2 bg-slate-800 text-white text-xs font-bold uppercase hover:bg-slate-700 transition-colors shadow-sm rounded-sm" onClick={() => setViewObligation(null)}>Close Record</button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  )
}