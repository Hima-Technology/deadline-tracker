import { useEffect, useState } from 'react'
import api, { errMsg } from '../api/client'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import ClientPrivilegeActions from '../components/ClientPrivilegeActions'
import { AUTHORITIES, type Authority, type Client, type Closing, type Frequency } from '../types'
import { useLanguage } from '../context/LanguageContext'

type PrivilegeClient = { client_id: number; company_name?: string; permissions: string[] }

function normalizePermissions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((permission): permission is string => typeof permission === 'string')
  }
  if (typeof value !== 'string') return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((permission): permission is string => typeof permission === 'string')
      : []
  } catch {
    return []
  }
}

export default function MyClosings() {
  const { t } = useLanguage()
  const [rows, setRows] = useState<Closing[]>([])
  const [clientPermissions, setClientPermissions] = useState<Record<number, string[]>>({})
  const [permissionsError, setPermissionsError] = useState('')
  const [target, setTarget] = useState<Closing | null>(null)
  const [ref, setRef] = useState('')
  const [completionNotes, setCompletionNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [authorities, setAuthorities] = useState<Authority[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [globalPermissions, setGlobalPermissions] = useState<string[]>([])
  const [privilegeClients, setPrivilegeClients] = useState<PrivilegeClient[]>([])
  const [addClientOpen, setAddClientOpen] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [addClientError, setAddClientError] = useState('')
  const [addClientBusy, setAddClientBusy] = useState(false)
  const [assignmentTarget, setAssignmentTarget] = useState<Pick<Closing, 'client_id' | 'company_name' | 'obligation_title' | 'due_date' | 'authority' | 'document_type' | 'instructions'> | null>(null)
  const [assignmentOpen, setAssignmentOpen] = useState(false)
  const [assignmentStaff, setAssignmentStaff] = useState<{ id: number; name: string }[]>([])
  const [assignmentClients, setAssignmentClients] = useState<Client[]>([])
  const [globalAssignTasks, setGlobalAssignTasks] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({
    client_id: 0,
    title: '',
    frequency: 'monthly' as Frequency,
    due_date: '',
    staff_id: 0,
    authority: '',
    document_type: '',
    requires_upload: true,
    instructions: '',
  })
  const [assignmentError, setAssignmentError] = useState('')
  const [assignmentBusy, setAssignmentBusy] = useState(false)

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'loading' as 'loading' | 'success' | 'error' })
  function showToast(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
    setToast({ show: true, message, type })
    if (type !== 'loading') {
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000)
    }
  }

  async function load() {
    setError('')
    setPermissionsError('')
    let assignedPrivileges: { client_id?: number | null; permissions?: unknown }[] = []
    try {
      const privilegeResponse = await api.get('/privileges/mine')
      assignedPrivileges = privilegeResponse.data.data || []
      setPrivilegeClients(assignedPrivileges.flatMap(privilege => {
        const clientId = Number(privilege.client_id || 0)
        const permissions = normalizePermissions(privilege.permissions)
        return clientId && permissions.length
          ? [{ client_id: clientId, company_name: (privilege as { company_name?: string }).company_name, permissions }]
          : []
      }))
      const hasGlobalTaskAssignment = assignedPrivileges.some(privilege =>
        !privilege.client_id
        && (Array.isArray(privilege.permissions)
          ? privilege.permissions.includes('assign_tasks')
          : typeof privilege.permissions === 'string' && privilege.permissions.includes('assign_tasks'))
      )
      setGlobalAssignTasks(hasGlobalTaskAssignment)
      const allPermissions = assignedPrivileges.flatMap(privilege => normalizePermissions(privilege.permissions))
      setGlobalPermissions([...new Set(allPermissions)])
      const globalClientPermissions = assignedPrivileges
        .filter(privilege => !privilege.client_id)
        .flatMap(privilege => normalizePermissions(privilege.permissions))
      const needsClientActions = globalClientPermissions.some(permission => permission !== 'add_clients')
      if (hasGlobalTaskAssignment || needsClientActions) {
        try {
          const clientsResponse = await api.get('/clients')
          const clients: Client[] = clientsResponse.data.data || []
          setAssignmentClients(hasGlobalTaskAssignment ? clients : [])
          if (needsClientActions) {
            const permissionResponses = await Promise.all(
              clients.map(client => api.get(`/clients/${client.id}/my-permissions`))
            )
            const globalClientGrants: PrivilegeClient[] = permissionResponses.flatMap((response, index) => {
              const permissions = normalizePermissions(response.data.data)
              return permissions.length
                ? [{ client_id: clients[index].id, company_name: clients[index].company_name, permissions }]
                : []
            })
            setPrivilegeClients(current => {
              const combined = new Map<number, PrivilegeClient>()
              current.forEach(client => combined.set(client.client_id, client))
              globalClientGrants.forEach(client => {
                const existing = combined.get(client.client_id)
                combined.set(client.client_id, existing
                  ? { ...existing, permissions: [...new Set([...existing.permissions, ...client.permissions])] }
                  : client)
              })
              return [...combined.values()]
            })
          }
        } catch (e) {
          setAssignmentClients([])
          setPermissionsError(errMsg(e))
        }
      } else {
        setAssignmentClients([])
      }
    } catch (e) {
      setGlobalPermissions([])
      setPrivilegeClients([])
      setPermissionsError(errMsg(e))
    }
    let closings: Closing[]
    try {
      const closingResponse = await api.get('/closings/mine')
      closings = closingResponse.data.data || []
      setRows(closings)
    } catch (e) {
      setError(errMsg(e))
      return
    }
    try {
      const clientIds = [...new Set(closings.map(closing => Number(closing.client_id)))]
      const responses = await Promise.all(clientIds.map(clientId => api.get(`/clients/${clientId}/my-permissions`)))
      const permissions = Object.fromEntries(responses.map((response, index) => {
        const values: unknown = response.data.data
        if (!Array.isArray(values) || !values.every(value => typeof value === 'string')) {
          throw new Error(t('Could not load permissions for an assigned client.'))
        }
        return [clientIds[index], values]
      }))
      setClientPermissions(permissions)
    } catch (e) {
      setClientPermissions({})
      setPermissionsError(errMsg(e))
    }
  }
  useEffect(() => { load() }, [])

  function permissionsForClient(clientId: number): string[] {
    return clientPermissions[clientId] || []
  }

  async function addClient() {
    if (!newClientName.trim()) {
      setAddClientError(t('Company name is required.'))
      return
    }
    setAddClientBusy(true)
    setAddClientError('')
    try {
      await api.post('/clients', { company_name: newClientName.trim() })
      setNewClientName('')
      setAddClientOpen(false)
      showToast(t('Client added successfully.'), 'success')
    } catch (e) {
      setAddClientError(errMsg(e))
    } finally {
      setAddClientBusy(false)
    }
  }

  async function loadAssignmentStaff(clientId: number) {
    try {
      const response = await api.get(`/obligations/client/${clientId}/staff`)
      const staffOptions = response.data.data || []
      setAssignmentStaff(staffOptions)
      setAssignmentForm(form => ({ ...form, client_id: clientId, staff_id: staffOptions[0]?.id || 0 }))
      setAssignmentError('')
    } catch (e) {
      setAssignmentStaff([])
      setAssignmentError(errMsg(e))
    }
  }

  async function openAssignment(closing: Closing) {
    setAssignmentError('')
    setAssignmentTarget(closing)
    setAssignmentOpen(true)
    setAssignmentForm({
      client_id: closing.client_id,
      title: closing.obligation_title || '',
      frequency: 'monthly',
      due_date: closing.due_date?.slice(0, 10) || '',
      staff_id: 0,
      authority: closing.authority || '',
      document_type: closing.document_type || '',
      requires_upload: true,
      instructions: closing.instructions || '',
    })
    await loadAssignmentStaff(closing.client_id)
  }

  async function openPrivilegeAssignment(client: PrivilegeClient) {
    setAssignmentError('')
    setAssignmentTarget({
      client_id: client.client_id,
      company_name: client.company_name,
      obligation_title: '',
      due_date: '',
      authority: '',
      document_type: '',
      instructions: '',
    })
    setAssignmentOpen(true)
    setAssignmentForm({
      client_id: client.client_id,
      title: '',
      frequency: 'monthly',
      due_date: '',
      staff_id: 0,
      authority: '',
      document_type: '',
      requires_upload: true,
      instructions: '',
    })
    await loadAssignmentStaff(client.client_id)
  }

  async function assignTask() {
    if (!assignmentForm.client_id || !assignmentForm.title.trim() || !assignmentForm.authority || !assignmentForm.document_type.trim()
      || !assignmentForm.due_date || !assignmentForm.staff_id) {
      setAssignmentError(t('Complete all required task fields.'))
      return
    }
    setAssignmentBusy(true)
    setAssignmentError('')
    try {
      await api.post('/obligations', {
        client_id: assignmentForm.client_id,
        title: assignmentForm.title.trim(),
        frequency: assignmentForm.frequency,
        due_day: Number(assignmentForm.due_date.slice(8, 10)),
        default_staff_id: assignmentForm.staff_id,
        authority: assignmentForm.authority,
        document_type: assignmentForm.document_type.trim(),
        confirmed_due_date: assignmentForm.due_date,
        reminder_days: [7, 3, 1, 0],
        requires_upload: assignmentForm.requires_upload,
        instructions: assignmentForm.instructions,
        is_active: true,
      })
      setAssignmentTarget(null)
      setAssignmentOpen(false)
      showToast(t('Task assigned successfully.'), 'success')
      await load()
    } catch (e) {
      setAssignmentError(errMsg(e))
    } finally {
      setAssignmentBusy(false)
    }
  }

  async function markClosed() {
    if (!target) return
    const requiredAuthorityCount = target.authority === 'ALL' ? AUTHORITIES.length : target.authority === 'TWO' ? 2 : 1
    if (!ref.trim() || authorities.length !== requiredAuthorityCount || (target.requires_upload && !file)) {
      setError(t('Complete all required fields before closing this task.'))
      return
    }
    setBusy(true); setError('')
    showToast('MARKING AS CLOSED...', 'loading')
    
    try {
      const fd = new FormData()
      fd.append('reference_number', ref.trim())
      fd.append('completion_notes', completionNotes.trim())
      fd.append('authorities', JSON.stringify(authorities))
      if (file) fd.append('proof', file)
      await api.post(`/closings/${target.id}/close`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      showToast('TASK CLOSED SUCCESSFULLY', 'success')
      setTarget(null); setRef(''); setCompletionNotes(''); setFile(null); setAuthorities([]); load()
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
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk] uppercase">{t('My Work')}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
        {globalPermissions.includes('add_clients') && (
          <button
            type="button"
            onClick={() => { setAddClientOpen(true); setAddClientError('') }}
            className="inline-flex w-fit items-center gap-2 rounded bg-cyan-600 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-cyan-700"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            {t('Add Client')}
          </button>
        )}
        {globalAssignTasks && (
          <button
            type="button"
            onClick={() => {
              setAssignmentTarget(null)
              setAssignmentOpen(true)
              setAssignmentError('')
              setAssignmentForm({ client_id: 0, title: '', frequency: 'monthly', due_date: '', staff_id: 0, authority: '', document_type: '', requires_upload: true, instructions: '' })
              setAssignmentStaff([])
            }}
            className="inline-flex w-fit items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-indigo-700"
          >
            <span className="material-symbols-outlined text-base">assignment_add</span>
            {t('Assign task to staff')}
          </button>
        )}
        </div>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 border border-red-200 rounded text-sm font-mono">{error}</div>}
      {permissionsError && <div role="alert" className="text-amber-800 bg-amber-50 p-3 border border-amber-200 rounded text-sm">{permissionsError}</div>}

      <div className="space-y-3">
        {rows.map((c) => {
          const permissions = permissionsForClient(c.client_id)
          return (
          <div key={c.id} className="bg-white p-4 shadow-sm border border-gray-200 rounded-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{c.obligation_title}</h3>
                <p className="text-sm text-slate-500 font-medium">{c.company_name}</p>
              </div>

              {(() => {
                const taskClientIds = new Set(rows.map(row => Number(row.client_id)))
                const actionClients = new Map<number, PrivilegeClient>()
                privilegeClients.forEach(client => {
                  if (taskClientIds.has(client.client_id)) return
                  const current = actionClients.get(client.client_id)
                  actionClients.set(client.client_id, current
                    ? { ...current, permissions: [...new Set([...current.permissions, ...client.permissions])] }
                    : client)
                })
                if (!actionClients.size) return null
                return (
                  <section className="space-y-3 border-t border-slate-200 pt-5">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">{t('Client actions')}</h3>
                      <p className="mt-1 text-xs text-slate-500">{t('Actions available for clients assigned to you.')}</p>
                    </div>
                    {[...actionClients.values()].map(client => (
                      <article key={client.client_id} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
                        <h4 className="mb-3 font-semibold text-slate-800">{client.company_name || `Client #${client.client_id}`}</h4>
                        <ClientPrivilegeActions
                          clientId={client.client_id}
                          companyName={client.company_name}
                          permissions={client.permissions}
                          onClientDeleted={clientId => setPrivilegeClients(current => current.filter(item => item.client_id !== clientId))}
                        />
                        {client.permissions.includes('assign_tasks') && (
                          <button
                            type="button"
                            onClick={() => void openPrivilegeAssignment(client)}
                            className="mt-3 inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
                          >
                            <span className="material-symbols-outlined text-base">assignment_add</span>
                            {t('Assign task to staff')}
                          </button>
                        )}
                      </article>
                    ))}
                  </section>
                )
              })()}
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

            <div className="mb-3">
              <ClientPrivilegeActions
                clientId={c.client_id}
                companyName={c.company_name}
                permissions={permissions}
                onClientDeleted={clientId => {
                  setRows(current => current.filter(row => row.client_id !== clientId))
                  setPrivilegeClients(current => current.filter(client => client.client_id !== clientId))
                }}
              />
            </div>

            {permissions.includes('assign_tasks') && (
              <button
                type="button"
                onClick={() => void openAssignment(c)}
                className="mb-3 inline-flex items-center gap-1 rounded border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
              >
                <span className="material-symbols-outlined text-base">assignment_add</span>
                {t('Assign task to staff')}
              </button>
            )}

            {c.status !== 'closed' && (
              <button 
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(6,182,212,0.3)] active:scale-[0.99]" 
                onClick={() => {
                  setTarget(c)
                  setRef('')
                  setCompletionNotes('')
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
                {permissions.includes('annual_tra') && c.authority === 'TRA' && /annual|yearly/i.test(`${c.obligation_title} ${c.document_type || ''}`)
                  ? t('TRA Annual Return')
                  : permissions.includes('annual_zra') && c.authority === 'ZRA' && /annual|yearly/i.test(`${c.obligation_title} ${c.document_type || ''}`)
                    ? t('ZRA Annual Return')
                    : t('Mark Task as Closed')}
              </button>
            )}
            
            {c.status === 'closed' && (
              <div className="space-y-2 rounded-sm border border-green-100 bg-green-50 p-3 text-sm text-green-700">
                <div className="flex flex-wrap items-center justify-between gap-2 font-medium">
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
                    {t('Closed Successfully')}
                  </span>
                  {c.reference_number && <span className="text-xs font-mono">{t('Reference')}: {c.reference_number}</span>}
                </div>
                {c.completion_notes && <p className="text-xs leading-relaxed">{c.completion_notes}</p>}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {c.authorities && c.authorities.length > 0 && <span className="text-xs font-mono">{c.authorities.join(', ')}</span>}
                  {c.proof_file_path && (
                    <a
                      href={`http://localhost:8000/api/files${c.proof_file_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-xs font-bold uppercase"
                    >
                      {t('View Proof')}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          )
        })}
        {rows.length === 0 && (
          <div className="bg-white p-10 border border-gray-200 shadow-sm text-center text-gray-400 font-mono text-xs uppercase rounded-sm">
            No tasks assigned to you at the moment
          </div>
        )}
      </div>

      {/* MODAL YA KUFUNGA KAZI */}
      <Modal open={!!target} onClose={() => setTarget(null)} title={t('Complete Task')}>
        <div className="space-y-4">
          {error && <div className="text-xs text-red-600 bg-red-50 p-2 border border-red-100 rounded font-mono">{error}</div>}
          
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
            <p>{t('Client')}: <strong>{target?.company_name}</strong> · {t('Period')}: <strong>{target?.period_label}</strong></p>
            <p className="mt-1">{t('Task')}: <strong>{target?.obligation_title}</strong> · {t('Authority')}: <strong>{target?.authority || '—'}</strong></p>
            {target?.document_type && <p className="mt-1">{t('Document / Return Type')}: <strong>{target.document_type}</strong></p>}
            {target?.instructions && <p className="mt-2 border-t border-blue-200 pt-2">{t('Instructions')}: {target.instructions}</p>}
          </div>

          <fieldset>
            <legend className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">{t('Institutions involved')} *</legend>
            {target?.authority === 'ALL' ? (
              <div className="flex flex-wrap gap-2">
                {AUTHORITIES.map(({ value, label }) => <span key={value} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">{label}</span>)}
              </div>
            ) : target?.authority && target.authority !== 'TWO' && AUTHORITIES.some(({ value }) => value === target.authority) ? (
              <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">{target.authority}</span>
            ) : (
              <>
                <p className="mb-2 text-[11px] text-slate-500">
                  {target?.authority === 'TWO' ? t('Select exactly two institutions.') : t('Select at least one institution.')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {AUTHORITIES.map(({ value, label }) => (
                    <label key={value} className={`cursor-pointer rounded-sm border px-3 py-2 text-xs font-bold ${
                      authorities.includes(value) ? 'border-cyan-400 bg-cyan-50 text-cyan-700' : 'border-gray-200 bg-white text-gray-600'
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
                </div>
              </>
            )}
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">{t('Completion notes')} ({t('Optional')})</label>
            <textarea
              rows={3}
              className="w-full rounded-sm border border-gray-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              value={completionNotes}
              onChange={event => setCompletionNotes(event.target.value)}
              placeholder={t('Describe the work completed and its outcome.')}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
              {t('Proof (PDF / Image)')} {target?.requires_upload ? '*' : `(${t('Optional')})`}
            </label>
            <input 
              className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm file:mr-4 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" 
              type="file" 
              accept="application/pdf,image/*"
              required={Boolean(target?.requires_upload)}
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />
            {target?.requires_upload && <p className="mt-1 text-[11px] text-slate-500">{t('This task requires evidence before it can be closed.')}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
            <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 transition-colors rounded-sm" onClick={() => setTarget(null)}>
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 transition-colors shadow-sm rounded-sm flex items-center gap-2 disabled:opacity-50" 
              onClick={markClosed} 
              disabled={busy || !ref.trim() || authorities.length !== (target?.authority === 'ALL' ? AUTHORITIES.length : target?.authority === 'TWO' ? 2 : 1) || Boolean(target?.requires_upload && !file)}
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

      <Modal open={addClientOpen} onClose={() => setAddClientOpen(false)} title={t('Add Client')}>
        <div className="space-y-4">
          {addClientError && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{addClientError}</p>}
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
            {t('Company Name')}
            <input
              autoFocus
              value={newClientName}
              onChange={event => setNewClientName(event.target.value)}
              className="mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800"
            />
          </label>
          <div className="flex justify-end">
            <button type="button" onClick={() => void addClient()} disabled={addClientBusy} className="rounded bg-cyan-600 px-4 py-2 text-xs font-bold uppercase text-white disabled:opacity-50">
              {addClientBusy ? t('Saving...') : t('Add Client')}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={assignmentOpen} onClose={() => { setAssignmentOpen(false); setAssignmentTarget(null) }} title={t('Assign task to staff')}>
        <div className="space-y-3">
          {assignmentError && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{assignmentError}</p>}
          <p className="text-sm font-semibold text-slate-700">{assignmentTarget?.company_name}</p>
          {globalAssignTasks && (
            <label className="block text-xs font-bold uppercase text-slate-500">
              {t('Choose a client')}
              <select
                value={assignmentForm.client_id}
                onChange={event => {
                  const clientId = Number(event.target.value)
                  const client = assignmentClients.find(item => item.id === clientId)
                  setAssignmentTarget(client ? {
                    client_id: client.id,
                    company_name: client.company_name,
                    obligation_title: '',
                    due_date: '',
                    authority: '',
                    document_type: '',
                    instructions: '',
                  } : null)
                  setAssignmentForm(form => ({ ...form, client_id: clientId, staff_id: 0 }))
                  if (clientId) void loadAssignmentStaff(clientId)
                }}
                className="mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800"
              >
                <option value={0}>{t('Choose a client')}</option>
                {assignmentClients.map(client => <option key={client.id} value={client.id}>{client.company_name}</option>)}
              </select>
            </label>
          )}
          <label className="block text-xs font-bold uppercase text-slate-500">
            {t('Title / Task Name')}
            <input value={assignmentForm.title} onChange={event => setAssignmentForm({ ...assignmentForm, title: event.target.value })} className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold uppercase text-slate-500">
              {t('Assigned Staff')}
              <select value={assignmentForm.staff_id} onChange={event => setAssignmentForm({ ...assignmentForm, staff_id: Number(event.target.value) })} className="mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800">
                <option value={0}>{t('Select staff')}</option>
                {assignmentStaff.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase text-slate-500">
              {t('Authority')}
              <select value={assignmentForm.authority} onChange={event => setAssignmentForm({ ...assignmentForm, authority: event.target.value })} className="mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800">
                <option value="">{t('Select authority')}</option>
                {['TRA', 'ZRA', 'BPRA', 'ZSSF', 'ALL', 'TWO'].map(authority => <option key={authority} value={authority}>{authority}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase text-slate-500">
              {t('Document / Return Type')}
              <input value={assignmentForm.document_type} onChange={event => setAssignmentForm({ ...assignmentForm, document_type: event.target.value })} className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800" />
            </label>
            <label className="block text-xs font-bold uppercase text-slate-500">
              {t('Frequency')}
              <select value={assignmentForm.frequency} onChange={event => setAssignmentForm({ ...assignmentForm, frequency: event.target.value as Frequency })} className="mt-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800">
                {(['monthly', 'quarterly', 'annual', 'one_off'] as Frequency[]).map(frequency => <option key={frequency} value={frequency}>{t(frequency === 'one_off' ? 'One-off' : frequency.charAt(0).toUpperCase() + frequency.slice(1))}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase text-slate-500">
              {t('Confirmed Due Date')}
              <input type="date" value={assignmentForm.due_date} onChange={event => setAssignmentForm({ ...assignmentForm, due_date: event.target.value })} className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800" />
            </label>
          </div>
          <label className="block text-xs font-bold uppercase text-slate-500">
            {t('Task instructions')}
            <textarea rows={3} value={assignmentForm.instructions} onChange={event => setAssignmentForm({ ...assignmentForm, instructions: event.target.value })} className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={assignmentForm.requires_upload} onChange={event => setAssignmentForm({ ...assignmentForm, requires_upload: event.target.checked })} />
            {t('Proof attachment required')}
          </label>
          <div className="flex justify-end">
            <button type="button" onClick={() => void assignTask()} disabled={assignmentBusy} className="rounded bg-indigo-600 px-4 py-2 text-xs font-bold uppercase text-white disabled:opacity-50">
              {assignmentBusy ? t('Saving...') : t('Assign task')}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}