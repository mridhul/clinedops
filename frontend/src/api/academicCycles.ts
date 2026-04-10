import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from './client'
import type { AcademicCycleListResponse, AcademicCycleOut } from '../types/lifecycle'

export function useAcademicCycles(accessToken: string | null) {
  return useQuery({
    queryKey: ['academic-cycles', accessToken],
    queryFn: () => apiFetch<AcademicCycleListResponse>('/academic-cycles', { accessToken }),
    enabled: Boolean(accessToken),
  })
}

export function useCreateAcademicCycle(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<AcademicCycleOut>('/academic-cycles', { method: 'POST', body, accessToken }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['academic-cycles'] }),
  })
}

export function useUpdateAcademicCycle(accessToken: string | null, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<AcademicCycleOut>(`/academic-cycles/${id}`, { method: 'PATCH', body, accessToken }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['academic-cycles'] }),
  })
}
