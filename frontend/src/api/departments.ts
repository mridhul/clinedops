import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from './client'
import type { DepartmentListResponse, DepartmentOut } from '../types/lifecycle'

export function useDepartments(
  accessToken: string | null,
  params: { discipline?: string; department_id?: string; limit?: number; offset?: number },
) {
  const qs = new URLSearchParams()
  if (params.discipline) qs.set('discipline', params.discipline)
  if (params.department_id) qs.set('department_id', params.department_id)
  qs.set('limit', String(params.limit ?? 100))
  qs.set('offset', String(params.offset ?? 0))

  return useQuery({
    queryKey: ['departments', accessToken, qs.toString()],
    queryFn: () => apiFetch<DepartmentListResponse>(`/departments?${qs.toString()}`, { accessToken }),
    enabled: Boolean(accessToken),
  })
}

export function useCreateDepartment(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<DepartmentOut>('/departments', { method: 'POST', body, accessToken }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}

export function useUpdateDepartment(accessToken: string | null, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<DepartmentOut>(`/departments/${id}`, { method: 'PATCH', body, accessToken }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['departments'] }),
  })
}
