import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";

export interface AuditLog {
  id: string;
  created_at: string;
  created_by?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;
  metadata_json: Record<string, any>;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  discipline?: string;
  is_active: boolean;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  description?: string;
}

export interface RolePermission {
  id: string;
  role: string;
  permissions: string[];
}

export interface ImportBatch {
  id: string;
  batch_type: string;
  file_name?: string;
  status: string;
  details: Record<string, any>;
  created_at: string;
  created_by?: string;
}

// Hooks

export interface UserListResponse {
  items: User[];
  total: number;
}

export const useAdminUsers = (accessToken: string | null, skip = 0, limit = 50, role?: string) => {
  return useQuery({
    queryKey: ["admin_users", accessToken, { skip, limit, role }],
    queryFn: () => {
      const qs = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
      if (role) qs.append("role", role);
      return apiFetch<UserListResponse>(`/admin/users?${qs.toString()}`, { accessToken });
    },
    enabled: Boolean(accessToken),
  });
};

export const useCreateAdminUser = (accessToken: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) =>
      apiFetch<User>(`/admin/users`, {
        method: "POST",
        body: payload,
        accessToken,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
    },
  });
};

export const useAdminAuditLogs = (accessToken: string | null, skip = 0, limit = 50, action?: string, actor_id?: string) => {
  return useQuery({
    queryKey: ["admin_audit_logs", accessToken, { skip, limit, action, actor_id }],
    queryFn: () => {
      const qs = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
      if (action) qs.append("action", action);
      if (actor_id) qs.append("actor_id", actor_id);
      return apiFetch<AuditLog[]>(`/admin/audit-logs?${qs.toString()}`, { accessToken });
    },
    enabled: Boolean(accessToken),
  });
};

export const useAdminSettings = (accessToken: string | null) => {
  return useQuery({
    queryKey: ["admin_settings", accessToken],
    queryFn: () => apiFetch<SystemSetting[]>(`/admin/settings`, { accessToken }),
    enabled: Boolean(accessToken),
  });
};

export const useUpdateAdminSetting = (accessToken: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: Record<string, any> }) =>
      apiFetch<SystemSetting>(`/admin/settings/${key}`, {
        method: "PUT",
        body: { setting_value: value },
        accessToken,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_settings"] });
    },
  });
};

export const useAdminRBAC = (accessToken: string | null) => {
  return useQuery({
    queryKey: ["admin_rbac", accessToken],
    queryFn: () => apiFetch<RolePermission[]>(`/admin/rbac`, { accessToken }),
    enabled: Boolean(accessToken),
  });
};

export const useUpdateAdminRBAC = (accessToken: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ role, permissions }: { role: string; permissions: string[] }) =>
      apiFetch<RolePermission>(`/admin/rbac/${role}`, {
        method: "PUT",
        body: { permissions },
        accessToken,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_rbac"] });
    },
  });
};

export const useAdminImports = (accessToken: string | null, skip = 0, limit = 10) => {
  return useQuery({
    queryKey: ["admin_imports", accessToken, { skip, limit }],
    queryFn: () => {
      const qs = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
      return apiFetch<ImportBatch[]>(`/admin/imports?${qs.toString()}`, { accessToken });
    },
    enabled: Boolean(accessToken),
  });
};
