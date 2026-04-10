import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";

export type NotificationType = 
  | "SURVEY_PENDING"
  | "HOURS_PENDING_APPROVAL"
  | "HOURS_APPROVED"
  | "HOURS_REJECTED"
  | "LOW_SCORE_ALERT"
  | "DEADLINE_APPROACHING"
  | "BROADCAST"
  | "ESCALATION";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationPreference {
  notification_type: NotificationType;
  email_enabled: boolean;
}

export const useNotifications = (accessToken: string | null, unreadOnly = false, limit = 50, offset = 0) => {
  return useQuery({
    queryKey: ["notifications", accessToken, { unreadOnly, limit, offset }],
    queryFn: () => apiFetch<Notification[]>(`/notifications/?unread_only=${unreadOnly}&limit=${limit}&offset=${offset}`, { accessToken }),
    enabled: Boolean(accessToken),
  });
};

export const useUnreadCount = (accessToken: string | null) => {
  return useQuery({
    queryKey: ["notifications", accessToken, "unread-count"],
    queryFn: () => apiFetch<{ count: number }>("/notifications/unread-count", { accessToken }),
    refetchInterval: 30000, // Poll every 30s
    enabled: Boolean(accessToken),
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => 
      apiFetch<boolean>(`/notifications/${notificationId}/read`, { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkAllRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/notifications/mark-all-read", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useNotificationSettings = () => {
  return useQuery({
    queryKey: ["settings", "notifications"],
    queryFn: () => apiFetch<NotificationPreference[]>("/settings/notifications"),
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: { type: string; enabled: boolean }[]) =>
      apiFetch("/settings/notifications", {
        method: "PATCH",
        body: JSON.stringify({ preferences }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "notifications"] });
    },
  });
};

export const useSendBroadcast = () => {
  return useMutation({
    mutationFn: (body: {
      title: string
      message: string
      target_role: 'student' | 'tutor'
      discipline?: string
      academic_cycle_id?: string
      department_id?: string
      posting_id?: string
    }) =>
      apiFetch<{ matched_count: number; sent_count: number }>('/notifications/broadcast', {
        method: 'POST',
        body,
      }),
  });
};

export const usePreviewBroadcast = () => {
  return useMutation({
    mutationFn: (body: {
      title: string
      message: string
      target_role: 'student' | 'tutor'
      discipline?: string
      academic_cycle_id?: string
      department_id?: string
      posting_id?: string
    }) =>
      apiFetch<{ matched_count: number; sent_count: number }>('/notifications/broadcast', {
        method: 'POST',
        body: { ...body, dry_run: true },
      }),
  })
}
