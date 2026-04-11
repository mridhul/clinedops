import { useAuth } from '../auth/useAuth'
import type { Envelope } from '../types/api'

type ApiFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  accessToken?: string | null
  signal?: AbortSignal
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

function messageFromErrorBody(json: unknown, fallback: string): string {
  if (!json || typeof json !== 'object') return fallback
  const j = json as Record<string, unknown>
  if (Array.isArray(j.errors) && j.errors.length > 0) {
    const first = j.errors[0] as { message?: string }
    if (typeof first?.message === 'string' && first.message) return first.message
  }
  const detail = j.detail
  if (typeof detail === 'string' && detail) return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string }
    if (typeof first?.msg === 'string' && first.msg) return first.msg
  }
  return fallback
}

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
      const text = await res.text()
      let json: unknown = null
      if (text) {
        try {
          json = JSON.parse(text) as Envelope<T>
        } catch {
          /* non-JSON body (e.g. proxy HTML) */
        }
      }
      if (!res.ok) {
        const fallback =
          text.trim().slice(0, 400) || `Request failed (${res.status} ${res.statusText || ''})`.trim()
        throw new Error(messageFromErrorBody(json, fallback))
      }
      if (!json || typeof json !== 'object') {
        throw new Error('Invalid response from server')
      }
      const env = json as Envelope<T>
      if (env.errors?.length) {
        throw new Error(messageFromErrorBody(json, 'Request failed'))
      }
      return env.data as T
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
      throw new Error(messageFromErrorBody(json, `Request failed: ${res.status}`))
    }
    if (json?.errors?.length) {
      throw new Error(messageFromErrorBody(json, 'Request failed'))
    }
    return json?.data as T
  })
}

