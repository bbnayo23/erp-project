import { create } from 'zustand'
import { apiClient, toErrorMessage } from '@/shared/api/client'
import type { ApiResponse } from '@/shared/api/types'
import type { User } from '@/types/domain'

interface AuthState {
  user: User | null
  status: 'idle' | 'loading' | 'authenticated' | 'error'
  error: string | null
  fetchMe: () => Promise<void>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  fetchMe: async () => {
    set({ status: 'loading', error: null })
    try {
      const response = await apiClient.get<ApiResponse<User>>('/me')
      set({ user: response.data, status: 'authenticated' })
    } catch (error) {
      set({ status: 'error', error: toErrorMessage(error) })
    }
  },

  login: async (email, password) => {
    set({ status: 'loading', error: null })
    try {
      const response = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
        '/auth/login',
        { email, password },
      )
      set({ user: response.data.user, status: 'authenticated' })
      return true
    } catch (error) {
      set({ status: 'error', error: toErrorMessage(error) })
      return false
    }
  },

  logout: () => set({ user: null, status: 'idle', error: null }),
}))
