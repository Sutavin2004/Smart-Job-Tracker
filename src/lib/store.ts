/**
 * Zustand UI state store.
 * Manages ephemeral UI state: sidebar collapse, active job, modals, filters, view mode.
 * Persisted data (jobs, interviews, etc.) lives in local-store.ts / api-client.ts.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { JobStatus, JobPriority } from './types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type JobView = 'kanban' | 'table' | 'list'

export interface JobFilters {
  status: JobStatus | 'all'
  priority: JobPriority | 'all'
  search: string
  source: string
  remote: boolean | null
  pinned: boolean
  tags: string
}

export interface UIStore {
  // Layout
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void

  // Active job detail panel
  activeJobId: string | null
  setActiveJobId: (id: string | null) => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (v: boolean) => void
  toggleCommandPalette: () => void

  // Modals
  addJobModalOpen: boolean
  setAddJobModalOpen: (v: boolean) => void

  editJobId: string | null
  setEditJobId: (id: string | null) => void

  coverLetterJobId: string | null
  setCoverLetterJobId: (id: string | null) => void

  interviewPrepJobId: string | null
  setInterviewPrepJobId: (id: string | null) => void

  emailJobId: string | null
  setEmailJobId: (id: string | null) => void

  resumeAnalyzerJobId: string | null
  setResumeAnalyzerJobId: (id: string | null) => void

  salaryJobId: string | null
  setSalaryJobId: (id: string | null) => void

  // Jobs view
  jobView: JobView
  setJobView: (v: JobView) => void

  jobFilters: JobFilters
  setJobFilters: (f: Partial<JobFilters>) => void
  resetJobFilters: () => void

  // Weekly goal (also in UserProfile but cached here for dashboard)
  weeklyGoal: number
  setWeeklyGoal: (n: number) => void

  // Bulk selection
  selectedJobIds: string[]
  setSelectedJobIds: (ids: string[]) => void
  toggleJobSelection: (id: string) => void
  clearJobSelection: () => void
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: JobFilters = {
  status: 'all',
  priority: 'all',
  search: '',
  source: '',
  remote: null,
  pinned: false,
  tags: '',
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Layout
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // Active job
      activeJobId: null,
      setActiveJobId: (id) => set({ activeJobId: id }),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
      toggleCommandPalette: () => set(s => ({ commandPaletteOpen: !s.commandPaletteOpen })),

      // Modals
      addJobModalOpen: false,
      setAddJobModalOpen: (v) => set({ addJobModalOpen: v }),

      editJobId: null,
      setEditJobId: (id) => set({ editJobId: id }),

      coverLetterJobId: null,
      setCoverLetterJobId: (id) => set({ coverLetterJobId: id }),

      interviewPrepJobId: null,
      setInterviewPrepJobId: (id) => set({ interviewPrepJobId: id }),

      emailJobId: null,
      setEmailJobId: (id) => set({ emailJobId: id }),

      resumeAnalyzerJobId: null,
      setResumeAnalyzerJobId: (id) => set({ resumeAnalyzerJobId: id }),

      salaryJobId: null,
      setSalaryJobId: (id) => set({ salaryJobId: id }),

      // View
      jobView: 'kanban',
      setJobView: (v) => set({ jobView: v }),

      jobFilters: { ...DEFAULT_FILTERS },
      setJobFilters: (f) => set(s => ({ jobFilters: { ...s.jobFilters, ...f } })),
      resetJobFilters: () => set({ jobFilters: { ...DEFAULT_FILTERS } }),

      // Weekly goal
      weeklyGoal: 5,
      setWeeklyGoal: (n) => set({ weeklyGoal: n }),

      // Bulk selection
      selectedJobIds: [],
      setSelectedJobIds: (ids) => set({ selectedJobIds: ids }),
      toggleJobSelection: (id) => {
        const ids = get().selectedJobIds
        set({ selectedJobIds: ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id] })
      },
      clearJobSelection: () => set({ selectedJobIds: [] }),
    }),
    {
      name: 'sjt_ui',
      // Only persist layout & view preferences, not transient modal state
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        jobView: s.jobView,
        weeklyGoal: s.weeklyGoal,
      }),
    }
  )
)
