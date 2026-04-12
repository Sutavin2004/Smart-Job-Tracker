'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Square, Plus, Trash2, Calendar, Flag, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import type { Task } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-600',
  medium: 'text-amber-600',
  low: 'text-emerald-600',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    setLoading(true)
    try {
      const data = await apiClient.getAllTasks()
      setTasks(data)
    } catch {
      toast.error('Failed to load tasks')
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
            {pendingCount} pending{overdueCount > 0 && ` · ${overdueCount} overdue`}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilter('all')}
          className={cn('card p-4 text-center transition-all', filter === 'all' && 'ring-2 ring-brand-500')}
        >
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{tasks.length}</p>
          <p className="text-xs text-slate-500 mt-1">All Tasks</p>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={cn('card p-4 text-center transition-all', filter === 'pending' && 'ring-2 ring-brand-500')}
        >
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-slate-500 mt-1">Pending</p>
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={cn('card p-4 text-center transition-all', filter === 'completed' && 'ring-2 ring-brand-500')}
        >
          <p className="text-2xl font-bold text-emerald-600">{tasks.length - pendingCount}</p>
          <p className="text-xs text-slate-500 mt-1">Completed</p>
        </button>
      </div>

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
            <p className="text-xs mt-1">Add tasks from within a job application.</p>
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
                    <div className="flex items-center gap-3 mt-1.5">
                      {task.job && (
                        <span className="text-xs text-slate-400">
                          {task.job.company} · {task.job.role}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs',
                          isOverdue ? 'text-red-500' : 'text-slate-400'
                        )}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(task.dueDate)}
                          {isOverdue && ' · Overdue'}
                        </span>
                      )}
                      <span className={cn('inline-flex items-center gap-1 text-xs', PRIORITY_COLORS[task.priority] ?? 'text-slate-400')}>
                        <Flag className="w-3 h-3" />
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTask(task)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all shrink-0"
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
