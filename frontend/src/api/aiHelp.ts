import { apiFetch } from './client'

export type AiHelpChatResponse = {
  reply: string
}

export function postAiHelpChat(message: string): Promise<AiHelpChatResponse> {
  return apiFetch<AiHelpChatResponse>('/ai-help/chat', {
    method: 'POST',
    body: { message },
  })
}
