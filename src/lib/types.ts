// ── Status & Priority ─────────────────────────────────────────────────────────

export type JobStatus = 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'ghosted' | 'withdrawn'
export type JobPriority = 'low' | 'medium' | 'high'
export type InterviewType = 'phone' | 'technical' | 'behavioral' | 'panel' | 'final' | 'offer' | 'system-design' | 'take-home' | 'hr' | 'culture'
export type InterviewOutcome = 'pending' | 'passed' | 'failed' | 'scheduled' | 'cancelled'
export type ActivityType = 'status_change' | 'note_added' | 'interview_scheduled' | 'ai_analyzed' | 'document_added' | 'created' | 'contact_added' | 'task_added' | 'email'
export type DocumentType = 'resume' | 'cover_letter' | 'portfolio' | 'reference' | 'take_home' | 'other'
export type ContactRelationship = 'recruiter' | 'hiring-manager' | 'interviewer' | 'employee' | 'referral' | 'other'
export type EmailTemplateType = 'follow_up' | 'thank_you' | 'withdraw' | 'counter_offer' | 'networking'

// ── Core Models ───────────────────────────────────────────────────────────────

export interface Job {
  id: string
  company: string
  role: string
  status: JobStatus
  priority: JobPriority
  excitement: number | null
  jobUrl: string | null
  jobDescription: string | null
  salary: string | null
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  location: string | null
  remote: boolean
  hybrid: boolean
  notes: string | null
  aiSuggestion: string | null
  aiScore: number | null
  aiStrengths: string | null
  aiRisks: string | null
  aiNextSteps: string | null
  coverLetter: string | null
  resumeVersion: string | null
  source: string | null
  referralContact: string | null
  recruiterName: string | null
  recruiterEmail: string | null
  companySize: string | null
  industry: string | null
  techStack: string | null
  benefits: string | null
  visaSponsorship: boolean
  dateApplied: string
  deadline: string | null
  followUpDate: string | null
  lastContactDate: string | null
  offerDeadline: string | null
  offerAmount: string | null
  rejectionReason: string | null
  pinned: boolean
  archived: boolean
  tags: string | null
  createdAt: string
  updatedAt: string
  // Relations
  interviews?: Interview[]
  activities?: Activity[]
  documents?: Document[]
  contacts?: Contact[]
  tasks?: Task[]
  salaryNegotiations?: SalaryNegotiation[]
}

export interface Interview {
  id: string
  jobId: string
  round: number
  type: string
  scheduledAt: string
  duration: number | null
  interviewers: string | null
  platform: string | null
  location: string | null
  notes: string | null
  prepNotes: string | null
  questionsAsked: string | null
  outcome: string
  feedbackReceived: string | null
  createdAt: string
  updatedAt?: string
}

export interface Activity {
  id: string
  jobId: string
  type: string
  message: string
  metadata?: string | null
  createdAt: string
  job?: { company: string; role: string } | null
}

export interface Document {
  id: string
  jobId: string
  name: string
  type: string
  content: string
  version: string | null
  isActive: boolean
  createdAt: string
}

export interface Contact {
  id: string
  jobId: string
  name: string
  title: string | null
  email: string | null
  phone: string | null
  linkedin: string | null
  relationship: string
  notes: string | null
  lastContact: string | null
  createdAt: string
}

export interface Task {
  id: string
  jobId: string
  title: string
  description: string | null
  dueDate: string | null
  completed: boolean
  completedAt: string | null
  priority: string
  createdAt: string
  job?: { company: string; role: string }
}

export interface SalaryNegotiation {
  id: string
  jobId: string
  round: number
  theirOffer: string | null
  myCounter: string | null
  notes: string | null
  outcome: string | null
  date: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  linkedin: string
  github: string
  portfolio: string
  currentTitle: string
  yearsExperience: number
  targetRoles: string
  targetSalaryMin: number
  targetSalaryMax: number
  currency: string
  skills: string
  bio: string
  weeklyGoal: number
  defaultSource: string
  timezone: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: string
  isDefault: boolean
  useCount: number
  createdAt: string
  updatedAt: string
}

export interface Stats {
  total: number
  saved: number
  applied: number
  interviewing: number
  offered: number
  rejected: number
  ghosted: number
  withdrawn: number
  responseRate: number
  interviewRate: number
  monthly: { month: string; count: number }[]
}

// ── Display configs ───────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<JobStatus, {
  label: string; color: string; bg: string; border: string; dot: string
}> = {
  saved:        { label: 'Saved',        color: 'text-slate-600 dark:text-slate-300',    bg: 'bg-slate-100 dark:bg-slate-700/60',     border: 'border-slate-200 dark:border-slate-600', dot: 'bg-slate-400' },
  applied:      { label: 'Applied',      color: 'text-blue-700 dark:text-blue-300',      bg: 'bg-blue-50 dark:bg-blue-900/30',        border: 'border-blue-200 dark:border-blue-700',   dot: 'bg-blue-500' },
  interviewing: { label: 'Interviewing', color: 'text-amber-700 dark:text-amber-300',    bg: 'bg-amber-50 dark:bg-amber-900/30',      border: 'border-amber-200 dark:border-amber-700', dot: 'bg-amber-500' },
  offered:      { label: 'Offered',      color: 'text-emerald-700 dark:text-emerald-300',bg: 'bg-emerald-50 dark:bg-emerald-900/30',  border: 'border-emerald-200 dark:border-emerald-700', dot: 'bg-emerald-500' },
  rejected:     { label: 'Rejected',     color: 'text-red-700 dark:text-red-300',        bg: 'bg-red-50 dark:bg-red-900/30',          border: 'border-red-200 dark:border-red-700',     dot: 'bg-red-500' },
  ghosted:      { label: 'Ghosted',      color: 'text-purple-700 dark:text-purple-300',  bg: 'bg-purple-50 dark:bg-purple-900/30',    border: 'border-purple-200 dark:border-purple-700', dot: 'bg-purple-500' },
  withdrawn:    { label: 'Withdrawn',    color: 'text-gray-600 dark:text-gray-300',      bg: 'bg-gray-100 dark:bg-gray-700/60',       border: 'border-gray-200 dark:border-gray-600',   dot: 'bg-gray-400' },
}

export const PRIORITY_CONFIG: Record<JobPriority, { label: string; color: string; dot: string; bg: string }> = {
  high:   { label: 'High',   color: 'text-red-600 dark:text-red-400',    dot: 'bg-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  low:    { label: 'Low',    color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
}

export const JOB_STATUSES: JobStatus[] = ['saved', 'applied', 'interviewing', 'offered', 'rejected', 'ghosted', 'withdrawn']
export const JOB_PRIORITIES: JobPriority[] = ['high', 'medium', 'low']
export const INTERVIEW_TYPES: InterviewType[] = ['phone', 'hr', 'technical', 'system-design', 'behavioral', 'culture', 'panel', 'take-home', 'final', 'offer']

export const SOURCE_OPTIONS = ['LinkedIn', 'Indeed', 'Glassdoor', 'Company Site', 'Referral', 'Cold Apply', 'Recruiter', 'GitHub Jobs', 'AngelList', 'Other']
export const COMPANY_SIZE_OPTIONS = ['Startup (<50)', 'Small (50-200)', 'Medium (200-1000)', 'Large (1000-5000)', 'Enterprise (5000+)']
export const CURRENCY_OPTIONS = ['CAD', 'USD', 'GBP', 'EUR', 'AUD']
export const RELATIONSHIP_OPTIONS: ContactRelationship[] = ['recruiter', 'hiring-manager', 'interviewer', 'employee', 'referral', 'other']
export const EMAIL_TEMPLATE_TYPES: { value: EmailTemplateType; label: string }[] = [
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'thank_you', label: 'Thank You' },
  { value: 'withdraw', label: 'Withdraw' },
  { value: 'counter_offer', label: 'Counter Offer' },
  { value: 'networking', label: 'Networking' },
]
