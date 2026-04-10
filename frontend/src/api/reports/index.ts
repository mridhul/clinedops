import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client';


export interface ReportTemplate {
  id: string;
  name: string;
  config: any;
  status: string;
  created_at: string;
}

export interface ReportExecution {
  id: string;
  template_id: string;
  status: string;
  format: string;
  file_url?: string;
  error_message?: string;
  created_at: string;
}

export const reportKeys = {
  templates: (token: string | null) => ['reports', 'templates', token] as const,
  history: (token: string | null) => ['reports', 'history', token] as const,
  execution: (id: string, token: string | null) => ['reports', 'execution', id, token] as const,
};

export function useReportTemplates(accessToken: string | null) {
  return useQuery({
    queryKey: reportKeys.templates(accessToken),
    queryFn: () => apiFetch<ReportTemplate[]>('/reports/templates', { accessToken }),
    enabled: !!accessToken,
  });
}

export function useReportHistory(accessToken: string | null) {
  return useQuery({
    queryKey: reportKeys.history(accessToken),
    queryFn: () => apiFetch<ReportExecution[]>('/reports/history', { accessToken }),
    enabled: !!accessToken,
  });
}

export function useCreateReportExecution(accessToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { template_id: string; format: string }) => 
      apiFetch<ReportExecution>('/reports/executions', { method: 'POST', body: payload, accessToken }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}

export function useReportExecution(accessToken: string | null, id: string) {
  return useQuery({
    queryKey: reportKeys.execution(id, accessToken),
    queryFn: () => apiFetch<ReportExecution>(`/reports/executions/${id}`, { accessToken }),
    enabled: !!(accessToken && id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'processing' ? 2000 : false;
    },
  });
}
