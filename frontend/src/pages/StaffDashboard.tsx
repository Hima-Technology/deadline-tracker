import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errMsg } from '../api/client'
import Badge from '../components/Badge'
import CalendarView from '../components/CalendarView'
import ClientPrivilegeActions from '../components/ClientPrivilegeActions'
import type { Closing, Status } from '../types'
import { useLanguage } from '../context/LanguageContext'

interface StaffCounters {
  overdue: number
  due_soon: number
  closed: number
  open: number
}

const emptyCounters: StaffCounters = { overdue: 0, due_soon: 0, closed: 0, open: 0 }

export default function StaffDashboard() {
  const nav = useNavigate()
  const { language, t } = useLanguage()
  const [counters, setCounters] = useState<StaffCounters>(emptyCounters)
  const [closings, setClosings] = useState<Closing[]>([])
  const [clientPermissions, setClientPermissions] = useState<Record<number, string[]>>({})
  const [permissionsError, setPermissionsError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [dashboardResponse, closingsResponse] = await Promise.all([
        api.get('/dashboard/staff'),
        api.get('/closings/mine'),
      ])
      setCounters({ ...emptyCounters, ...dashboardResponse.data.data.counters })
      const assignedClosings: Closing[] = closingsResponse.data.data || []
      setClosings(assignedClosings)
      setPermissionsError('')
      try {
        const clientIds = [...new Set(assignedClosings
          .filter(closing => closing.status !== 'closed')
          .sort((a, b) => a.due_date.localeCompare(b.due_date))
          .slice(0, 5)
          .map(closing => Number(closing.client_id)))]
        const permissionResponses = await Promise.all(
          clientIds.map(clientId => api.get(`/clients/${clientId}/my-permissions`))
        )
        const permissions = Object.fromEntries(permissionResponses.map((response, index) => {
          const values: unknown = response.data.data
          if (!Array.isArray(values) || !values.every(value => typeof value === 'string')) {
            throw new Error(t('Could not load permissions for an assigned client.'))
          }
          return [clientIds[index], values]
        }))
        setClientPermissions(permissions)
      } catch (permissionError) {
        setClientPermissions({})
        setPermissionsError(errMsg(permissionError))
      }
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined animate-spin text-3xl text-cyan-600">progress_activity</span>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t('Loading dashboard…')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
        <span className="material-symbols-outlined text-3xl text-rose-600">error</span>
        <p className="mt-2 text-sm text-rose-700">{error}</p>
        <button onClick={() => void load()} className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
          {t('Retry')}
        </button>
      </div>
    )
  }

  const locale = language === 'sw' ? 'sw-TZ' : 'en-GB'
  const today = new Date()
  const openClosings = closings.filter(closing => closing.status !== 'closed')
  const nextTasks = [...openClosings]
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 5)
  const cards: { label: string; value: number; icon: string; style: string }[] = [
    { label: 'Open tasks', value: counters.open, icon: 'pending_actions', style: 'bg-cyan-50 text-cyan-700' },
    { label: 'Due soon', value: counters.due_soon, icon: 'schedule', style: 'bg-amber-50 text-amber-700' },
    { label: 'Overdue', value: counters.overdue, icon: 'warning', style: 'bg-rose-50 text-rose-700' },
    { label: 'Closed', value: counters.closed, icon: 'task_alt', style: 'bg-emerald-50 text-emerald-700' },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {permissionsError && (
        <div role="alert" className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {permissionsError}
        </div>
      )}
      <section className="staff-dashboard-welcome rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t('Staff workspace')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t('My Dashboard')}</h1>
            <p className="mt-1 text-sm text-slate-600">{t('Your assigned work and deadlines in one place.')}</p>
          </div>
          <button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-cyan-200 hover:bg-cyan-50">
            <span className="material-symbols-outlined text-lg">refresh</span>
            {t('Refresh')}
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-cyan-100 pt-5 sm:grid-cols-4">
          {cards.map(card => (
            <div key={card.label} className="flex items-center gap-3 rounded-xl bg-white/75 p-3">
              <span className={`material-symbols-outlined rounded-lg p-2 ${card.style}`}>{card.icon}</span>
              <div>
                <p className="text-xl font-bold tabular-nums text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500">{t(card.label)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-12">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-700">calendar_month</span>
              <h2 className="font-bold text-slate-900">{t('My deadline calendar')}</h2>
            </div>
            <button onClick={() => nav('/my-closings')} className="text-xs font-bold text-cyan-700 hover:text-cyan-900">
              {t('View all tasks')}
            </button>
          </div>
          <div className="overflow-x-auto p-3 sm:p-5">
            <CalendarView closings={closings} />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-4">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">event_upcoming</span>
              <h2 className="font-bold text-slate-900">{t('Upcoming tasks')}</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{openClosings.length}</span>
          </div>
          <div className="space-y-3 p-4">
            {nextTasks.length ? nextTasks.map(task => {
              const isPast = task.due_date < today.toISOString().slice(0, 10)
              return (
                <article key={task.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{task.obligation_title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{task.company_name}</p>
                    </div>
                    <Badge status={task.status as Status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{task.period_label}</span>
                    <span className={isPast ? 'font-semibold text-rose-600' : 'font-medium'}>
                      {new Date(`${task.due_date}T00:00:00`).toLocaleDateString(locale)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <ClientPrivilegeActions
                      clientId={task.client_id}
                      companyName={task.company_name}
                      permissions={clientPermissions[task.client_id] || []}
                      onClientDeleted={clientId => setClosings(current => current.filter(closing => closing.client_id !== clientId))}
                    />
                  </div>
                </article>
              )
            }) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
                <span className="material-symbols-outlined text-3xl text-emerald-500">task_alt</span>
                <p className="mt-2 text-sm font-medium text-slate-600">{t('No upcoming tasks assigned.')}</p>
              </div>
            )}
            <button onClick={() => nav('/my-closings')} className="w-full rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-2.5 text-sm font-semibold text-cyan-800 hover:bg-cyan-100">
              {t('Open my tasks')}
            </button>
          </div>
        </section>
      </div>

    </div>
  )
}
