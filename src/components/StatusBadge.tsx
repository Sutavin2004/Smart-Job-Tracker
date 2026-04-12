import { cn } from '@/lib/utils'
import { type JobStatus, type JobPriority, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/types'

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as JobStatus] ?? STATUS_CONFIG.saved
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      config.bg, config.color, config.border
    )}>
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
