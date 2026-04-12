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
  company: string;
  role: string;
  job_location?: string | null;
  job_url?: string | null;
  current_status: ApplicationStatus;
  applied_at?: string | null; // ISO date
  notes?: string | null;
  ai_suggestion?: string | null;
  resume_version_id?: string | null;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface ApplicationCreate {
  company: string;
  role: string;
  job_location?: string;
  job_url?: string;
  status?: ApplicationStatus;
  applied_at?: string;
  notes?: string;
}

export interface ApplicationUpdate {
  company?: string;
  role?: string;
  job_location?: string;
  job_url?: string;
  current_status?: ApplicationStatus;
  applied_at?: string;
  notes?: string;
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
  created_at: string;
  total_applications: number;
  responded_applications: number;
  response_rate: number;
  interview_applications: number;
  interview_rate: number;
}

export interface ResumePerformanceResponse {
  items: ResumePerformanceEntry[];
}
