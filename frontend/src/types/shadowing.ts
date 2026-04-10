export interface ShadowingApplicationBase {
  discipline: string
  reason?: string
}

export interface ShadowingApplicationCreate extends ShadowingApplicationBase {}

export interface MentorAssignmentOut {
  id: string
  mentor_user_id: string
  status: string
  notes?: string
  created_at: string
}

export interface ShadowingApplicationOut extends ShadowingApplicationBase {
  id: string
  student_id: string
  status: string
  admin_notes?: string
  created_at: string
  assignments: MentorAssignmentOut[]
}

export interface ShadowingApplicationUpdate {
  status?: 'pending' | 'shortlisted' | 'rejected'
  admin_notes?: string
}

export interface MentorAssignmentCreate {
  mentor_user_id: string
  notes?: string
}
