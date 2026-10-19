import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { errMsg } from '../api/client'
import type { Counters, StaffPerf, Client, Closing } from '../types'

export default function Dashboard() {
  const [counters, setCounters] = useState<Counters | null>(null)
  const [perf, setPerf] = useState<StaffPerf[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [recentClosings, setRecentClosings] = useState<Closing[]>([]) // <-- Tumeongeza hii
  const [error, setError] = useState('')
  const [time, setTime] = useState(new Date())
  
  const nav = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/admin'),
      api.get('/clients'),
      api.get('/closings') // <-- Tunavuta closings zote
    ])
      .then(([dashRes, clientRes, closingRes]) => {
        setCounters(dashRes.data.data.counters)
        setPerf(dashRes.data.data.staff_performance)
        setClients(clientRes.data.data)
        
        // Tunachuja zile zilizofungwa tu (status === 'closed') na tunachukua 5 za mwisho
        const allClosings = closingRes.data.data as Closing[]
        const closedOnly = allClosings.filter(c => c.status === 'closed')
        setRecentClosings(closedOnly.slice(0, 5))
      })
      .catch((e) => setError(errMsg(e)))
  }, [])

  if (error) return <div className="text-red-600 bg-red-50 p-4 border border-red-200 rounded">{error}</div>
  if (!counters) return <div className="text-cyan-600 animate-pulse p-4">Loading dashboard data...</div>

  const clockStr = time.toLocaleTimeString('en-US', { hour12: false })

  const totalClients = clients.length
  const pendingPayments = clients.filter(c => {
    const total = Number(c.total_contract_amount) || 0
    const paid = Number(c.amount_paid) || 0
    return (total - paid) > 0
  }).length
  const expiringContracts = clients.filter(c => {
    if (!c.contract_end_date) return false
    const end = new Date(c.contract_end_date)
    const today = new Date()
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(today.getMonth() + 3)
    return end >= today && end <= threeMonthsFromNow
  }).length
  const completedTasks = Number(counters.closed_this_month) || 0
  const overdueTasks = Number(counters.overdue) || 0

  return (
    <div className="flex flex-col w-full bg-[#faf8ff] min-h-screen pb-20 font-sans">
      
      {/* RED ALERT BANNER */}
      {overdueTasks > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-sm flex items-start gap-3 shadow-sm animate-pulse">
          <span className="material-symbols-outlined text-red-600 text-[24px]">warning</span>
          <div>
            <h3 className="text-red-700 font-bold uppercase tracking-wider text-sm mb-1">CRITICAL ALERT: URGENT ATTENTION REQUIRED</h3>
            <p className="text-red-600 text-xs">
              You have <strong>{overdueTasks} overdue tasks</strong> that require immediate action. Please check the Closings page.
            </p>
          </div>
          <button 
            onClick={() => nav('/closings')}
            className="ml-auto bg-red-600 text-white text-[10px] font-bold uppercase px-3 py-1.5 hover:bg-red-700 transition-colors"
          >
            View Tasks
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-cyan-100/50 text-cyan-800 text-[10px] uppercase tracking-widest font-bold border border-cyan-200">OFFICIAL DASHBOARD</span>
            <span className="text-gray-400 text-[10px]">//</span>
            <span className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">ZANZIBAR, TANZANIA</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase font-[Space_Grotesk]">
            Business Overview
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border border-gray-100">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-[10px] text-gray-500 uppercase font-mono">SYSTEM STATUS:</span>
            <span className="text-[10px] text-cyan-600 font-bold font-mono">CONNECTED</span>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-all text-xs font-bold uppercase text-slate-700">
            <span className="material-symbols-outlined text-[16px] text-cyan-500">sync</span>
            Refresh Data
          </button>
          
          <button 
            onClick={() => nav('/clients?new=true')}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-white shadow-md shadow-cyan-500/30 transition-all text-xs font-bold uppercase active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">domain_add</span>
            Add Client
          </button>
        </div>
      </div>

      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* KPI 1: Wateja Wote */}
        <div className="relative bg-white p-4 shadow-sm border border-gray-100 group overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono block">CLIENTS // TOTAL</span>
              <span className="text-sm font-bold text-slate-800 uppercase mt-1 block">Registered Clients</span>
            </div>
            <span className="p-2 bg-slate-50 text-cyan-500 rounded">
              <span className="material-symbols-outlined text-[20px]">corporate_fare</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-5xl font-bold text-slate-900 leading-none tracking-tight font-[Space_Grotesk]">{totalClients}</span>
          </div>
        </div>

        {/* KPI 2: Wanaodaiwa */}
        <div className="relative bg-white p-4 shadow-sm border border-gray-100 group overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-red-500 uppercase tracking-wider font-mono block">FINANCE // PENDING</span>
              <span className="text-sm font-bold text-slate-800 uppercase mt-1 block">Pending Payments</span>
            </div>
            <span className="p-2 bg-red-50 text-red-500 rounded">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-5xl font-bold text-red-500 leading-none tracking-tight font-[Space_Grotesk]">{pendingPayments}</span>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              DEBTORS
            </div>
          </div>
        </div>

        {/* KPI 3: Mikataba Inayoisha */}
        <div className="relative bg-white p-4 shadow-sm border border-gray-100 group overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono block">CONTRACTS // EXPIRING</span>
              <span className="text-sm font-bold text-slate-800 uppercase mt-1 block">Renewals (Next 3M)</span>
            </div>
            <span className="p-2 bg-amber-50 text-amber-500 rounded">
              <span className="material-symbols-outlined text-[20px]">history</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-5xl font-bold text-amber-500 leading-none tracking-tight font-[Space_Grotesk]">{expiringContracts}</span>
          </div>
        </div>

        {/* KPI 4: Kazi Zilizokamilika */}
        <div className="relative bg-white p-4 shadow-sm border border-gray-100 group overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-green-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono block">TASKS // COMPLETED</span>
              <span className="text-sm font-bold text-slate-800 uppercase mt-1 block">Closed This Month</span>
            </div>
            <span className="p-2 bg-green-50 text-green-500 rounded">
              <span className="material-symbols-outlined text-[20px]">task_alt</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-4">
            <span className="text-5xl font-bold text-green-500 leading-none tracking-tight font-[Space_Grotesk]">{completedTasks}</span>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold uppercase">
              <span className="material-symbols-outlined text-[14px]">done_all</span>
              ON TRACK
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN - STAFF PERFORMANCE & RECENT ACTIVITY */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          <div className="bg-white p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></span>
                <span className="text-lg font-bold text-slate-900 uppercase tracking-tight font-[Space_Grotesk]">Staff Performance</span>
                <span className="px-2 py-0.5 bg-slate-100 text-cyan-600 text-[10px] font-bold">LIVE</span>
              </div>
              <div className="text-xs text-gray-500 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> {clockStr} EAT
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-gray-500 uppercase tracking-wider font-mono bg-slate-50/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">STAFF NAME</th>
                    <th className="px-4 py-3 font-medium text-center">OPEN</th>
                    <th className="px-4 py-3 font-medium text-center">OVERDUE</th>
                    <th className="px-4 py-3 font-medium text-center text-green-600">ON TIME</th>
                    <th className="px-4 py-3 font-medium text-center text-amber-600">LATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {perf.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] text-slate-600">
                          {p.name.charAt(0)}
                        </div>
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-gray-600">{Number(p.open_count)}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-red-500 bg-red-50/30">{Number(p.overdue_count)}</td>
                      <td className="px-4 py-3 text-center font-mono text-green-600 bg-green-50/30">{Number(p.on_time)}</td>
                      <td className="px-4 py-3 text-center font-mono text-amber-600">{Number(p.late)}</td>
                    </tr>
                  ))}
                  {perf.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-10 font-mono text-xs uppercase">No staff data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* REAL RECENT ACTIVITY */}
          <div className="bg-white p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                <span className="text-lg font-bold text-slate-900 uppercase tracking-tight font-[Space_Grotesk]">Recent System Activity</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {recentClosings.length === 0 ? (
                <div className="text-center text-gray-400 py-6 font-mono text-xs uppercase bg-slate-50 border border-gray-100 rounded-sm">
                  No recent activity yet
                </div>
              ) : (
                recentClosings.map(c => (
                  <div key={c.id} className="relative bg-white p-3 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 border border-gray-100 flex items-center justify-center font-bold text-slate-400 text-xs">
                        <span className="material-symbols-outlined text-green-500">task_alt</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold uppercase">COMPLETED</span>
                          <span className="text-[10px] text-gray-400 font-mono">{c.obligation_title}</span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-800">{c.company_name} - {c.period_label}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="block text-[10px] text-gray-400 font-mono">CLOSED ON</span>
                        <span className="text-sm font-bold text-slate-600 font-mono">
                          {c.closed_at ? new Date(c.closed_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - SYSTEM LOGS */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          <div className="bg-white p-4 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">System Logs</span>
              </div>
              <span className="text-[10px] text-cyan-600 font-bold font-mono">RECENT</span>
            </div>
            
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              <div className="p-2 bg-slate-50 border border-gray-100 flex flex-col gap-1 text-xs">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-cyan-600 font-bold">DATABASE // SYNC</span>
                  <span className="text-gray-400">{clockStr}</span>
                </div>
                <p className="text-gray-600 text-[11px]">System connected to PostgreSQL database successfully.</p>
              </div>
              <div className="p-2 bg-slate-50 border border-gray-100 flex flex-col gap-1 text-xs">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-cyan-600 font-bold">AUTH // LOGIN</span>
                  <span className="text-gray-400">Just now</span>
                </div>
                <p className="text-gray-600 text-[11px]">Admin user authenticated from Zanzibar node.</p>
              </div>
            </div>
            
            <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between font-mono text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span> SYSTEM ACTIVE</span>
              <button className="hover:text-slate-800 transition-colors uppercase">CLEAR</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}