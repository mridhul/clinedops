export type Role = 'super_admin' | 'programme_admin' | 'supervisor' | 'tutor' | 'student'

export type Discipline = 'medicine' | 'allied_health' | 'nursing' | 'training'

export type MeResponse = {
  id: string
  email: string
  full_name: string | null
  role: Role
  discipline: Discipline | null
}

