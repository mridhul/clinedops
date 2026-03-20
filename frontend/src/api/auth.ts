import { useMutation, useQuery } from '@tanstack/react-query'

import { apiFetch } from './client'
import type { Discipline, MeResponse, Role } from '../types/auth'

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  access_token: string
  token_type: 'bearer'
  role: Role
  discipline: Discipline | null
}

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      return apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: payload,
      })
    },
  })
}

export function useMe(accessToken: string | null) {
  return useQuery({
    queryKey: ['auth', 'me', accessToken],
    queryFn: async () => apiFetch<MeResponse>('/auth/me', { accessToken }),
    enabled: Boolean(accessToken),
  })
}

