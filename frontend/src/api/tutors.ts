import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiFetch, apiPostForm } from './client'
import type { TutorDetail, TutorListResponse } from '../types/lifecycle'

export function useTutorsList(
  accessToken: string | null,
  params: { discipline?: string; department_id?: string; active_only?: boolean; limit?: number; offset?: number },
) {
  const qs = new URLSearchParams()
  if (params.discipline) qs.set('discipline', params.discipline)
  if (params.department_id) qs.set('department_id', params.department_id)
  if (params.active_only !== undefined) qs.set('active_only', String(params.active_only))
  qs.set('limit', String(params.limit ?? 50))
  qs.set('offset', String(params.offset ?? 0))
  const suffix = `?${qs.toString()}`

  return useQuery({
    queryKey: ['tutors', accessToken, suffix],
    queryFn: () => apiFetch<TutorListResponse>(`/tutors${suffix}`, { accessToken }),
    enabled: Boolean(accessToken),
  })
}

export function useTutorDetail(accessToken: string | null, id: string | undefined) {
  return useQuery({
    queryKey: ['tutors', id, accessToken],
    queryFn: () => apiFetch<TutorDetail>(`/tutors/${id}`, { accessToken }),
    enabled: Boolean(accessToken && id),
  })
}

export function useCreateTutor(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<TutorDetail>('/tutors', { method: 'POST', body, accessToken }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tutors'] }),
  })
}

export function useUpdateTutor(accessToken: string | null, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<TutorDetail>(`/tutors/${id}`, { method: 'PATCH', body, accessToken }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tutors'] })
      void qc.invalidateQueries({ queryKey: ['tutors', id] })
    },
  })
}

export function useDeleteTutor(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiFetch<{ ok: boolean }>(`/tutors/${id}`, { method: 'DELETE', accessToken }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tutors'] }),
  })
}

export function useTutorBatchImport(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { file: File; mapping: Record<string, string>; dryRun: boolean; defaultPassword: string }) => {
      const fd = new FormData()
      fd.append('file', vars.file)
      fd.append('mapping', JSON.stringify(vars.mapping))
      fd.append('dry_run', String(vars.dryRun))
      fd.append('default_password', vars.defaultPassword)
      return apiPostForm<Record<string, unknown>>('/tutors/batch', fd, accessToken)
    },
    onSuccess: (_d, vars) => {
      if (!vars.dryRun) void qc.invalidateQueries({ queryKey: ['tutors'] })
    },
  })
}
