import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import api, { errMsg } from '../api/client'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import type { Client, Frequency } from '../types'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { escapeHtml, openPrintDocument } from '../utils/printDocument'

type ExamType = 'principal' | 'penalties' | 'interest'

interface Examination {
  id: number
  client_id: number
  company_name: string
  exam_type: ExamType
  frequency: Frequency
  exam_date: string
  attachment_path: string
}

interface ExaminationForm {
  client_id: number
  exam_type: ExamType
  frequency: Frequency
  exam_date: string
  attachment: File | null
}

const emptyForm: ExaminationForm = {
  client_id: 0,
  exam_type: 'principal',
  frequency: 'monthly',
  exam_date: new Date().toISOString().slice(0, 10),
  attachment: null,
}

const examLabels: Record<ExamType, string> = {
  principal: 'Principal',
  penalties: 'Penalties',
  interest: 'Interest',
}

const frequencyLabels: Record<Frequency, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
  quarterly: 'Quarterly',
  one_off: 'One-off',
}

const fileUrl = (path: string) =>
  `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/files/${path}`

export default function Examinations() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [rows, setRows] = useState<Examination[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewing, setViewing] = useState<Examination | null>(null)
  const [editing, setEditing] = useState<Examination | null>(null)
  const [form, setForm] = useState<ExaminationForm>(emptyForm)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'loading' as 'loading' | 'success' | 'error' })

  function showToast(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
    setToast({ show: true, message, type })
    if (type !== 'loading') window.setTimeout(() => setToast(current => ({ ...current, show: false })), 3000)
  }

  async function load() {
    try {
      const [examinations, clientsResponse] = await Promise.all([
        api.get('/examinations'),
        api.get('/clients'),
      ])
      setRows(examinations.data.data || [])
      setClients(clientsResponse.data.data || [])
    } catch (e) {
      setError(errMsg(e))
    }
  }

  useEffect(() => { void load() }, [])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter(row =>
      row.company_name.toLowerCase().includes(query)
      || examLabels[row.exam_type].toLowerCase().includes(query)
      || frequencyLabels[row.frequency].toLowerCase().includes(query),
    )
  }, [rows, search])

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm, client_id: clients[0]?.id || 0 })
    setError('')
    setModalOpen(true)
  }

  function openEdit(row: Examination) {
    setEditing(row)
    setForm({
      client_id: row.client_id,
      exam_type: row.exam_type,
      frequency: row.frequency,
      exam_date: row.exam_date.slice(0, 10),
      attachment: null,
    })
    setError('')
    setModalOpen(true)
  }

  async function save() {
    if (!form.client_id) {
      setError('Chagua client kwanza.')
      return
    }
    if (!editing && !form.attachment) {
      setError('Weka attachment ya examination.')
      return
    }

    const body = new FormData()
    body.append('client_id', String(form.client_id))
    body.append('exam_type', form.exam_type)
    body.append('frequency', form.frequency)
    body.append('exam_date', form.exam_date)
    if (form.attachment) body.append('attachment', form.attachment)
    if (editing) body.append('_method', 'PUT')

    setBusy(true)
    setError('')
    showToast(editing ? 'UPDATING EXAMINATION...' : 'SAVING EXAMINATION...')
    try {
      if (editing) {
        await api.post(`/examinations/${editing.id}`, body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/examinations', body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      setModalOpen(false)
      showToast(editing ? 'EXAMINATION UPDATED' : 'EXAMINATION SAVED', 'success')
      await load()
    } catch (e) {
      setError(errMsg(e))
      showToast('ACTION FAILED', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove(row: Examination) {
    const result = await Swal.fire({
      title: 'Futa examination?',
      text: `Rekodi ya ${row.company_name} pamoja na attachment yake itafutwa.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Futa',
      cancelButtonText: 'Ghairi',
    })
    if (!result.isConfirmed) return

    try {
      await api.delete(`/examinations/${row.id}`)
      showToast('EXAMINATION DELETED', 'success')
      await load()
    } catch (e) {
      showToast(errMsg(e), 'error')
    }
  }

  function printExamination(row: Examination) {
    const tableRow = (label: string, value: string) =>
      `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
    const date = new Date(`${row.exam_date.slice(0, 10)}T00:00:00`).toLocaleDateString()
    const attachmentUrl = fileUrl(row.attachment_path)
    const content = `
      <h1>${escapeHtml(row.company_name)}</h1>
      <p>Examination Record · ID: EX-${String(row.id).padStart(4, '0')}</p>
      <section>
        <h2>Examination Details</h2>
        <table>
          ${tableRow('Client', row.company_name)}
          ${tableRow('Examination Type', examLabels[row.exam_type])}
          ${tableRow('Payment Frequency', frequencyLabels[row.frequency])}
          ${tableRow('Date Performed', date)}
          <tr><th>Attachment</th><td><a href="${escapeHtml(attachmentUrl)}">${escapeHtml(row.attachment_path.split('/').pop() || row.attachment_path)}</a></td></tr>
        </table>
      </section>
    `
    if (!openPrintDocument(`Examination - ${row.company_name}`, content, user?.name || 'Admin')) {
      showToast('Ruhusu pop-ups ili kuchapisha examination', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-600">{t('Client records')}</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">{t('Examinations')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('Record examination type, payment frequency, date and attachment.')}</p>
        </div>
        <button
          onClick={openCreate}
          disabled={!clients.length}
          className="inline-flex items-center justify-center gap-2 rounded-sm bg-cyan-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {t('Add Examination')}
        </button>
      </div>

      <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{filteredRows.length} {t('records')}</p>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={t('Search clients or examinations...')}
            className="w-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm sm:max-w-xs"
          />
        </div>

        {error && !modalOpen && <p className="mb-4 rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-y border-slate-100 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-3 py-3">{t('Client')}</th>
                <th className="px-3 py-3">{t('Examination type')}</th>
                <th className="px-3 py-3">{t('Payment frequency')}</th>
                <th className="px-3 py-3">{t('Date performed')}</th>
                <th className="px-3 py-3">{t('Attachment')}</th>
                <th className="px-3 py-3 text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => (
                <tr key={row.id} className="border-b border-slate-100 text-slate-700">
                  <td className="px-3 py-3 font-semibold">{row.company_name}</td>
                  <td className="px-3 py-3">{t(examLabels[row.exam_type])}</td>
                  <td className="px-3 py-3">{t(frequencyLabels[row.frequency])}</td>
                  <td className="px-3 py-3">{new Date(`${row.exam_date.slice(0, 10)}T00:00:00`).toLocaleDateString()}</td>
                  <td className="px-3 py-3">
                    <a className="inline-flex items-center gap-1 text-cyan-700 hover:text-cyan-900" href={fileUrl(row.attachment_path)} target="_blank" rel="noreferrer">
                      <span className="material-symbols-outlined text-lg">attach_file</span>
                      {t('Open attachment')}
                    </a>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setViewing(row)} className="rounded-sm p-1.5 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700" aria-label="View examination" title="View">
                        <span className="material-symbols-outlined text-lg">visibility</span>
                      </button>
                      <button onClick={() => printExamination(row)} className="rounded-sm p-1.5 text-slate-500 hover:bg-cyan-50 hover:text-cyan-700" aria-label="Print examination" title="Print">
                        <span className="material-symbols-outlined text-lg">print</span>
                      </button>
                      <button onClick={() => openEdit(row)} className="rounded-sm p-1.5 text-slate-500 hover:bg-slate-100 hover:text-cyan-700" aria-label="Hariri">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button onClick={() => void remove(row)} className="rounded-sm p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Futa">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredRows.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-12 text-center text-sm text-slate-400">
                    {rows.length ? t('No search results found.') : t('No examinations have been recorded yet.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={t('Examination Details')}>
        {viewing && (
          <div className="space-y-4">
            <div className="rounded-sm border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Examination Record</p>
              <h3 className="mt-1 text-lg font-bold text-slate-800">{viewing.company_name}</h3>
              <p className="text-xs font-mono text-slate-500">ID: EX-{String(viewing.id).padStart(4, '0')}</p>
            </div>
            <div className="divide-y divide-slate-100 rounded-sm border border-slate-100 px-3">
              {[
                [t('Examination type'), t(examLabels[viewing.exam_type])],
                [t('Payment frequency'), t(frequencyLabels[viewing.frequency])],
                [t('Date performed'), new Date(`${viewing.exam_date.slice(0, 10)}T00:00:00`).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-right font-semibold text-slate-800">{value}</span>
                </div>
              ))}
              <div className="flex justify-between gap-4 py-3 text-sm">
                <span className="text-slate-500">{t('Attachment')}</span>
                <a className="text-right font-semibold text-cyan-700 underline" href={fileUrl(viewing.attachment_path)} target="_blank" rel="noreferrer">
                  {viewing.attachment_path.split('/').pop() || t('Open attachment')}
                </a>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button onClick={() => printExamination(viewing)} className="inline-flex items-center gap-2 bg-cyan-600 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-cyan-700">
                <span className="material-symbols-outlined text-base">print</span>
                {t('Print')}
              </button>
              <button onClick={() => setViewing(null)} className="border border-slate-200 px-4 py-2 text-xs font-bold uppercase text-slate-600">
                {t('Close')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={modalOpen} onClose={() => !busy && setModalOpen(false)} title={editing ? t('Edit Examination') : t('Record Examination')}>
        <div className="space-y-4">
          {error && <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('Client')}</span>
            <select
              required
              value={form.client_id}
              onChange={event => setForm({ ...form, client_id: Number(event.target.value) })}
              className="w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            >
              <option value={0} disabled>{t('Select a client')}</option>
              {clients.map(client => <option key={client.id} value={client.id}>{client.company_name}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('Examination type')}</span>
            <select
              value={form.exam_type}
              onChange={event => setForm({ ...form, exam_type: event.target.value as ExamType })}
              className="w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            >
              <option value="principal">Principal</option>
              <option value="penalties">Penalties</option>
              <option value="interest">Interest</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('Payment frequency')}</span>
            <select
              value={form.frequency}
              onChange={event => setForm({ ...form, frequency: event.target.value as Frequency })}
              className="w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            >
              <option value="monthly">Monthly</option>
              <option value="annual">{t('Annual')}</option>
              <option value="quarterly">Quarterly</option>
              <option value="one_off">One-off</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('Date examination was performed')}</span>
            <input
              required
              type="date"
              value={form.exam_date}
              onChange={event => setForm({ ...form, exam_date: event.target.value })}
              className="w-full border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t('Attachment')} {editing ? t('(optional, replace if needed)') : t('(required)')}
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              required={!editing}
              onChange={event => setForm({ ...form, attachment: event.target.files?.[0] || null })}
              className="w-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-slate-200 file:px-3 file:py-1.5"
            />
            <span className="mt-1 block text-xs text-slate-400">{t('PDF, image or Word document; 10MB maximum.')}</span>
            {editing && <a className="mt-2 inline-block text-xs text-cyan-700 underline" href={fileUrl(editing.attachment_path)} target="_blank" rel="noreferrer">{t('Open current attachment')}</a>}
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button disabled={busy} onClick={() => setModalOpen(false)} className="border border-slate-200 px-4 py-2 text-xs font-bold uppercase text-slate-600 disabled:opacity-50">{t('Cancel')}</button>
            <button disabled={busy || !clients.length} onClick={() => void save()} className="bg-cyan-600 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-cyan-700 disabled:opacity-50">
              {busy ? t('Saving...') : editing ? t('Save changes') : t('Save examination')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
