'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, isToday } from 'date-fns'
import { formatDate, formatDateTime } from '@/lib/utils'

interface Interview {
  id: string
  type: string
  scheduledAt: string
  outcome: string | null
  notes: string | null
  job: { id: string; company: string; role: string }
}

interface Deadline {
  id: string
  company: string
  role: string
  deadline: string
  status: string
}

interface Props {
  interviews: Interview[]
  deadlines: Deadline[]
}

export function CalendarClient({ interviews, deadlines }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  // Pad start
  const firstDayOfWeek = days[0].getDay()
  const paddedDays: (Date | null)[] = [...Array(firstDayOfWeek).fill(null), ...days]

  function getEventsForDay(day: Date) {
    const ivs = interviews.filter(iv => isSameDay(new Date(iv.scheduledAt), day))
    const dls = deadlines.filter(d => isSameDay(new Date(d.deadline), day))
    return { interviews: ivs, deadlines: dls }
  }

  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : null

  // Upcoming events list
  const now = new Date()
  const upcomingInterviews = interviews
    .filter(iv => new Date(iv.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5)

  const upcomingDeadlines = deadlines
    .filter(d => new Date(d.deadline) >= now)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5)

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendar</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Interviews and application deadlines</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="md:col-span-2 card shadow-sm p-5">
          {/* Month header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCurrentMonth(new Date())} className="px-2 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                Today
              </button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px">
            {paddedDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const events = getEventsForDay(day)
              const hasEvents = events.interviews.length > 0 || events.deadlines.length > 0
              const selected = selectedDate && isSameDay(day, selectedDate)
              const today = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(selected ? null : day)}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-start p-1 rounded-lg text-xs transition-all',
                    !isSameMonth(day, currentMonth) && 'opacity-30',
                    today && !selected && 'bg-brand-50 dark:bg-brand-900/20 font-bold text-brand-600 dark:text-brand-400',
                    selected && 'bg-brand-600 text-white',
                    !selected && !today && 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                  )}
                >
                  <span>{format(day, 'd')}</span>
                  {hasEvents && (
                    <div className="flex gap-0.5 mt-0.5">
                      {events.interviews.length > 0 && (
                        <div className={cn('w-1 h-1 rounded-full', selected ? 'bg-white' : 'bg-brand-500')} />
                      )}
                      {events.deadlines.length > 0 && (
                        <div className={cn('w-1 h-1 rounded-full', selected ? 'bg-white' : 'bg-red-500')} />
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-500" /> Interview</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Deadline</span>
          </div>

          {/* Selected date events */}
          {selectedDate && selectedEvents && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold mb-2">{format(selectedDate, 'MMMM d, yyyy')}</h3>
              {selectedEvents.interviews.length === 0 && selectedEvents.deadlines.length === 0 && (
                <p className="text-xs text-slate-400">No events this day.</p>
              )}
              {selectedEvents.interviews.map(iv => (
                <div key={iv.id} className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-3 mb-2">
                  <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 capitalize">{iv.type} Interview</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{iv.job.company} — {iv.job.role}</p>
                  <p className="text-xs text-slate-500">{format(new Date(iv.scheduledAt), 'h:mm a')}</p>
                </div>
              ))}
              {selectedEvents.deadlines.map(d => (
                <div key={d.id} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-2">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300">Application Deadline</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{d.company} — {d.role}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upcoming Interviews */}
          <div className="card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-semibold">Upcoming Interviews</h2>
            </div>
            {upcomingInterviews.length === 0 ? (
              <p className="text-xs text-slate-400">None scheduled.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingInterviews.map(iv => (
                  <div key={iv.id} className="text-xs">
                    <p className="font-medium capitalize">{iv.type} — {iv.job.company}</p>
                    <p className="text-slate-500">{formatDateTime(iv.scheduledAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div className="card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-semibold">Deadlines</h2>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-400">No deadlines.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingDeadlines.map(d => (
                  <div key={d.id} className="text-xs">
                    <p className="font-medium">{d.company}</p>
                    <p className="text-slate-500">{d.role} · {formatDate(d.deadline)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
