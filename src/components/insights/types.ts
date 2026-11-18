export interface InsightItem {
  dim: string
  group: string
  direction: 'better' | 'worse'
  rate: number
  otherRate: number
  n: number
  replies: number
  interviews: number
  headline: string
  detail: string
  action: string
}

export interface InsightsData {
  applied: number
  resolved: number
  pending: number
  replies: number
  interviews: number
  replyRate: number
  interviewRate: number
  medianDaysToReply: number | null
  needed: number
  ready: boolean
  insights: InsightItem[]
  comparisons: { dim: string; title: string; groups: { label: string; n: number; replies: number; interviews: number; rate: number }[] }[]
  checkIns: { id: string; company: string; role: string; dateApplied: string }[]
}

export const pct = (r: number) => `${Math.round(r * 100)}%`
