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

  return fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
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

