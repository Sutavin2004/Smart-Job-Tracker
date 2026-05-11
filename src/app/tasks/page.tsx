'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Square, Plus, Trash2, Calendar, Flag, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import type { Task, Job } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-600',
  medium: 'text-amber-600',
  low: 'text-emerald-600',
}

const PRIORITY_BG: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

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
    <div className="card shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
      >
        <span className="flex items-center gap-2"><Plus className="w-4 h-4 text-brand-500" /> New Task</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-4">
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
              <label className="block text-xs font-medium text-slate-500 mb-1">Due Date</label>
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
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="btn-primary text-xs py-2 flex-1">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {saving ? 'Adding…' : 'Add Task'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {pendingCount} pending{overdueCount > 0 && ` · `}
            {overdueCount > 0 && <span className="text-red-500">{overdueCount} overdue</span>}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: 'All Tasks', value: tasks.length, filter: 'all', valueClass: 'text-slate-900 dark:text-white' },
          { label: 'Pending', value: pendingCount, filter: 'pending', valueClass: 'text-amber-600' },
          { label: 'Completed', value: tasks.length - pendingCount, filter: 'completed', valueClass: 'text-emerald-600' },
        ] as const).map(item => (
          <button
            key={item.filter}
            onClick={() => setFilter(item.filter)}
            className={cn('card p-4 text-center transition-all hover:shadow-md', filter === item.filter && 'ring-2 ring-brand-500')}
          >
            <p className={cn('text-2xl font-bold', item.valueClass)}>{item.value}</p>
            <p className="text-xs text-slate-500 mt-1">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Add task form */}
      {!loading && <AddTaskForm jobs={jobs} onCreated={loadAll} />}

      {/* Task list */}
      <div className="card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CheckSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No tasks here.</p>
            {filter === 'pending' && (
              <p className="text-xs mt-1">Use the form above to add a task, or add from within a job application.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filtered.map(task => {
              const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group"
                >
                  <button
                    onClick={() => toggleTask(task)}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-brand-500 transition-colors"
                  >
                    {task.completed
                      ? <CheckSquare className="w-5 h-5 text-emerald-500" />
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
                        <span className="text-xs text-slate-400 truncate max-w-[180px]">
                          📋 {task.job.company} · {task.job.role}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs',
                          isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'
                        )}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.dueDate)}
                          {isOverdue && ' · Overdue'}
                        </span>
                      )}
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md font-medium',
                        PRIORITY_BG[task.priority] ?? 'bg-slate-100 text-slate-500'
                      )}>
                        <Flag className="w-2.5 h-2.5" />
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTask(task)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all shrink-0 mt-0.5"
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
