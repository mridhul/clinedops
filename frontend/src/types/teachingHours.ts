export type SessionType = 'scheduled' | 'ad_hoc' | 'consultation'
export type SessionApprovalStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface AnomalyFlag {
  type: string
  detail: string
}

export interface SessionStudentOut {
  id: string
  student_id: string
  attendance_confirmed_at: string | null
}

export interface TeachingSessionOut {
  id: string
  posting_id: string
  tutor_id: string
  starts_at: string
  duration_minutes: number | null
  session_type: SessionType | null
  department_id: string | null
  discipline: string | null
  description: string | null
  approval_status: SessionApprovalStatus
  submitted_at: string | null
  approved_at: string | null
  approved_by: string | null
  rejected_at: string | null
  rejected_by: string | null
  rejection_reason: string | null
  anomaly_flags: AnomalyFlag[]
  is_flagged: boolean
  billable_minutes: number | null
  billable_amount: string | null
  session_students: SessionStudentOut[]
  created_at: string
}

export interface SessionListResponse {
  items: TeachingSessionOut[]
  total: number
  limit: number
  offset: number
}

export interface SessionCreate {
  posting_id: string
  starts_at: string
  session_type: SessionType
  duration_minutes: number
  department_id?: string
  student_ids: string[]
  description?: string
}

export interface BulkSessionCreate {
  posting_id: string
  session_type: SessionType
  duration_minutes: number
  department_id?: string
  student_ids: string[]
  description?: string
  start_date: string
  end_date: string
  days_of_week: string[]
  start_time: string
}

export interface SessionUpdate {
  session_type?: SessionType
  duration_minutes?: number
  starts_at?: string
  department_id?: string
  description?: string
  student_ids?: string[]
}

export interface SessionRejectPayload {
  reason: string
}

export interface TutorBillableRateOut {
  id: string
  tutor_id: string
  rate_per_hour: string
  currency: string
  effective_from: string
  effective_to: string | null
  is_active: boolean
  created_at: string
}

export interface TutorBillableRateCreate {
  rate_per_hour: string
  currency: string
  effective_from: string
  effective_to?: string
}

export interface DashboardBar {
  label: string
  total_minutes: number
  session_count: number
}

export interface DashboardOut {
  bars: DashboardBar[]
  total_minutes: number
  total_sessions: number
  approved_sessions: number
}
