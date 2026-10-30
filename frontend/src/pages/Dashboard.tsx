import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errMsg } from '../api/client'
import type { Counters, StaffPerf, Client, Closing } from '../types'
import CalendarView from '../components/CalendarView'

export default function Dashboard() {
  const [counters, setCounters] = useState<Counters | null>(null)
  const [perf, setPerf] = useState<StaffPerf[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [recentClosings, setRecentClosings] = useState<Closing[]>([])
  const [allClosings, setAllClosings] = useState<Closing[]>([])
  const [error, setError] = useState('')
  const [time, setTime] = useState(new Date())
  const [loading, setLoading] = useState(true)

  const nav = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [dashRes, clientRes, closingRes] = await Promise.all([
        api.get('/dashboard/admin'),
        api.get('/clients'),
        api.get('/closings'),
      ])
      setCounters(dashRes.data.data.counters)
      setPerf(dashRes.data.data.staff_performance || [])
      setClients(clientRes.data.data || [])
      const all = (closingRes.data.data || []) as Closing[]
      setAllClosings(all)
      setRecentClosings(all.filter((c) => c.status === 'closed').slice(0, 6))
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-red-500 text-2xl">error</span>
        </div>
        <p className="text-red-600 text-sm font-mono">{error}</p>
        <button
          onClick={load}
          className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase rounded-sm hover:bg-slate-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (loading || !counters) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <span className="material-symbols-outlined text-cyan-500 text-3xl animate-spin">progress_activity</span>
        <p className="text-cyan-700 text-xs font-mono uppercase tracking-wider">Loading dashboard…</p>
      </div>
    )
  }

  const clockStr = time.toLocaleTimeString('en-GB', { hour12: false })
  const dateStr = time.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const totalClients = clients.length
  const pendingPayments = clients.filter((c) => {
    const total = Number(c.total_contract_amount) || 0
    const paid = Number(c.amount_paid) || 0
    return total - paid > 0
  }).length
  const expiringContracts = clients.filter((c) => {
    if (!c.contract_end_date) return false
    const end = new Date(c.contract_end_date)
    const today = new Date()
    const limit = new Date()
    limit.setMonth(today.getMonth() + 3)
    return end >= today && end <= limit
  }).length
  const completedTasks = Number(counters.closed_this_month) || 0
  const overdueTasks = Number(counters.overdue) || 0
  const openTasks = Number((counters as any).open) || 0
  const dueSoon = Number((counters as any).due_soon) || 0

  const kpis = [
    {
      label: 'Registered clients',
      value: totalClients,
      icon: 'corporate_fare',
      accent: 'from-cyan-500 to-cyan-400',
      ring: 'ring-cyan-100',
      iconBg: 'bg-cyan-50 text-cyan-600',
      valueColor: 'text-slate-900',
    },
    {
      label: 'Pending payments',
      value: pendingPayments,
      icon: 'payments',
      accent: 'from-rose-500 to-rose-400',
      ring: 'ring-rose-100',
      iconBg: 'bg-rose-50 text-rose-600',
      valueColor: 'text-rose-600',
    },
    {
      label: 'Contracts expiring',
      value: expiringContracts,
      icon: 'event_upcoming',
      accent: 'from-amber-500 to-amber-400',
      ring: 'ring-amber-100',
      iconBg: 'bg-amber-50 text-amber-600',
      valueColor: 'text-amber-600',
      hint: 'Next 3 months',
    },
    {
      label: 'Closed this month',
      value: completedTasks,
      icon: 'task_alt',
      accent: 'from-emerald-500 to-emerald-400',
      ring: 'ring-emerald-100',
      iconBg: 'bg-emerald-50 text-emerald-600',
      valueColor: 'text-emerald-600',
    },
  ]

  return (
    <div className="space-y-6 pb-16">
      {/* Overdue banner */}
      {overdueTasks > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-rose-200 bg-gradient-to-r from-rose-50 to-white px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-rose-600 text-[20px]">priority_high</span>
            </div>
            <div>
              <p className="text-sm font-bold text-rose-800">Overdue work needs attention</p>
              <p className="text-xs text-rose-600 mt-0.5">
                {overdueTasks} task{overdueTasks !== 1 ? 's are' : ' is'} past the due date.
              </p>
            </div>
          </div>
          <button
            onClick={() => nav('/closings')}
            className="shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold uppercase tracking-wide rounded-md transition-colors"
          >
            Open closings
          </button>
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-100 text-[10px] font-bold uppercase tracking-wider text-cyan-700">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              Live
            </span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              {dateStr}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk]">
            Business overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Snapshot of clients, deadlines, and team performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">schedule</span>
            <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">{clockStr}</span>
            <span className="text-[10px] text-slate-400 font-mono">EAT</span>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50/50 rounded-lg text-xs font-bold uppercase text-slate-700 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-cyan-600">refresh</span>
            Refresh
          </button>
          <button
            onClick={() => nav('/clients')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg text-xs font-bold uppercase shadow-md shadow-cyan-500/25 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[16px]">domain_add</span>
            Add client
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`relative bg-white rounded-xl border border-slate-100 shadow-sm ring-1 ${k.ring} overflow-hidden`}
          >
            <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${k.accent}`} />
            <div className="p-4 pt-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-500 truncate">{k.label}</p>
                  {k.hint && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{k.hint}</p>
                  )}
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${k.iconBg}`}>
                  <span className="material-symbols-outlined text-[20px]">{k.icon}</span>
                </div>
              </div>
              <p className={`mt-3 text-3xl font-bold tracking-tight tabular-nums font-[Space_Grotesk] ${k.valueColor}`}>
                {k.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open', value: openTasks, color: 'text-slate-800', bg: 'bg-slate-50' },
          { label: 'Due soon', value: dueSoon, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Overdue', value: overdueTasks, color: 'text-rose-700', bg: 'bg-rose-50' },
        ].map((s) => (
          <div
            key={s.label}
            className={`${s.bg} rounded-lg border border-slate-100/80 px-4 py-3 text-center`}
          >
            <p className={`text-xl font-bold tabular-nums font-[Space_Grotesk] ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar + status */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-600 text-[20px]">calendar_month</span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-[Space_Grotesk]">
                Deadline calendar
              </h2>
            </div>
            <button
              onClick={() => nav('/closings')}
              className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700 uppercase tracking-wide"
            >
              All closings →
            </button>
          </div>
          <div className="p-3 sm:p-4 max-h-[360px] overflow-auto">
            <div className="min-h-[240px]">
              <CalendarView closings={allClosings || []} />
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-600 text-[20px]">monitoring</span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-[Space_Grotesk]">
                System status
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold">Healthy</span>
          </div>

          <div className="p-3 flex flex-col gap-2 flex-1 overflow-y-auto max-h-[360px]">
            <StatusRow
              icon="cloud_done"
              title="System online"
              detail="All services are running normally."
              time={clockStr}
            />
            <StatusRow
              icon="verified_user"
              title="You are signed in"
              detail="Your admin session is active and secure."
              time="Now"
            />
            <StatusRow
              icon="assignment"
              title="Task summary"
              detail={`${openTasks} open · ${dueSoon} due soon · ${overdueTasks} overdue.`}
              time={clockStr}
            />
            <StatusRow
              icon="apartment"
              title="Client summary"
              detail={`${totalClients} clients · ${pendingPayments} with outstanding balances.`}
              time={clockStr}
            />
          </div>

          <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Everything looks good
            </span>
            <span>{clockStr} EAT</span>
          </div>
        </div>
      </div>

      {/* Performance + recent */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-600 text-[20px]">groups</span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-[Space_Grotesk]">
                Staff performance
              </h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider font-mono text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2.5 font-semibold">Name</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Open</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Overdue</th>
                  <th className="px-3 py-2.5 font-semibold text-center text-emerald-600">On time</th>
                  <th className="px-3 py-2.5 font-semibold text-center text-amber-600">Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {perf.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 text-sm">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-600 tabular-nums">
                      {Number(p.open_count)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-rose-600 tabular-nums">
                      {Number(p.overdue_count)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-emerald-600 tabular-nums">
                      {Number(p.on_time)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-amber-600 tabular-nums">
                      {Number(p.late)}
                    </td>
                  </tr>
                ))}
                {perf.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-xs font-mono uppercase">
                      No performance data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:col-span-5 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-[Space_Grotesk]">
                Recently closed
              </h2>
            </div>
          </div>
          <div className="p-3 space-y-2 max-h-[320px] overflow-y-auto">
            {recentClosings.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs font-mono uppercase bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No completed tasks yet
              </div>
            ) : (
              recentClosings.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">{c.company_name}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.obligation_title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-slate-400">{c.period_label}</span>
                      {c.closed_at && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(c.closed_at).toLocaleDateString('en-GB')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusRow({
  icon,
  title,
  detail,
  time,
}: {
  icon: string
  title: string
  detail: string
  time: string
}) {
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/60">
      <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-cyan-600 text-[18px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-slate-800">{title}</p>
          <span className="text-[10px] font-mono text-slate-400 shrink-0">{time}</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{detail}</p>
      </div>
    </div>
  )
}