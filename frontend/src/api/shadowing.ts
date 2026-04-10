import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { apiFetch } from './client'
import type { ShadowingApplicationOut, ShadowingApplicationCreate, ShadowingApplicationUpdate, MentorAssignmentCreate } from '@/types/shadowing'

const MOCK_SHADOWING_APPLICATIONS: ShadowingApplicationOut[] = [
  {
    id: 'shad-1',
    student_id: 'std_001',
    discipline: 'medicine',
    reason: 'Interested in pediatric cardiology rounds.',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    assignments: []
  },
  {
    id: 'shad-2',
    student_id: 'std_002',
    discipline: 'nursing',
    reason: 'Would like to observe emergency trauma care.',
    status: 'shortlisted',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    assignments: []
  }
];

export function useShadowingApplications() {
  return useQuery({
    queryKey: ['shadowing-applications'],
    queryFn: async () => {
      try {
        const data = await apiFetch<ShadowingApplicationOut[]>('/shadowing/applications');
        return data.length > 0 ? data : MOCK_SHADOWING_APPLICATIONS;
      } catch (e) {
        console.warn('Using mock shadowing applications');
        return MOCK_SHADOWING_APPLICATIONS;
      }
    },
  })
}

export function useApplyShadowing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ShadowingApplicationCreate) =>
      apiFetch<ShadowingApplicationOut>('/shadowing/applications', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shadowing-applications'] })
      message.success('Application submitted successfully')
    },
    onError: (e: any) => message.error(e.message),
  })
}

export function useUpdateShadowingStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ShadowingApplicationUpdate }) =>
      apiFetch<ShadowingApplicationOut>(`/shadowing/applications/${id}`, {
        method: 'PATCH',
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shadowing-applications'] })
      message.success('Application updated')
    },
    onError: (e: any) => message.error(e.message),
  })
}

export function useAssignShadowingMentor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MentorAssignmentCreate }) =>
      apiFetch<ShadowingApplicationOut>(`/shadowing/applications/${id}/assign-mentor`, {
        method: 'POST',
        body: payload,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shadowing-applications'] })
      message.success('Mentor assigned successfully')
    },
    onError: (e: any) => message.error(e.message),
  })
}
