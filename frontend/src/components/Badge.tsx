import type { Status } from '../types'
import { useLanguage } from '../context/LanguageContext'

const map: Record<Status, { label: string; cls: string }> = {
  open:     { label: 'Open',     cls: 'bg-slate-100 text-slate-700' },
  due_soon: { label: 'Due Soon', cls: 'bg-amber-50 text-soon border border-amber-200' },
  overdue:  { label: 'Overdue',  cls: 'bg-red-50 text-overdue border border-red-200' },
  closed:   { label: 'Closed',   cls: 'bg-green-50 text-closed border border-green-200' },
}

export default function Badge({ status }: { status: Status }) {
  const { label, cls } = map[status]
  const { t } = useLanguage()
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cls}`}>
      {t(label)}
    </span>
  )
}