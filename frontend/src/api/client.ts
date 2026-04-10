import { useAuth } from '../auth/useAuth'
import type { Envelope } from '../types/api'

type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  accessToken?: string | null
  signal?: AbortSignal
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

export function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL ?? ''}${path}`
  const token = options.accessToken ?? useAuth.getState().accessToken

  return fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
    signal: options.signal,
  })
    .then(async (res) => {
      const json: Envelope<T> = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.errors?.[0]?.message ?? `Request failed: ${res.status}`)
      }
      if (json?.errors?.length) {
        throw new Error(json.errors[0]?.message ?? 'Request failed')
      }
      return json?.data as T
    })
}

export function apiPostForm<T>(path: string, formData: FormData, accessToken: string | null): Promise<T> {
  const url = `${API_BASE_URL ?? ''}${path}`

  return fetch(url, {
    method: 'POST',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: formData,
    credentials: 'include',
  }).then(async (res) => {
    const json: Envelope<T> = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(json?.errors?.[0]?.message ?? `Request failed: ${res.status}`)
    }
    if (json?.errors?.length) {
      throw new Error(json.errors[0]?.message ?? 'Request failed')
    }
    return json?.data as T
  })
}

