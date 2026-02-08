// Keep in sync with backend ApplicationStatus enum
export type ApplicationStatus =
  | "draft"
  | "applied"
  | "recruiter_screen"
  | "interview"
  | "offer"
  | "rejected"
  | "ghosted"
  | "withdrawn";

export interface JobApplication {
  id: string;
  company_name: string;
  job_title: string;
  job_location?: string | null;
  job_url?: string | null;
  current_status: ApplicationStatus;
  applied_at?: string | null; // ISO date
  notes?: string | null;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface Paginated<T> {
  total: number;
  items: T[];
}

export interface TimeToResponseStats {
  average_days: number | null;
  sample_size: number;
}

export interface BestDayStat {
  weekday: number;
  weekday_name: string;
  total_applications: number;
  responded_applications: number;
  response_rate: number;
}

export interface AnalyticsOverview {
  total_applications: number;
  responded_applications: number;
  response_rate: number;
  interview_applications: number;
  interview_conversion_rate: number;
  time_to_response: TimeToResponseStats;
  best_days: BestDayStat[];
}

export interface ResumePerformanceEntry {
  resume_id: string;
  resume_name: string;
  created_at: string; // ISO date
  total_applications: number;
  responded_applications: number;
  response_rate: number;
  interview_applications: number;
  interview_rate: number;
}

export interface ResumePerformanceResponse {
  items: ResumePerformanceEntry[];
}
