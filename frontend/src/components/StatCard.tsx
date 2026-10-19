import type { ReactNode } from 'react' // <-- Ongeza neno 'type' hapa

interface Props {
  label: string
  value: number | string
  color?: 'overdue' | 'soon' | 'closed' | 'default'
  icon?: ReactNode
}

const colorMap = {
  overdue: 'text-overdue',
  soon: 'text-soon',
  closed: 'text-closed',
  default: 'text-text',
}

export default function StatCard({ label, value, color = 'default', icon }: Props) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted uppercase tracking-wide font-medium">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${colorMap[color]}`}>{value}</p>
        </div>
        {icon && <div className="text-2xl text-muted">{icon}</div>}
      </div>
    </div>
  )
}