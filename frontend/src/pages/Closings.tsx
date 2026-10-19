import { useEffect, useState, useMemo } from 'react'
import api, { errMsg } from '../api/client'
import Modal from '../components/Modal'
import Toast from '../components/Toast'
import Swal from 'sweetalert2'
import Badge from '../components/Badge'
import type { Closing } from '../types'

export default function Closings() {
  const [rows, setRows] = useState<Closing[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  
  // Data Table States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const rowsPerPage = 15

  // View State
  const [viewClosing, setViewClosing] = useState<Closing | null>(null)
  
  // Edit State
  const [editClosing, setEditClosing] = useState<Closing | null>(null)
  const [editRef, setEditRef] = useState('')

  // Close Task State (Kwa ajili ya Admin)
  const [closeClosing, setCloseClosing] = useState<Closing | null>(null)
  const [closeRef, setCloseRef] = useState('')
  const [closeFile, setCloseFile] = useState<File | null>(null)

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'loading' as 'loading' | 'success' | 'error' })
  function showToast(message: string, type: 'loading' | 'success' | 'error' = 'loading') {
    setToast({ show: true, message, type })
    if (type !== 'loading') {
      setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000)
    }
  }

  async function load() {
    try {
      const r = await api.get('/closings', { params: statusFilter ? { status: statusFilter } : {} })
      setRows(r.data.data)
    } catch (e) { setError(errMsg(e)) }
  }
  useEffect(() => { load() }, [statusFilter])

  // Kufuta Closing
  async function remove(c: Closing) {
    const result = await Swal.fire({
      title: 'Delete Closing Record?',
      text: `Are you sure you want to delete the closing for "${c.company_name} - ${c.obligation_title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-xl shadow-2xl font-sans' }
    })

    if (!result.isConfirmed) return

    showToast('DELETING RECORD...', 'loading')
    try { 
      await api.delete(`/closings/${c.id}`)
      showToast('RECORD DELETED', 'success')
      load() 
    }
    catch (e) { 
      Swal.fire('Error!', errMsg(e), 'error')
      showToast('DELETE FAILED', 'error')
    }
  }

  // Kuhariri (Update Reference Number)
  function openEdit(c: Closing) {
    setEditClosing(c)
    setEditRef(c.reference_number || '')
  }

  async function saveEdit() {
    if (!editClosing) return
    setBusy(true)
    try {
      await api.put(`/closings/${editClosing.id}`, { reference_number: editRef })
      setEditClosing(null)
      showToast('RECORD UPDATED', 'success')
      await load() 
    } catch (e: any) {
      const errDetail = e?.response?.data?.error_detail || e?.response?.data?.message || 'Unknown error'
      setError(errDetail)
      showToast('UPDATE FAILED', 'error')
    } finally {
      setBusy(false)
    }
  }

  // KUFUNGA KAZI (Mark as Closed) - Kwa Admin
  function openClose(c: Closing) {
    setCloseClosing(c)
    setCloseRef('')
    setCloseFile(null)
  }

  async function markClosed() {
    if (!closeClosing) return
    setBusy(true)
    showToast('CLOSING TASK...', 'loading')
    try {
      const fd = new FormData()
      fd.append('_method', 'PUT') // <-- Muhimu kwa PHP kupokea FormData
      fd.append('status', 'closed')
      fd.append('reference_number', closeRef)
      if (closeFile) fd.append('proof', closeFile)

      await api.post(`/closings/${closeClosing.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setCloseClosing(null)
      showToast('TASK CLOSED', 'success')
      await load()
    } catch (e) {
      setError(errMsg(e))
      showToast('ACTION FAILED', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Filter & Search Data
  const filteredData = useMemo(() => {
    return rows.filter((c) => {
      const searchLower = search.toLowerCase()
      const matchesSearch = 
        (c.company_name || '').toLowerCase().includes(searchLower) ||
        (c.obligation_title || '').toLowerCase().includes(searchLower) ||
        (c.staff_name || '').toLowerCase().includes(searchLower) ||
        (c.period_label || '').toLowerCase().includes(searchLower)
      
      return matchesSearch
    })
  }, [rows, search])

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const paginatedData = filteredData.slice((page - 1) * rowsPerPage, page * rowsPerPage)

  return (
    <div className="space-y-6 relative">
      
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-cyan-100/50 text-cyan-800 text-[10px] uppercase tracking-widest font-bold border border-cyan-200">SYS.OPS // TELEMETRY</span>
            <span className="text-gray-400 text-[10px]">//</span>
            <span className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">DATA: CLOSINGS</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-[Space_Grotesk] uppercase">Closings Radar</h2>
        </div>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 border border-red-200 rounded text-sm font-mono">{error}</div>}

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row w-full gap-3">
          <div className="relative w-full sm:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search company, obligation, or staff..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select 
            className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono uppercase font-bold text-slate-700"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="due_soon">Due Soon</option>
            <option value="overdue">Overdue</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          Displaying {paginatedData.length} of {filteredData.length} records
        </div>
      </div>

      {/* JEDWALI LA CLOSINGS */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-[10px] uppercase font-mono tracking-wider text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4 font-semibold">Company / Client</th>
              <th className="px-4 py-4 font-semibold">Obligation</th>
              <th className="px-4 py-4 font-semibold text-center">Period</th>
              <th className="px-4 py-4 font-semibold text-center">Due Date</th>
              <th className="px-4 py-4 font-semibold">Assigned To</th>
              <th className="px-4 py-4 font-semibold text-center">Status</th>
              <th className="px-4 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                <td className="px-4 py-3 font-semibold text-slate-800">{c.company_name}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{c.obligation_title}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs text-center">{c.period_label}</td>
                <td className="px-4 py-3 text-slate-600 font-mono text-xs text-center">{c.due_date}</td>
                <td className="px-4 py-3 text-slate-600 text-xs flex items-center gap-2">
                   {c.staff_name ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center text-[9px] text-cyan-700 font-bold">
                        {c.staff_name.charAt(0)}
                      </div>
                      {c.staff_name}
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge status={c.status} />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap flex justify-end gap-1">
                  
                  {/* KITUFE CHA KU-VIEW PROOF (KAMA IPO) */}
                  {c.proof_file_path && (
                    <a 
                      href={`http://localhost:8000/api/files${c.proof_file_path}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View Proof"
                    >
                      <span className="material-symbols-outlined text-[18px]">description</span>
                    </a>
                  )}

                  {/* KITUFE CHA KUFUNGA KAZI (MARK AS CLOSED) */}
                  {c.status !== 'closed' && (
                    <button 
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" 
                      onClick={() => openClose(c)}
                      title="Mark as Closed"
                    >
                      <span className="material-symbols-outlined text-[18px]">task_alt</span>
                    </button>
                  )}

                  <button 
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" 
                    onClick={() => setViewClosing(c)}
                    title="View Details"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                  <button 
                    className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded transition-colors" 
                    onClick={() => openEdit(c)}
                    title="Edit Reference"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button 
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                    onClick={() => remove(c)}
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-12 font-mono text-xs uppercase">
                  No closing records found
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

      {/* MODAL YA KU-VIEW CLOSING */}
      <Modal open={!!viewClosing} onClose={() => setViewClosing(null)} title="Closing Record Details">
        {viewClosing && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-gray-200 rounded-sm">
              <div className="w-16 h-16 rounded bg-white border border-gray-200 flex items-center justify-center text-cyan-500 shadow-sm">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 uppercase font-[Space_Grotesk]">{viewClosing.company_name}</h3>
                <p className="text-xs font-mono text-gray-500">TRACKER ID: SBC-{viewClosing.id.toString().padStart(4, '0')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 border border-gray-100 bg-white sm:col-span-2">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Obligation / Task</span>
                <span className="text-sm font-semibold text-slate-700">{viewClosing.obligation_title}</span>
              </div>
              <div className="p-3 border border-gray-100 bg-white">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Period</span>
                <span className="text-sm font-semibold text-slate-700 font-mono">{viewClosing.period_label}</span>
              </div>
              <div className="p-3 border border-gray-100 bg-white">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Due Date</span>
                <span className="text-sm font-semibold text-slate-700 font-mono">{viewClosing.due_date}</span>
              </div>
              <div className="p-3 border border-gray-100 bg-white">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Status</span>
                <Badge status={viewClosing.status} />
              </div>
              <div className="p-3 border border-gray-100 bg-white">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Reference Number</span>
                <span className="text-sm font-semibold text-slate-700 font-mono">{viewClosing.reference_number || 'N/A'}</span>
              </div>
              <div className="p-3 border border-gray-100 bg-white sm:col-span-2">
                <span className="block text-[10px] font-bold text-gray-400 uppercase font-mono mb-1">Assigned Operator</span>
                <span className="text-sm font-semibold text-slate-700">{viewClosing.staff_name || 'Unassigned'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button className="px-6 py-2 bg-slate-800 text-white text-xs font-bold uppercase hover:bg-slate-700 transition-colors shadow-sm rounded-sm" onClick={() => setViewClosing(null)}>Close Record</button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL YA KUHARIRI (REFERENCE NUMBER) */}
      <Modal open={!!editClosing} onClose={() => setEditClosing(null)} title="Update Reference Number">
        {editClosing && (
          <div className="space-y-4">
             <div className="p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800 font-mono">
              Updating reference for <strong>{editClosing.company_name}</strong> ({editClosing.period_label})
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Reference Number</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" 
                value={editRef}
                onChange={(e) => setEditRef(e.target.value)} 
              />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
              <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 transition-colors rounded-sm" onClick={() => setEditClosing(null)}>
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 transition-colors shadow-sm rounded-sm flex items-center gap-2 disabled:opacity-50" 
                onClick={saveEdit} 
                disabled={busy}
              >
                {busy ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                    Saving...
                  </>
                ) : (
                  'Update Record'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL YA KUFUNGA KAZI (KWA ADMIN) */}
      <Modal open={!!closeClosing} onClose={() => setCloseClosing(null)} title="Mark Task as Closed">
        {closeClosing && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800 font-mono">
              Closing task for <strong>{closeClosing.company_name}</strong> ({closeClosing.period_label})
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Reference Number *</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm font-mono" 
                value={closeRef}
                onChange={(e) => setCloseRef(e.target.value)} 
                placeholder="e.g. TRA-2026-..."
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Proof (PDF / Image, optional)</label>
              <input 
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all rounded-sm file:mr-4 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" 
                type="file" 
                accept="application/pdf,image/*"
                onChange={(e) => setCloseFile(e.target.files?.[0] || null)} 
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
              <button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 text-xs font-bold uppercase hover:bg-gray-50 transition-colors rounded-sm" onClick={() => setCloseClosing(null)}>
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-cyan-500 text-white text-xs font-bold uppercase hover:bg-cyan-400 transition-colors shadow-sm rounded-sm flex items-center gap-2 disabled:opacity-50" 
                onClick={markClosed} 
                disabled={busy || !closeRef.trim()}
              >
                {busy ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                    Closing...
                  </>
                ) : (
                  'Confirm Closure'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}