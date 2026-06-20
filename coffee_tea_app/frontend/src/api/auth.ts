import api from './client'

export interface User {
  id: number
  email: string
  full_name: string
  phone: string | null
  is_admin: boolean
  loyalty_points: number
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export const register = (data: { email: string; password: string; full_name: string; phone?: string }) =>
  api.post<AuthResponse>('/auth/register', data).then((r) => r.data)

export const login = (email: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data)

export const getMe = () => api.get<User>('/users/me').then((r) => r.data)
