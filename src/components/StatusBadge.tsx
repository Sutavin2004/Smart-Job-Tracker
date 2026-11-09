import { cn } from '@/lib/utils'
import { type JobStatus, type JobPriority, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/types'

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as JobStatus] ?? STATUS_CONFIG.saved
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300">
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority as JobPriority] ?? PRIORITY_CONFIG.medium
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', config.color)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}
