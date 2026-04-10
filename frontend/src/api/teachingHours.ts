import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import type {
  BulkSessionCreate,
  DashboardOut,
  SessionCreate,
  SessionListResponse,
  SessionRejectPayload,
  SessionUpdate,
  TeachingSessionOut,
  TutorBillableRateCreate,
  TutorBillableRateOut,
} from '../types/teachingHours'
import { apiFetch } from './client'
import { useAuth } from '../auth/useAuth'

// The shared apiFetch automatically includes the token from useAuth.getState().accessToken
// and handles base URL from import.meta.env.VITE_API_BASE_URL.

// ── List sessions ─────────────────────────────────────────────────────────────

export interface SessionFilters {
  discipline?: string
  department_id?: string
  status?: string
  tutor_id?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export function useTeachingSessions(filters: SessionFilters = {}) {
  const params = new URLSearchParams()
  if (filters.discipline) params.set('discipline', filters.discipline)
  if (filters.department_id) params.set('department_id', filters.department_id)
  if (filters.status) params.set('status', filters.status)
  if (filters.tutor_id) params.set('tutor_id', filters.tutor_id)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.offset) params.set('offset', String(filters.offset))

  return useQuery<SessionListResponse>({
    queryKey: ['teaching-sessions', filters],
    queryFn: () => apiFetch<SessionListResponse>(`/teaching-sessions?${params}`),
  })
}

// ── Single session ────────────────────────────────────────────────────────────

export function useTeachingSession(id: string | undefined) {
  return useQuery<TeachingSessionOut>({
    queryKey: ['teaching-session', id],
    queryFn: () => apiFetch<TeachingSessionOut>(`/teaching-sessions/${id}`),
    enabled: !!id,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation<TeachingSessionOut, Error, SessionCreate>({
    mutationFn: (payload) =>
      apiFetch<TeachingSessionOut>('/teaching-sessions', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teaching-sessions'] })
      message.success('Session saved as draft')
    },
    onError: (e) => message.error(e.message),
  })
}

export function useBulkCreateSessions() {
  const qc = useQueryClient()
  return useMutation<TeachingSessionOut[], Error, BulkSessionCreate>({
    mutationFn: (payload) =>
      apiFetch<TeachingSessionOut[]>('/teaching-sessions/bulk', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['teaching-sessions'] })
      message.success(`${data.length} sessions created`)
    },
    onError: (e) => message.error(e.message),
  })
}

export function useUpdateSession(id: string) {
  const qc = useQueryClient()
  return useMutation<TeachingSessionOut, Error, SessionUpdate>({
    mutationFn: (payload) =>
      apiFetch<TeachingSessionOut>(`/teaching-sessions/${id}`, {
        method: 'PATCH',
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teaching-sessions'] })
      qc.invalidateQueries({ queryKey: ['teaching-session', id] })
      message.success('Session updated')
    },
    onError: (e) => message.error(e.message),
  })
}

export function useSubmitSession() {
  const qc = useQueryClient()
  return useMutation<TeachingSessionOut, Error, string>({
    mutationFn: (id) =>
      apiFetch<TeachingSessionOut>(`/teaching-sessions/${id}/submit`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teaching-sessions'] })
      message.success('Session submitted for approval')
    },
    onError: (e) => message.error(e.message),
  })
}

export function useApproveSession() {
  const qc = useQueryClient()
  return useMutation<TeachingSessionOut, Error, string>({
    mutationFn: (id) =>
      apiFetch<TeachingSessionOut>(`/teaching-sessions/${id}/approve`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teaching-sessions'] })
      message.success('Session approved')
    },
    onError: (e) => message.error(e.message),
  })
}

export function useRejectSession() {
  const qc = useQueryClient()
  return useMutation<TeachingSessionOut, Error, { id: string; payload: SessionRejectPayload }>({
    mutationFn: ({ id, payload }) =>
      apiFetch<TeachingSessionOut>(`/teaching-sessions/${id}/reject`, {
        method: 'POST',
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teaching-sessions'] })
      message.success('Session rejected')
    },
    onError: (e) => message.error(e.message),
  })
}

export function useConfirmAttendance() {
  const qc = useQueryClient()
  return useMutation<TeachingSessionOut, Error, string>({
    mutationFn: (id) =>
      apiFetch<TeachingSessionOut>(`/teaching-sessions/${id}/confirm-attendance`, {
        method: 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teaching-sessions'] })
      message.success('Attendance confirmed')
    },
    onError: (e) => message.error(e.message),
  })
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardFilters {
  group_by?: 'tutor' | 'department'
  discipline?: string
  department_id?: string
  date_from?: string
  date_to?: string
}

export function useDashboardData(filters: DashboardFilters = {}) {
  const params = new URLSearchParams()
  if (filters.group_by) params.set('group_by', filters.group_by)
  if (filters.discipline) params.set('discipline', filters.discipline)
  if (filters.department_id) params.set('department_id', filters.department_id)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)

  return useQuery<DashboardOut>({
    queryKey: ['teaching-hours-dashboard', filters],
    queryFn: () => apiFetch<DashboardOut>(`/teaching-hours/dashboard?${params}`),
  })
}

export async function downloadExport(filters: Omit<DashboardFilters, 'group_by'>): Promise<void> {
  const token = useAuth.getState().accessToken
  const params = new URLSearchParams()
  if (filters.discipline) params.set('discipline', filters.discipline)
  if (filters.department_id) params.set('department_id', filters.department_id)
  if (filters.date_from) params.set('date_from', filters.date_from)
  if (filters.date_to) params.set('date_to', filters.date_to)

  const res = await fetch(`/api/v1/teaching-hours/export?${params}`, {
    credentials: 'include',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'teaching_hours_export.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Billable rates ────────────────────────────────────────────────────────────

export function useBillableRates(tutorId: string | undefined) {
  return useQuery<TutorBillableRateOut[]>({
    queryKey: ['billable-rates', tutorId],
    queryFn: () => apiFetch<TutorBillableRateOut[]>(`/tutors/${tutorId}/billable-rates`),
    enabled: !!tutorId,
  })
}

export function useCreateBillableRate(tutorId: string) {
  const qc = useQueryClient()
  return useMutation<TutorBillableRateOut, Error, TutorBillableRateCreate>({
    mutationFn: (payload) =>
      apiFetch<TutorBillableRateOut>(`/tutors/${tutorId}/billable-rates`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billable-rates', tutorId] })
      message.success('Billable rate created')
    },
    onError: (e) => message.error(e.message),
  })
}
