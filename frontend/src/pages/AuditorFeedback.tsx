import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { errMsg } from '../api/client'
import Toast from '../components/Toast'
import Modal from '../components/Modal'
import Swal from 'sweetalert2'

type AuditorDocument = {
  id: number
  client_id: number
  company_name: string
  authority: string
  original_name: string
  uploader_name: string
  created_at: string
  feedback?: string | null
  feedback_by_name?: string | null
  feedback_at?: string | null
}

export default function AuditorFeedback() {
  const [documents, setDocuments] = useState<AuditorDocument[]>([])
  const [preview, setPreview] = useState<{ id: number; url: string; name: string; type: string } | null>(null)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' })

  const loadDocuments = useCallback(async () => {
    try {
      const response = await api.get('/auditor-documents')
      setDocuments(response.data.data || [])
      setError('')
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }, [])

  function refreshDocuments() {
    setBusy(true)
    void loadDocuments()
  }

  useEffect(() => { void loadDocuments() }, [loadDocuments])
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url)
  }, [preview])

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return documents
    return documents.filter(document =>
      [document.company_name, document.original_name, document.authority, document.uploader_name]
        .some(value => (value || '').toLowerCase().includes(query))
    )
  }, [documents, search])

  async function downloadDocument(document: AuditorDocument) {
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
      setToast({ show: true, message: errMsg(e), type: 'error' })
    }
  }

  async function previewDocument(document: AuditorDocument) {
    try {
      const response = await api.get(`/client-documents/${document.id}/file`, { responseType: 'blob' })
      const blob = response.data as Blob
      const url = URL.createObjectURL(blob)
      const contentType = response.headers['content-type']
      setPreview({
        id: document.id,
        url,
        name: document.original_name,
        type: typeof contentType === 'string' ? contentType : blob.type,
      })
    } catch (e) {
      setToast({ show: true, message: errMsg(e), type: 'error' })
    }
  }

  async function saveFeedback(document: AuditorDocument) {
    try {
      const response = await api.post(`/client-documents/${document.id}/feedback`, {
        feedback: document.feedback || '',
      })
      setDocuments(items => items.map(item => item.id === document.id ? response.data.data : item))
      setToast({ show: true, message: 'Auditor feedback saved', type: 'success' })
    } catch (e) {
      setToast({ show: true, message: errMsg(e), type: 'error' })
    }
  }

  async function deleteDocument(document: AuditorDocument) {
    const result = await Swal.fire({
      title: 'Delete auditor document?',
      text: `${document.original_name} and its uploaded file will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Delete document',
      cancelButtonText: 'Cancel',
    })
    if (!result.isConfirmed) return

    try {
      await api.delete(`/client-documents/${document.id}`)
      setDocuments(items => items.filter(item => item.id !== document.id))
      setPreview(current => current?.id === document.id ? null : current)
      setToast({ show: true, message: 'Auditor document deleted', type: 'success' })
    } catch (e) {
      setToast({ show: true, message: errMsg(e), type: 'error' })
    }
  }

  return (
    <div className="relative space-y-6">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-700">
            Admin Review
          </span>
          <h2 className="mt-2 text-2xl font-bold uppercase tracking-tight text-slate-900">Auditor Feedback</h2>
          <p className="mt-1 text-xs text-slate-500">All documents uploaded by auditors across every client.</p>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
          {filteredDocuments.length} of {documents.length} documents
        </span>
      </div>

      <div className="flex flex-col gap-3 border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <label className="relative block w-full sm:max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-gray-400">search</span>
          <input
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search client, document, institution, or auditor..."
            className="w-full border border-gray-200 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-cyan-500 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={refreshDocuments}
          disabled={busy}
          className="flex items-center justify-center gap-2 border border-slate-200 px-4 py-2 text-xs font-bold uppercase text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[16px]">refresh</span>
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={refreshDocuments} className="font-bold underline">Retry</button>
        </div>
      )}

      {busy ? (
        <p className="border border-gray-200 bg-white p-8 text-center text-sm text-slate-500">Loading auditor documents...</p>
      ) : filteredDocuments.length === 0 ? (
        <p className="border border-gray-200 bg-white p-8 text-center text-sm italic text-slate-500">
          {documents.length ? 'No auditor documents match your search.' : 'No auditor documents have been uploaded yet.'}
        </p>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map(document => (
            <article key={document.id} className="space-y-3 border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <h3 className="break-all text-sm font-bold text-slate-800">{document.original_name}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-700">{document.company_name}</p>
                  <p className="mt-1 text-[10px] font-mono uppercase text-slate-500">
                    {document.authority} · Uploaded by {document.uploader_name} · {new Date(document.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 self-start">
                  <button
                    type="button"
                    onClick={() => void previewDocument(document)}
                    className="flex items-center justify-center gap-1 rounded-sm border border-cyan-600 px-3 py-2 text-xs font-bold uppercase text-cyan-700 hover:bg-cyan-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadDocument(document)}
                    className="flex items-center justify-center gap-1 rounded-sm bg-cyan-600 px-3 py-2 text-xs font-bold uppercase text-white hover:bg-cyan-700"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteDocument(document)}
                    className="flex items-center justify-center gap-1 rounded-sm border border-red-200 px-3 py-2 text-xs font-bold uppercase text-red-700 hover:bg-red-50"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete
                  </button>
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Admin feedback</span>
                <textarea
                  maxLength={5000}
                  rows={3}
                  value={document.feedback || ''}
                  onChange={event => setDocuments(items => items.map(item =>
                    item.id === document.id ? { ...item, feedback: event.target.value } : item
                  ))}
                  className="w-full border border-slate-200 bg-slate-50 p-3 text-sm focus:border-indigo-400 focus:outline-none"
                  placeholder="Write feedback for the auditor..."
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">
                  {document.feedback_by_name
                    ? `Last saved by ${document.feedback_by_name}${document.feedback_at ? ` · ${new Date(document.feedback_at).toLocaleDateString()}` : ''}`
                    : 'No feedback saved'}
                </span>
                <button
                  type="button"
                  onClick={() => void saveFeedback(document)}
                  className="rounded-sm bg-indigo-600 px-4 py-2 text-[10px] font-bold uppercase text-white hover:bg-indigo-700"
                >
                  Save Feedback
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? `Document Preview · ${preview.name}` : 'Document Preview'}
      >
        {preview && (
          preview.type.startsWith('image/') ? (
            <img src={preview.url} alt={preview.name} className="mx-auto max-h-[65vh] max-w-full object-contain" />
          ) : preview.type === 'application/pdf' || preview.name.toLowerCase().endsWith('.pdf') ? (
            <iframe
              src={preview.url}
              title={preview.name}
              className="h-[65vh] w-full border border-gray-200 bg-slate-50"
            />
          ) : (
            <div className="space-y-3 text-sm text-slate-600">
              <p>This file type cannot be previewed in the browser. Download the attachment to open it.</p>
              <button
                type="button"
                onClick={() => {
                  const link = window.document.createElement('a')
                  link.href = preview.url
                  link.download = preview.name
                  link.click()
                }}
                className="rounded-sm bg-cyan-600 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-cyan-700"
              >
                Download {preview.name}
              </button>
            </div>
          )
        )}
      </Modal>
    </div>
  )
}
