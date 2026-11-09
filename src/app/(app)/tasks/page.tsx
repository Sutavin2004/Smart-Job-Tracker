'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Square, Plus, Trash2, Calendar, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import type { Task, Job } from '@/lib/types'
import { formatDate } from '@/lib/utils'


function AddTaskForm({ jobs, onCreated }: { jobs: Job[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [jobId, setJobId] = useState('')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jobId || !title.trim()) {
      toast.error('Select a job and enter a title')
      return
    }
    setSaving(true)
    try {
      await apiClient.createTask(jobId, {
        title: title.trim(),
        dueDate: dueDate || undefined,
        priority,
        completed: false,
      })
      toast.success('Task created')
      setTitle('')
      setDueDate('')
      setPriority('medium')
      setJobId('')
      setOpen(false)
      onCreated()
    } catch {
      toast.error('Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
      >
        <span className="flex items-center gap-2"><Plus className="w-4 h-4 text-slate-500" /> New task</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3 border-t border-slate-200 dark:border-[#2A2B2E] pt-4">
          {/* Job selector */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Job Application *</label>
            <select
              value={jobId}
              onChange={e => setJobId(e.target.value)}
              className="input text-sm w-full"
              required
            >
              <option value="">— Select a job —</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.company} · {j.role}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Send follow-up email"
              className="input text-sm w-full"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Due date */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="input text-sm w-full"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                className="input text-sm w-full"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="btn-primary text-xs py-2 flex-1">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {saving ? 'Adding…' : 'Add task'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2A2B2E] text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [taskData, jobData] = await Promise.all([
        apiClient.getAllTasks(),
        apiClient.getJobs() as Promise<Job[]>,
      ])
      setTasks(taskData)
      setJobs(jobData)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function toggleTask(task: Task) {
    try {
      await apiClient.updateTask(task.jobId, task.id, { completed: !task.completed })
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
    } catch {
      toast.error('Failed to update task')
    }
  }

  async function deleteTask(task: Task) {
    try {
      await apiClient.deleteTask(task.jobId, task.id)
      setTasks(ts => ts.filter(t => t.id !== task.id))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const pendingCount = tasks.filter(t => !t.completed).length
  const overdueCount = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            {pendingCount} to do{overdueCount > 0 && ', '}
            {overdueCount > 0 && <span className="text-red-700 dark:text-red-400">{overdueCount} overdue</span>}
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Filter tasks" className="flex gap-1 border-b border-slate-200 dark:border-[#2A2B2E]">
        {([
          { label: 'To do', value: pendingCount, filter: 'pending' },
          { label: 'Done', value: tasks.length - pendingCount, filter: 'completed' },
          { label: 'All', value: tasks.length, filter: 'all' },
        ] as const).map(item => (
          <button
            key={item.filter}
            role="tab"
            aria-selected={filter === item.filter}
            onClick={() => setFilter(item.filter)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors',
              filter === item.filter
                ? 'border-brand-600 font-medium text-slate-900 dark:border-brand-400 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            {item.label} <span className="ml-1 tabular-nums text-slate-500">{item.value}</span>
          </button>
        ))}
      </div>

      {/* Add task form */}
      {!loading && <AddTaskForm jobs={jobs} onCreated={loadAll} />}

      {/* Task list */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm text-slate-600 dark:text-slate-300">{filter === 'completed' ? 'Nothing finished yet.' : 'Nothing to do.'}</p>
            {filter === 'pending' && (
              <p className="mt-1 text-[13px] text-slate-500">Add a task above, or from inside a job.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#26272A]">
            {filtered.map(task => {
              const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors group"
                >
                  <button
                    onClick={() => toggleTask(task)}
                    role="checkbox"
                    aria-checked={task.completed}
                    aria-label={`Mark "${task.title}" as ${task.completed ? 'not done' : 'done'}`}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-brand-500 transition-colors"
                  >
                    {task.completed
                      ? <CheckSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                      : <Square className="w-5 h-5" />
                    }
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium',
                      task.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                    )}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      {task.job && (
                        <span className="text-xs text-slate-500 truncate max-w-[220px]">
                          {task.job.company}, {task.job.role}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs',
                          isOverdue ? 'text-red-700 dark:text-red-400 font-medium' : 'text-slate-500'
                        )}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.dueDate)}
                          {isOverdue && ', overdue'}
                        </span>
                      )}
                      {task.priority !== 'medium' && (
                        <span className={cn('text-xs', task.priority === 'high' ? 'text-red-700 dark:text-red-400' : 'text-slate-500')}>
                          {task.priority === 'high' ? 'High priority' : 'Low priority'}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTask(task)}
                    aria-label={`Delete task "${task.title}"`}
                    className="md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-red-500 transition-all shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
