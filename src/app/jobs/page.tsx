'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, LayoutGrid, List, Search, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Job, JOB_STATUSES, STATUS_CONFIG } from '@/lib/types'
import { apiClient } from '@/lib/api-client'
import { StatusBadge, PriorityBadge } from '@/components/StatusBadge'
import { AddJobModal } from '@/components/AddJobModal'
import { JobDetailPanel } from '@/components/JobDetailPanel'
import { formatDate, formatRelative } from '@/lib/utils'

function JobsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)

  const selectedJob = jobs.find(j => j.id === selectedId) ?? null

  const loadJobs = useCallback(async () => {
    try {
      const data = await apiClient.getJobs({ search: search || undefined, status: statusFilter }) as Job[]
      setJobs(data)
    } catch {
      // leave empty
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => loadJobs(), search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [loadJobs, search])

  function selectJob(job: Job) {
    router.push(`/jobs?id=${job.id}`, { scroll: false })
  }

  function closePanel() {
    router.push('/jobs', { scroll: false })
  }

  return (
    <div className={cn('flex h-full', selectedJob ? 'overflow-hidden' : '')}>
      <div className={cn('flex flex-col flex-1 min-w-0 overflow-y-auto', selectedJob ? 'w-0 md:w-auto' : '')}>
        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-3.5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search jobs..."
                  className="input pl-8 py-1.5 text-xs"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input w-auto py-1.5 text-xs"
            >
              <option value="all">All statuses</option>
              {JOB_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>

            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setView('kanban')}
                className={cn('px-3 py-1.5 text-xs', view === 'kanban' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700')}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setView('table')}
                className={cn('px-3 py-1.5 text-xs', view === 'table' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700')}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <button onClick={() => setShowAdd(true)} className="btn-primary text-xs py-1.5">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm animate-pulse">Loading…</div>
          ) : view === 'kanban' ? (
            <KanbanView jobs={jobs} onSelect={selectJob} selectedId={selectedId} />
          ) : (
            <TableView jobs={jobs} onSelect={selectJob} selectedId={selectedId} />
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedJob && (
        <div className="w-full md:w-96 lg:w-[420px] shrink-0 h-full overflow-hidden">
          <JobDetailPanel
            job={selectedJob}
            onClose={closePanel}
            onUpdated={loadJobs}
            onDeleted={() => { closePanel(); loadJobs() }}
          />
        </div>
      )}

      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} onCreated={loadJobs} />}
    </div>
  )
}

function KanbanView({ jobs, onSelect, selectedId }: { jobs: Job[]; onSelect: (j: Job) => void; selectedId: string | null }) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-sm">No applications found.</p>
      </div>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {JOB_STATUSES.map(status => {
        const col = jobs.filter(j => j.status === status)
        const cfg = STATUS_CONFIG[status]
        return (
          <div key={status} className="shrink-0 w-64">
            <div className={cn('flex items-center gap-2 mb-3 px-1')}>
              <span className={cn('text-xs font-semibold', cfg.color)}>{cfg.label}</span>
              <span className="text-xs text-slate-400 ml-auto">{col.length}</span>
            </div>
            <div className="space-y-2">
              {col.map(job => (
                <JobCard key={job.id} job={job} onClick={() => onSelect(job)} selected={selectedId === job.id} />
              ))}
              {col.length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center">
                  <p className="text-xs text-slate-300 dark:text-slate-600">Empty</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function JobCard({ job, onClick, selected }: { job: Job; onClick: () => void; selected: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3.5 rounded-xl border transition-all hover:shadow-md',
        selected
          ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-700 shadow-sm'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      )}
    >
      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{job.company}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{job.role}</p>
      <div className="flex items-center justify-between mt-2.5">
        <PriorityBadge priority={job.priority} />
        <span className="text-xs text-slate-400">{formatDate(job.dateApplied)}</span>
      </div>
      {job.location && (
        <p className="text-xs text-slate-400 mt-1 truncate">📍 {job.location}</p>
      )}
    </button>
  )
}

function TableView({ jobs, onSelect, selectedId }: { jobs: Job[]; onSelect: (j: Job) => void; selectedId: string | null }) {
  if (jobs.length === 0) {
    return <p className="text-center py-16 text-slate-400 text-sm">No applications found.</p>
  }

  return (
    <div className="card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              {['Company', 'Role', 'Status', 'Priority', 'Location', 'Applied', 'Updated'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {jobs.map(job => (
              <tr
                key={job.id}
                onClick={() => onSelect(job)}
                className={cn(
                  'cursor-pointer transition-colors',
                  selectedId === job.id
                    ? 'bg-brand-50 dark:bg-brand-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                )}
              >
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{job.company}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{job.role}</td>
                <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={job.priority} /></td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{job.location ?? '—'}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(job.dateApplied)}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatRelative(job.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function JobsPage() {
  return (
    <Suspense>
      <JobsPageInner />
    </Suspense>
  )
}
