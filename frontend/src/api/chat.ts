import api from './client'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export const sendChatMessage = (messages: ChatMessage[]) =>
  api.post<{ reply: string }>('/chat/', { messages }).then((r) => r.data.reply)
