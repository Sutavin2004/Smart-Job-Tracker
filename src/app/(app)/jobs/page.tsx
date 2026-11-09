'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable, type DropResult, type DraggableProvidedDragHandleProps } from '@hello-pangea/dnd'
import { toast } from 'sonner'
import { Plus, LayoutGrid, List, Search, X, ExternalLink, Bot, Briefcase, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Job, type JobStatus, JOB_STATUSES, STATUS_CONFIG } from '@/lib/types'
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
  const [view, setViewState] = useState<'kanban' | 'table'>('kanban')
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jobs-view')
      if (saved === 'kanban' || saved === 'table') setViewState(saved)
    } catch { /* storage unavailable */ }
  }, [])
  function setView(v: 'kanban' | 'table') {
    setViewState(v)
    try { localStorage.setItem('jobs-view', v) } catch { /* ignore */ }
  }
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)

  const discoveredBy = searchParams.get('discoveredBy') ?? undefined
  const selectedJob = jobs.find(j => j.id === selectedId) ?? null

  const loadJobs = useCallback(async () => {
    try {
      const data = await apiClient.getJobs({ search: search || undefined, status: statusFilter }) as Job[]
      // If filtering by discoveredBy (e.g. ?discoveredBy=agent), filter client-side
      const filtered = discoveredBy ? data.filter(j => j.discoveredBy === discoveredBy) : data
      setJobs(filtered)
    } catch {
      // leave empty
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, discoveredBy])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => loadJobs(), search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [loadJobs, search])

  async function moveJob(id: string, status: JobStatus) {
    const before = jobs
    const job = jobs.find(j => j.id === id)
    if (!job || job.status === status) return
    // Optimistic: move the card immediately, roll back if the save fails.
    setJobs(prev => prev.map(j => (j.id === id ? { ...j, status, updatedAt: new Date().toISOString() } : j)))
    try {
      const updated = await apiClient.updateJob(id, { status }) as Job
      setJobs(prev => prev.map(j => (j.id === id ? { ...j, ...updated } : j)))
      toast.success(`Moved ${job.company} to ${STATUS_CONFIG[status].label}`)
      if (status === 'offered') {
        const confetti = (await import('canvas-confetti')).default
        confetti({ particleCount: 140, spread: 80, origin: { y: 0.7 } })
      }
    } catch {
      setJobs(before)
      toast.error("Couldn't move that job. Try again.")
    }
  }

  const hasFilters = Boolean(search) || statusFilter !== 'all' || Boolean(discoveredBy)
  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    if (discoveredBy) router.push('/jobs', { scroll: false })
  }

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
        <h1 className="sr-only">Jobs board</h1>
        <div className="sticky top-0 z-10 bg-slate-50 dark:bg-[#121314] border-b border-slate-200 dark:border-[#2A2B2E] px-6 py-3.5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search jobs"
                  placeholder="Search jobs..."
                  className="input pl-8 py-1.5 text-xs"
                />
                {search && (
                  <button onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input w-auto py-1.5 text-xs"
            >
              <option value="all">All statuses</option>
              {JOB_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>

            <div className="flex rounded-lg border border-slate-200 dark:border-[#2A2B2E] overflow-hidden">
              <button
                onClick={() => setView('kanban')}
                aria-label="Board view"
                aria-pressed={view === 'kanban'}
                className={cn('px-3 py-1.5 text-xs', view === 'kanban' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.05]')}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setView('table')}
                aria-label="Table view"
                aria-pressed={view === 'table'}
                className={cn('px-3 py-1.5 text-xs', view === 'table' ? 'bg-brand-600 text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.05]')}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <button onClick={() => setShowAdd(true)} className="btn-primary text-xs py-1.5">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {discoveredBy === 'agent' && (
          <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-2.5 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700 rounded-xl text-xs text-brand-700 dark:text-brand-300">
            <Bot className="w-3.5 h-3.5 shrink-0" />
            <span>Showing jobs discovered by the AI Agent. <button onClick={() => router.push('/jobs', { scroll: false })} className="underline hover:no-underline ml-1">Clear filter</button></span>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm animate-pulse">Loading…</div>
          ) : jobs.length === 0 ? (
            <EmptyState filtered={hasFilters} onAdd={() => setShowAdd(true)} onClear={clearFilters} />
          ) : view === 'kanban' ? (
            <KanbanView jobs={jobs} onSelect={selectJob} selectedId={selectedId} onMove={moveJob} />
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

function EmptyState({ filtered, onAdd, onClear }: { filtered: boolean; onAdd: () => void; onClear: () => void }) {
  if (filtered) {
    return (
      <div className="text-center py-16">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No jobs match these filters</p>
        <button onClick={onClear} className="mt-3 text-sm text-brand-600 hover:underline">Clear filters</button>
      </div>
    )
  }
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30">
        <Briefcase className="h-7 w-7 text-brand-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your board is empty</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Add a job you&apos;re interested in, or let the AI agent find matches for you.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button onClick={onAdd} className="btn-primary text-sm"><Plus className="w-4 h-4" /> Add a job</button>
        <Link href="/agent" className="btn-secondary text-sm"><Sparkles className="w-4 h-4" /> Find jobs with AI</Link>
      </div>
    </div>
  )
}

function KanbanView({ jobs, onSelect, selectedId, onMove }: {
  jobs: Job[]
  onSelect: (j: Job) => void
  selectedId: string | null
  onMove: (id: string, status: JobStatus) => void
}) {
  function onDragEnd(result: DropResult) {
    const dest = result.destination?.droppableId as JobStatus | undefined
    if (dest && dest !== result.source.droppableId) onMove(result.draggableId, dest)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <p className="mb-3 text-xs text-slate-400 hidden md:block">Tip: drag cards between columns to update their status.</p>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {JOB_STATUSES.map(status => {
          const col = jobs.filter(j => j.status === status)
          const cfg = STATUS_CONFIG[status]
          return (
            <section key={status} aria-labelledby={`col-${status}`} className="shrink-0 w-64">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={cn('w-2 h-2 rounded-full', cfg.dot)} aria-hidden="true" />
                <h2 id={`col-${status}`} className={cn('text-xs font-semibold', cfg.color)}>{cfg.label}</h2>
                <span className="text-xs text-slate-400 ml-auto" aria-label={`${col.length} jobs`}>{col.length}</span>
              </div>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'space-y-2 min-h-24 rounded-xl transition-colors',
                      snapshot.isDraggingOver && 'bg-brand-50/70 dark:bg-brand-900/20 ring-2 ring-brand-300/60 dark:ring-brand-700/60'
                    )}
                  >
                    {col.map((job, index) => (
                      <Draggable key={job.id} draggableId={job.id} index={index}>
                        {(drag, dragSnap) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            className={cn(dragSnap.isDragging && 'rotate-1 shadow-xl')}
                          >
                            <JobCard job={job} onClick={() => onSelect(job)} selected={selectedId === job.id} handleProps={drag.dragHandleProps} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {col.length === 0 && !snapshot.isDraggingOver && (
                      <div className="h-24 border-2 border-dashed border-slate-200 dark:border-[#2A2B2E] rounded-xl flex items-center justify-center">
                        <p className="text-xs text-slate-400 dark:text-slate-400">Drop here</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </section>
          )
        })}
      </div>
    </DragDropContext>
  )
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return null
  const color = score >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    : score >= 45 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-slate-100 text-slate-500 dark:bg-[#26272A] dark:text-slate-400'
  return (
    <span className={cn('text-[11px] font-semibold px-1.5 py-0.5 rounded-md', color)}>
      {score}/100
    </span>
  )
}

function JobCard({ job, onClick, selected, handleProps }: {
  job: Job
  onClick: () => void
  selected: boolean
  handleProps?: DraggableProvidedDragHandleProps | null
}) {
  return (
    <div
      className={cn(
        'w-full text-left rounded-xl border transition-all hover:shadow-md',
        selected
          ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-700'
          : 'bg-white dark:bg-[#1A1B1D] border-slate-200 dark:border-[#2A2B2E] hover:border-slate-300 dark:hover:border-slate-600'
      )}
    >
      {/* The card body is the drag handle and opens the job (click or Enter); Space lifts it for keyboard dragging. */}
      <div
        {...handleProps}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onClick() } }}
        className="w-full text-left p-3.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{job.company}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{job.role}</p>
          </div>
          <ScoreBadge score={job.aiScore} />
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {job.remote && (
            <span className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 dark:border-[#2A2B2E] dark:text-slate-400">
              Remote
            </span>
          )}
          {job.hybrid && !job.remote && (
            <span className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 dark:border-[#2A2B2E] dark:text-slate-400">
              Hybrid
            </span>
          )}
          {job.source && (
            <span className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 dark:border-[#2A2B2E] dark:text-slate-400 truncate max-w-[90px]">
              {job.source}
            </span>
          )}
          {job.discoveredBy === 'agent' && (
            <span className="text-[11px] px-1.5 py-0.5 rounded border border-brand-200 text-brand-700 dark:border-brand-800 dark:text-brand-400">
              Found by agent
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2.5">
          <PriorityBadge priority={job.priority} />
          <span className="text-xs text-slate-400">
            {job.status === 'saved' ? `Saved ${formatRelative(job.createdAt)}` : formatDate(job.dateApplied)}
          </span>
        </div>
        {job.location && (
          <p className="text-xs text-slate-400 mt-1 truncate">{job.location}</p>
        )}
        {job.salary && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{job.salary}</p>
        )}
      </div>

      {/* Apply button — outside the main button to avoid nested buttons */}
      {job.jobUrl && (
        <div className="px-3.5 pb-3">
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-[#2A2B2E] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Apply / View Posting
          </a>
        </div>
      )}
    </div>
  )
}

function TableView({ jobs, onSelect, selectedId }: { jobs: Job[]; onSelect: (j: Job) => void; selectedId: string | null }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/[0.06] border-b border-slate-200 dark:border-[#2A2B2E]">
              {['Company', 'Role', 'Status', 'Priority', 'Fit', 'Location', 'Source', 'Applied', 'Updated', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#26272A]">
            {jobs.map(job => (
              <tr
                key={job.id}
                onClick={() => onSelect(job)}
                onKeyDown={e => { if (e.key === 'Enter') onSelect(job) }}
                tabIndex={0}
                className={cn(
                  'cursor-pointer transition-colors focus:outline-none focus-visible:bg-brand-50 dark:focus-visible:bg-brand-900/20',
                  selectedId === job.id
                    ? 'bg-brand-50 dark:bg-brand-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                )}
              >
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{job.company}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{job.role}</td>
                <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={job.priority} /></td>
                <td className="px-4 py-3"><ScoreBadge score={job.aiScore} /></td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                  {job.location ?? '—'}
                  {job.remote && <span className="ml-1 text-slate-500">, remote</span>}
                  {job.hybrid && !job.remote && <span className="ml-1 text-slate-500">, hybrid</span>}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{job.source ?? '—'}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{job.status === 'saved' ? '—' : formatDate(job.dateApplied)}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{formatRelative(job.updatedAt)}</td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  {job.jobUrl && (
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Apply
                    </a>
                  )}
                </td>
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
