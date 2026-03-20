import { create } from 'zustand'

import type { MeResponse } from '../types/auth'

type AuthState = {
  accessToken: string | null
  profile: MeResponse | null
}

type AuthActions = {
  setAccessToken: (token: string | null) => void
  setProfile: (profile: MeResponse | null) => void
  clear: () => void
}

export const useAuth = create<AuthState & AuthActions>((set) => ({
  accessToken: null,
  profile: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setProfile: (profile) => set({ profile }),
  clear: () => set({ accessToken: null, profile: null }),
}))

