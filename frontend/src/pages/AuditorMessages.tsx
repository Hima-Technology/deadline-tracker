import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import api, { errMsg } from '../api/client'
import { useAuth } from '../context/AuthContext'

type Auditor = { id: number; name: string; email: string }
type AuditorMessage = {
  id: number
  auditor_id: number
  sender_role: 'admin' | 'auditor'
  sender_name: string
  message: string
  created_at: string
}

export default function AuditorMessages() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [auditors, setAuditors] = useState<Auditor[]>([])
  const [selectedAuditorId, setSelectedAuditorId] = useState('')
  const [messages, setMessages] = useState<AuditorMessage[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const loadThread = useCallback(async () => {
    try {
      const response = await api.get('/auditor-messages', {
        params: isAdmin && selectedAuditorId ? { auditor_id: selectedAuditorId } : undefined,
      })
      if (isAdmin) {
        const availableAuditors: Auditor[] = response.data.data?.auditors || []
        setAuditors(availableAuditors)
        if (!selectedAuditorId && availableAuditors.length) {
          setSelectedAuditorId(String(availableAuditors[0].id))
        }
      }
      setMessages(response.data.data?.messages || [])
      setError('')
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }, [isAdmin, selectedAuditorId])

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadThread(), 0)
    const timer = window.setInterval(() => void loadThread(), 30_000)
    return () => {
      window.clearTimeout(initialLoad)
      window.clearInterval(timer)
    }
  }, [loadThread])

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = draft.trim()
    if (!message || sending || (isAdmin && !selectedAuditorId)) return

    setSending(true)
    setError('')
    try {
      const response = await api.post('/auditor-messages', {
        message,
        ...(isAdmin ? { auditor_id: Number(selectedAuditorId) } : {}),
      })
      setMessages(items => [...items, response.data.data])
      setDraft('')
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setSending(false)
    }
  }

  const selectedAuditor = auditors.find(auditor => String(auditor.id) === selectedAuditorId)
  const canSend = !isAdmin || !!selectedAuditorId

  return (
    <section className="space-y-4 border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">forum</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              {isAdmin ? 'Auditor Messages' : 'Messages from Admin'}
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isAdmin
              ? 'Send a message to an auditor or reply in the conversation.'
              : 'Receive messages from the admin and reply here.'}
          </p>
        </div>
        {isAdmin && (
          <label className="w-full sm:max-w-xs">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Choose auditor</span>
            <select
              value={selectedAuditorId}
              onChange={event => {
                setLoading(true)
                setSelectedAuditorId(event.target.value)
                setMessages([])
              }}
              className="w-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            >
              <option value="">Select an auditor</option>
              {auditors.map(auditor => (
                <option key={auditor.id} value={auditor.id}>{auditor.name} · {auditor.email}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => void loadThread()} className="shrink-0 font-bold underline">Retry</button>
        </div>
      )}

      <div className="max-h-96 min-h-32 space-y-3 overflow-y-auto border border-slate-100 bg-slate-50 p-3">
        {loading ? (
          <p className="py-8 text-center text-xs text-slate-400">Loading messages...</p>
        ) : isAdmin && !auditors.length ? (
          <p className="py-8 text-center text-xs italic text-slate-400">There are no active auditor accounts.</p>
        ) : isAdmin && !selectedAuditorId ? (
          <p className="py-8 text-center text-xs italic text-slate-400">Select an auditor to view the conversation.</p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-xs italic text-slate-400">
            {isAdmin ? `No messages with ${selectedAuditor?.name || 'this auditor'} yet.` : 'No messages from admin yet.'}
          </p>
        ) : messages.map(message => {
          const mine = message.sender_role === (isAdmin ? 'admin' : 'auditor')
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] whitespace-pre-wrap break-words rounded-sm px-3 py-2 sm:max-w-[75%] ${
                mine ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-800'
              }`}>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider opacity-70">
                  {message.sender_name} · {message.sender_role}
                </p>
                <p className="text-sm">{message.message}</p>
                <p className="mt-1 text-right text-[9px] opacity-60">{new Date(message.created_at).toLocaleString()}</p>
              </div>
            </div>
          )
        })}
      </div>

      {(!isAdmin || auditors.length > 0) && (
        <form onSubmit={sendMessage} className="space-y-2">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isAdmin ? 'Message' : 'Reply to admin'}
            </span>
            <textarea
              value={draft}
              onChange={event => setDraft(event.target.value)}
              maxLength={5000}
              rows={3}
              disabled={!canSend || sending}
              placeholder={isAdmin ? 'Write a message to the selected auditor...' : 'Write your reply...'}
              className="w-full border border-slate-200 bg-white p-3 text-sm focus:border-indigo-400 focus:outline-none disabled:bg-slate-100"
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-slate-400">{draft.length}/5000</span>
            <button
              type="submit"
              disabled={!canSend || !draft.trim() || sending}
              className="flex items-center gap-2 rounded-sm bg-indigo-600 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
