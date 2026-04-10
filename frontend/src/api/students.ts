import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiFetch, apiPostForm } from './client'
import type { StudentDetail, StudentListResponse } from '../types/lifecycle'

export function useStudentsList(
  accessToken: string | null,
  params: {
    discipline?: string
    institution?: string
    lifecycle_status?: string
    academic_cycle_id?: string
    department_id?: string
    status?: string
    limit?: number
    offset?: number
  },
) {
  const qs = new URLSearchParams()
  if (params.discipline) qs.set('discipline', params.discipline)
  if (params.institution) qs.set('institution', params.institution)
  if (params.lifecycle_status) qs.set('lifecycle_status', params.lifecycle_status)
  if (params.academic_cycle_id) qs.set('academic_cycle_id', params.academic_cycle_id)
  if (params.department_id) qs.set('department_id', params.department_id)
  if (params.status) qs.set('status', params.status)
  qs.set('limit', String(params.limit ?? 50))
  qs.set('offset', String(params.offset ?? 0))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''

  return useQuery({
    queryKey: ['students', accessToken, suffix],
    queryFn: () => apiFetch<StudentListResponse>(`/students${suffix}`, { accessToken }),
    enabled: Boolean(accessToken),
  })
}

export function useStudentDetail(accessToken: string | null, id: string | undefined) {
  return useQuery({
    queryKey: ['students', id, accessToken],
    queryFn: () => apiFetch<StudentDetail>(`/students/${id}`, { accessToken }),
    enabled: Boolean(accessToken && id),
  })
}

export function useCreateStudent(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<StudentDetail>('/students', { method: 'POST', body, accessToken }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function useUpdateStudent(accessToken: string | null, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<StudentDetail>(`/students/${id}`, { method: 'PATCH', body, accessToken }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['students'] })
      void qc.invalidateQueries({ queryKey: ['students', id] })
    },
  })
}

export function useDeleteStudent(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/students/${id}`, { method: 'DELETE', accessToken }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['students'] })
    },
  })
}

export function useStudentBatchImport(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { file: File; mapping: Record<string, string>; dryRun: boolean; defaultPassword: string }) => {
      const fd = new FormData()
      fd.append('file', vars.file)
      fd.append('mapping', JSON.stringify(vars.mapping))
      fd.append('dry_run', String(vars.dryRun))
      fd.append('default_password', vars.defaultPassword)
      return apiPostForm<Record<string, unknown>>('/students/batch', fd, accessToken)
    },
    onSuccess: (_d, vars) => {
      if (!vars.dryRun) {
        void qc.invalidateQueries({ queryKey: ['students'] })
      }
    },
  })
}
