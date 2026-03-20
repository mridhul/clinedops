export type ErrorItem = {
  code: string
  message: string
  field?: string
  trace_id?: string
}

export type Envelope<T> = {
  data: T | null
  meta: Record<string, unknown> | null
  errors: ErrorItem[] | null
}

