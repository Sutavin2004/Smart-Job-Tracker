export type JobStatus = 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'ghosted' | 'withdrawn'
export type JobPriority = 'low' | 'medium' | 'high'
export type InterviewType = 'phone' | 'technical' | 'behavioral' | 'panel' | 'final' | 'offer' | 'system-design' | 'take-home' | 'hr' | 'culture'
export type InterviewOutcome = 'pending' | 'passed' | 'failed' | 'scheduled' | 'cancelled'
export type ActivityType = 'status_change' | 'note_added' | 'interview_scheduled' | 'ai_analyzed' | 'document_added' | 'created' | 'contact_added' | 'task_added' | 'email' | 'agent'
export type DocumentType = 'resume' | 'cover_letter' | 'portfolio' | 'reference' | 'take_home' | 'other'
export type ContactRelationship = 'recruiter' | 'hiring-manager' | 'interviewer' | 'employee' | 'referral' | 'other'
export type EmailTemplateType = 'follow_up' | 'thank_you' | 'withdraw' | 'counter_offer' | 'networking' | 'cold_outreach'

export interface Job {
  id: string
  company: string
  role: string
  status: JobStatus
  priority: JobPriority
  excitement: number | null
  pinned: boolean
  archived: boolean
  color: string | null
  tags: string | null
  jobUrl: string | null
  jobDescription: string | null
  parsedKeywords: string | null
  parsedTechStack: string | null
  location: string | null
  remote: boolean
  hybrid: boolean
  salary: string | null
  salaryRaw: string | null
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  companySize: string | null
  companyStage: string | null
  industry: string | null
  benefits: string | null
  visaSponsorship: boolean
  source: string | null
  referralContact: string | null
  resumeVersion: string | null
  dateApplied: string
  deadline: string | null
  followUpDate: string | null
  lastContactDate: string | null
  recruiterName: string | null
  recruiterEmail: string | null
  recruiterPhone: string | null
  offerDeadline: string | null
  offerAmount: string | null
  rejectionReason: string | null
  notes: string | null
  aiSuggestion: string | null
  aiScore: number | null
  aiStrengths: string | null
  aiRisks: string | null
  aiNextSteps: string | null
  aiKeySkills: string | null
  aiSalaryInsight: string | null
  aiCultureFit: string | null
  aiLastAnalyzed: string | null
  discoveredBy: string | null
  agentSessionId: string | null
  agentNotes: string | null
  coverLetter: string | null
  techStack: string | null
  createdAt: string
  updatedAt: string
  interviews?: Interview[]
  activities?: Activity[]
  documents?: Document[]
  contacts?: Contact[]
  tasks?: Task[]
  salaryNegotiations?: SalaryNegotiation[]
  applicationQAs?: ApplicationQA[]
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
  myQuestions: string | null
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

export interface ApplicationQA {
  id: string
  jobId: string
  question: string
  answer: string
  approved: boolean
  createdAt: string
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
  education: string
  bio: string
  masterResume: string
  jobSearchGoals: string
  preferRemote: boolean
  preferHybrid: boolean
  targetLocations: string
  excludeKeywords: string
  weeklyGoal: number
  defaultSource: string
  timezone: string
  autoDiscover?: boolean
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

export interface AgentSession {
  id: string
  status: string
  trigger?: string
  searchQueries: string | null
  jobsFound: number
  jobsAdded: number
  jobsFiltered: number
  log: string | null
  error: string | null
  startedAt: string
  completedAt: string | null
}

export const STATUS_CONFIG: Record<JobStatus, {
  label: string; color: string; bg: string; border: string; dot: string
}> = {
  saved:        { label: 'Saved',        color: 'text-slate-600 dark:text-slate-300',     bg: 'bg-slate-100 dark:bg-slate-700/60',     border: 'border-slate-200 dark:border-slate-600', dot: 'bg-slate-400' },
  applied:      { label: 'Applied',      color: 'text-sky-800 dark:text-sky-300',         bg: 'bg-sky-50 dark:bg-sky-900/30',          border: 'border-sky-200 dark:border-sky-800',     dot: 'bg-sky-600' },
  interviewing: { label: 'Interviewing', color: 'text-amber-700 dark:text-amber-300',     bg: 'bg-amber-50 dark:bg-amber-900/30',      border: 'border-amber-200 dark:border-amber-700', dot: 'bg-amber-500' },
  offered:      { label: 'Offered',      color: 'text-brand-700 dark:text-brand-300',     bg: 'bg-brand-50 dark:bg-brand-900/40',      border: 'border-brand-200 dark:border-brand-800', dot: 'bg-brand-500' },
  rejected:     { label: 'Rejected',     color: 'text-red-700 dark:text-red-300',         bg: 'bg-red-50 dark:bg-red-900/30',          border: 'border-red-200 dark:border-red-700',     dot: 'bg-red-500' },
  ghosted:      { label: 'Ghosted',      color: 'text-stone-600 dark:text-stone-300',     bg: 'bg-stone-100 dark:bg-stone-800/60',     border: 'border-stone-200 dark:border-stone-700', dot: 'bg-stone-400' },
  withdrawn:    { label: 'Withdrawn',    color: 'text-slate-500 dark:text-slate-400',     bg: 'bg-slate-100 dark:bg-slate-800/60',     border: 'border-slate-200 dark:border-slate-700', dot: 'bg-slate-300 dark:bg-slate-600' },
}

export const PRIORITY_CONFIG: Record<JobPriority, { label: string; color: string; dot: string; bg: string }> = {
  high:   { label: 'High',   color: 'text-red-600 dark:text-red-400',        dot: 'bg-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400',    dot: 'bg-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
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
  { value: 'cold_outreach', label: 'Cold Outreach' },
]
