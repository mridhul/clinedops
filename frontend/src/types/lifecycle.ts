export type StudentListItem = {
  id: string
  student_code: string
  email: string
  full_name: string | null
  discipline: string
  institution: string | null
  lifecycle_status: string
  academic_cycle_id: string | null
  department_id: string | null
  is_active: boolean
}

export type StudentListResponse = {
  items: StudentListItem[]
  total: number
  limit: number
  offset: number
}

export type StudentDetail = {
  id: string
  student_code: string
  email: string
  full_name: string | null
  discipline: string
  institution: string | null
  lifecycle_status: string
  academic_cycle_id: string | null
  department_id: string | null
  is_active: boolean
  teaching_hours_total: number
  posting_history: Array<{
    id: string
    title: string
    status: string
    start_date: string | null
    end_date: string | null
    department_id: string
    created_at: string
  }>
  feedback_recent: Array<{
    id: string
    template_id: string
    status: string
    created_at: string
  }>
}

export type TutorListItem = {
  id: string
  user_id: string
  tutor_code: string
  email: string
  full_name: string | null
  discipline: string
  department_id: string | null
  academic_cycle_id: string | null
  is_active: boolean
}

export type TutorListResponse = {
  items: TutorListItem[]
  total: number
  limit: number
  offset: number
}

export type TutorDetail = {
  id: string
  user_id: string
  tutor_code: string
  email: string
  full_name: string | null
  discipline: string
  department_id: string | null
  academic_cycle_id: string | null
  is_active: boolean
  teaching_sessions_count: number
}

export type PostingOut = {
  id: string
  title: string
  student_id: string
  academic_cycle_id: string
  department_id: string
  discipline: string
  status: string
  start_date: string | null
  end_date: string | null
  tutor_ids: string[]
  created_at: string
}

export type PostingListResponse = {
  items: PostingOut[]
  total: number
  limit: number
  offset: number
}

export type AcademicCycleOut = {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  is_active: boolean
}

export type AcademicCycleListResponse = {
  items: AcademicCycleOut[]
  total: number
  limit: number
  offset: number
}

export type DepartmentOut = {
  id: string
  name: string
  discipline: string
  head_user_id: string | null
  is_active: boolean
}

export type DepartmentListResponse = {
  items: DepartmentOut[]
  total: number
  limit: number
  offset: number
}
