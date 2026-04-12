export type JobStatus = 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected'
export type JobPriority = 'low' | 'medium' | 'high'
export type InterviewType = 'phone' | 'technical' | 'behavioral' | 'panel' | 'final' | 'offer'
export type InterviewOutcome = 'pending' | 'passed' | 'failed'
export type ActivityType = 'status_change' | 'note_added' | 'interview_scheduled' | 'ai_analyzed' | 'document_added' | 'created'
export type DocumentType = 'resume' | 'cover_letter' | 'portfolio' | 'other'

export interface Job {
  id: string
  company: string
  role: string
  status: JobStatus
  priority: JobPriority
  jobUrl: string | null
  location: string | null
  salary: string | null
  notes: string | null
  aiSuggestion: string | null
  coverLetter: string | null
  dateApplied: string
  deadline: string | null
  createdAt: string
  updatedAt: string
  interviews?: Interview[]
  activities?: Activity[]
  documents?: Document[]
}

export interface Interview {
  id: string
  jobId: string
  type: InterviewType
  scheduledAt: string
  notes: string | null
  outcome: InterviewOutcome
  createdAt: string
}

export interface Activity {
  id: string
  jobId: string
  type: ActivityType
  message: string
  createdAt: string
  job?: { company: string; role: string }
}

export interface Document {
  id: string
  jobId: string
  name: string
  type: DocumentType
  content: string
  createdAt: string
}

export interface Stats {
  total: number
  saved: number
  applied: number
  interviewing: number
  offered: number
  rejected: number
  responseRate: number
  interviewRate: number
}

export const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string; border: string }> = {
  saved:        { label: 'Saved',        color: 'text-gray-600 dark:text-gray-300',    bg: 'bg-gray-100 dark:bg-gray-700',   border: 'border-gray-200 dark:border-gray-600' },
  applied:      { label: 'Applied',      color: 'text-blue-700 dark:text-blue-300',   bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-700' },
  interviewing: { label: 'Interviewing', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-700' },
  offered:      { label: 'Offered',      color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-700' },
  rejected:     { label: 'Rejected',     color: 'text-red-700 dark:text-red-300',     bg: 'bg-red-50 dark:bg-red-900/30',   border: 'border-red-200 dark:border-red-700' },
}

export const PRIORITY_CONFIG: Record<JobPriority, { label: string; color: string; dot: string }> = {
  low:    { label: 'Low',    color: 'text-gray-500', dot: 'bg-gray-400' },
  medium: { label: 'Medium', color: 'text-yellow-600', dot: 'bg-yellow-400' },
  high:   { label: 'High',   color: 'text-red-600', dot: 'bg-red-500' },
}

export const JOB_STATUSES: JobStatus[] = ['saved', 'applied', 'interviewing', 'offered', 'rejected']
export const JOB_PRIORITIES: JobPriority[] = ['low', 'medium', 'high']
export const INTERVIEW_TYPES: InterviewType[] = ['phone', 'technical', 'behavioral', 'panel', 'final', 'offer']
