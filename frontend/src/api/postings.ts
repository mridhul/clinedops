import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from './client'
import type { PostingListResponse, PostingOut } from '../types/lifecycle'

export function usePostingsList(
  accessToken: string | null,
  params: {
    discipline?: string
    department_id?: string
    date_from?: string
    date_to?: string
    status?: string
    limit?: number
    offset?: number
  },
) {
  const qs = new URLSearchParams()
  if (params.discipline) qs.set('discipline', params.discipline)
  if (params.department_id) qs.set('department_id', params.department_id)
  if (params.date_from) qs.set('date_from', params.date_from)
  if (params.date_to) qs.set('date_to', params.date_to)
  if (params.status) qs.set('status', params.status)
  qs.set('limit', String(params.limit ?? 50))
  qs.set('offset', String(params.offset ?? 0))

  return useQuery({
    queryKey: ['postings', accessToken, qs.toString()],
    queryFn: () => apiFetch<PostingListResponse>(`/postings?${qs.toString()}`, { accessToken }),
    enabled: Boolean(accessToken),
  })
}

export function usePostingDetail(accessToken: string | null, id: string | undefined) {
  return useQuery({
    queryKey: ['postings', id, accessToken],
    queryFn: () => apiFetch<PostingOut>(`/postings/${id}`, { accessToken }),
    enabled: Boolean(accessToken && id),
  })
}

export function useCreatePosting(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<PostingOut>('/postings', { method: 'POST', body, accessToken }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['postings'] }),
  })
}

export function useUpdatePosting(accessToken: string | null, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<PostingOut>(`/postings/${id}`, { method: 'PATCH', body, accessToken }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['postings'] })
      void qc.invalidateQueries({ queryKey: ['postings', id] })
    },
  })
}
