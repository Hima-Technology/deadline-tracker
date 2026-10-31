import { useState } from 'react'
import type { Closing } from '../types'
import { useLanguage } from '../context/LanguageContext'

interface Props {
  closings: Closing[]
}

export default function CalendarView({ closings = [] }: Props) {
  const { language, t } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null) // Kwa ajili ya ku-view event

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const dateLocale = language === 'sw' ? 'sw-TZ' : 'en-US'
  const monthName = new Intl.DateTimeFormat(dateLocale, { month: 'long' }).format(currentDate)
  const dayNames = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(dateLocale, { weekday: 'short' }).format(new Date(2023, 0, index + 1)),
  )

  const authorityBgColors: Record<string, string> = {
    TRA: 'bg-blue-50 border-blue-200 text-blue-700',
    ZRA: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    BPRA: 'bg-purple-50 border-purple-200 text-purple-700',
    ZSSF: 'bg-orange-50 border-orange-200 text-orange-700',
    ALL: 'bg-slate-50 border-slate-200 text-slate-700',
    TWO: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  }

  function getEventsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return (closings || []).filter((c: any) => c.due_date === dateStr)
  }

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)) }

  return (
    <div className="bg-white border border-gray-200 shadow-sm p-4 rounded-sm relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight font-[Space_Grotesk]">
          {monthName} {year}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button onClick={nextMonth} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-gray-500 uppercase mb-2">
        {dayNames.map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-24 bg-slate-50/50 rounded-sm"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayEvents = getEventsForDay(day)
          const today = new Date()
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

          return (
            <div
              key={day}
              className={`h-24 p-1 border rounded-sm overflow-hidden flex flex-col ${
                isToday ? 'border-cyan-500 bg-cyan-50/30' : 'border-gray-100 bg-white'
              }`}
            >
              <span className={`text-xs font-mono font-bold ${isToday ? 'text-cyan-600' : 'text-slate-600'}`}>
                {day}
              </span>
              
              {/* EVENTS ZENYEWE (Maandishi) */}
              <div className="flex flex-col gap-1 mt-1 overflow-y-auto">
                {dayEvents.slice(0, 2).map((e: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedEvent(e)}
                    className={`text-[9px] font-bold px-1 py-0.5 rounded-sm border text-left truncate w-full ${
                      authorityBgColors[e.authority] || 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                    title={`${e.company_name} - ${e.obligation_title}`}
                  >
                    {e.authority || 'Task'} - {e.obligation_title}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[8px] text-gray-500 font-mono">+{dayEvents.length - 2} zaidi</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs font-mono">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> TRA</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> ZRA</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> BPRA</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> ZSSF</span>
      </div>

      {/* MODAL YA KU-VIEW EVENT (Inafunguka ukibonyeza event) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
             onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-bold text-slate-800 uppercase">{selectedEvent.authority} {t('Task')}</h4>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-red-500">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">{t('Company:')}</span> <strong>{selectedEvent.company_name}</strong></p>
              <p><span className="text-gray-500">{t('Task:')}</span> <strong>{selectedEvent.obligation_title}</strong></p>
              <p><span className="text-gray-500">{t('Period:')}</span> {selectedEvent.period_label}</p>
              <p><span className="text-gray-500">{t('Due Date:')}</span> <strong className="font-mono">{selectedEvent.due_date}</strong></p>
              <p><span className="text-gray-500">{t('Status:')}</span> 
                <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                  selectedEvent.status === 'overdue' ? 'bg-red-100 text-red-600' :
                  selectedEvent.status === 'closed' ? 'bg-green-100 text-green-600' :
                  selectedEvent.status === 'due_soon' ? 'bg-amber-100 text-amber-600' :
                  'bg-slate-100 text-slate-600'
                }`}>{selectedEvent.status}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}