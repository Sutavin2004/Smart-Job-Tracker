'use client'

import { useState } from 'react'
import { Sun, Moon, Trash2, Download, AlertTriangle } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useToast } from '@/components/ToastProvider'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

export default function SettingsPage() {
  const { theme, toggle } = useTheme()
  const { toast } = useToast()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleExport() {
    const jobs = await apiClient.getJobs()
    const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smart-job-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Data exported successfully')
  }

  async function handleDeleteAll() {
    setDeleting(true)
    try {
      const jobs = await apiClient.getJobs() as { id: string }[]
      await Promise.all(jobs.map((j) => apiClient.deleteJob(j.id)))
      toast('All data deleted')
      setConfirming(false)
      router.refresh()
    } catch {
      toast('Failed to delete', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Preferences and data management</p>
      </div>

      {/* Appearance */}
      <div className="card p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Currently using {theme} mode
            </p>
          </div>
          <button onClick={toggle} className="btn-secondary">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            Switch to {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* Data */}
      <div className="card p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold">Data Management</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Export Data</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Download all your job applications as JSON</p>
          </div>
          <button onClick={handleExport} className="btn-secondary">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-red-600">Delete All Data</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Permanently delete all applications and their data</p>
            </div>
            <button onClick={() => setConfirming(true)} className="btn-danger shrink-0">
              <Trash2 className="w-4 h-4" /> Delete All
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card p-5 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold">About</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Smart Job Tracker — A full-stack job application tracking tool with AI-powered insights.
        </p>
        <p className="text-xs text-slate-400">Built with Next.js 15 · Prisma · SQLite · Claude AI</p>
      </div>

      {/* Confirm delete modal */}
      {confirming && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Delete all data?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                This will permanently delete all your job applications, interviews, and activity. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(false)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={handleDeleteAll} disabled={deleting} className="btn-danger flex-1 justify-center">
                {deleting ? 'Deleting…' : 'Yes, delete all'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
