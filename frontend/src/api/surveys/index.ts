import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { apiFetch } from '../client'
import type { 
  SurveyTemplate, 
  SurveyAssignment, 
  SurveySubmission, 
  TutorFeedbackSummary 
} from '../../types/surveys'

export function useSurveyTemplates(accessToken: string | null, discipline?: string) {
  const qs = new URLSearchParams()
  if (discipline) qs.set('discipline', discipline)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''

  return useQuery({
    queryKey: ['surveys', 'templates', accessToken, discipline],
    queryFn: () => apiFetch<SurveyTemplate[]>(`/templates${suffix}`, { accessToken }),
    enabled: Boolean(accessToken),
  })
}

export function useSurveyAssignments(accessToken: string | null) {
  return useQuery({
    queryKey: ['surveys', 'assignments', accessToken],
    queryFn: () => apiFetch<SurveyAssignment[]>('/assignments', { accessToken }),
    enabled: Boolean(accessToken),
  })
}

export function useTutorFeedback(accessToken: string | null, tutorId: string | undefined) {
  return useQuery({
    queryKey: ['surveys', 'feedback', tutorId, accessToken],
    queryFn: () => apiFetch<TutorFeedbackSummary>(`/tutors/${tutorId}/feedback`, { accessToken }),
    enabled: Boolean(accessToken && tutorId),
  })
}

export function useSubmitSurvey(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      assignment_id?: string;
      template_id: string;
      student_id: string;
      responses: Record<string, any>;
    }) => apiFetch<SurveySubmission>('/submissions', { method: 'POST', body, accessToken }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['surveys', 'assignments'] })
      void qc.invalidateQueries({ queryKey: ['surveys', 'feedback'] })
    },
  })
}

export function useCreateSurveyTemplate(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<SurveyTemplate>) =>
      apiFetch<SurveyTemplate>('/templates', { method: 'POST', body, accessToken }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['surveys', 'templates'] }),
  })
}

export function useUpdateSurveyTemplate(accessToken: string | null, templateId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<SurveyTemplate>) =>
      apiFetch<SurveyTemplate>(`/templates/${templateId}`, { method: 'PATCH', body, accessToken }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['surveys', 'templates'] })
      void qc.invalidateQueries({ queryKey: ['surveys', 'templates', templateId] })
    },
  })
}

export function useDeleteSurveyTemplate(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (templateId: string) =>
      apiFetch<boolean>(`/templates/${templateId}`, { method: 'DELETE', accessToken }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['surveys', 'templates'] }),
  })
}

export function useBatchAssignSurveys(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<number>('/assignments/batch', { method: 'POST', accessToken }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['surveys', 'assignments'] })
      message.success('Batch assignment processed successfully')
    },
  })
}

export function useManualAssignSurveys(accessToken: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      template_id: string;
      student_ids: string[];
      tutor_ids?: string[];
      posting_id?: string;
      session_ids?: string[];
    }) => apiFetch<number>('/assignments/manual', { method: 'POST', body, accessToken }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['surveys', 'assignments'] })
      message.success('Manual assignment created successfully')
    },
  })
}
