import { create } from "zustand"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import type { User } from "@/types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  checkAuth: () => Promise<void>
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post("/auth/login", { email, password })
      localStorage.setItem("af-token", data.token)
      set({ user: data.user, isAuthenticated: true, loading: false })
      return { success: true }
    } catch (err: unknown) {
      const error = getErrorMessage(err, "Login failed")
      set({ error, loading: false })
      return { success: false, error }
    }
  },

  logout: () => {
    localStorage.removeItem("af-token")
    set({ user: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const token = localStorage.getItem("af-token")
    if (!token) return
    set({ loading: true })
    try {
      const { data } = await api.get("/auth/me")
      set({ user: data, isAuthenticated: true, loading: false })
    } catch {
      localStorage.removeItem("af-token")
      set({ user: null, isAuthenticated: false, loading: false })
    }
  },

  updateUser: (userData) => {
    const current = get().user
    if (current) set({ user: { ...current, ...userData } })
  },
}))
