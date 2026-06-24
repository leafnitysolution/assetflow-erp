import { create } from "zustand"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import { generateId } from "@/lib/utils"
import type { User, Department } from "@/types"
import { mockDepartments } from "@/data/mockData"

type UserInput = Omit<User, "id" | "createdAt"> & { password?: string }
type ImportedUser = Partial<User> & { password?: string }

interface UserState {
  users: User[]
  departments: Department[]
  loading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  addUser: (user: UserInput) => Promise<void>
  updateUser: (id: string, user: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  toggleUserStatus: (id: string) => Promise<void>
  addDepartment: (department: Omit<Department, "id" | "createdAt">) => void
  updateDepartment: (id: string, department: Partial<Department>) => void
  deleteDepartment: (id: string) => void
  getUserById: (id: string) => User | undefined
  getUsersByDepartment: (departmentId: string) => User[]
  getUsersByRole: (role: User["role"]) => User[]
  importUsersFromCSV: (users: ImportedUser[]) => Promise<void>
}

export const useUserStore = create<UserState>()((set, get) => ({
  users: [],
  departments: mockDepartments,
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get("/users")
      set({ users: data, loading: false })
    } catch (err: unknown) {
      // Members don't have access — fetch directory instead (id + name only)
      try {
        const { data } = await api.get("/users/directory")
        set({ users: data, loading: false })
      } catch {
        set({ error: getErrorMessage(err, "Failed to load users"), loading: false })
      }
    }
  },

  addUser: async (userData) => {
    const { data } = await api.post("/users", userData)
    set((state) => ({ users: [...state.users, data] }))
  },

  updateUser: async (id, userData) => {
    const { data } = await api.put(`/users/${id}`, userData)
    set((state) => ({ users: state.users.map((u) => u.id === id ? data : u) }))
  },

  deleteUser: async (id) => {
    await api.delete(`/users/${id}`)
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }))
  },

  toggleUserStatus: async (id) => {
    const { data } = await api.patch(`/users/${id}/toggle-status`)
    set((state) => ({ users: state.users.map((u) => u.id === id ? data : u) }))
  },

  addDepartment: (deptData) => {
    const newDept: Department = { ...deptData, id: generateId(), createdAt: new Date().toISOString() }
    set((state) => ({ departments: [...state.departments, newDept] }))
  },

  updateDepartment: (id, deptData) => {
    set((state) => ({ departments: state.departments.map((d) => d.id === id ? { ...d, ...deptData } : d) }))
  },

  deleteDepartment: (id) => {
    set((state) => ({ departments: state.departments.filter((d) => d.id !== id) }))
  },

  getUserById: (id) => get().users.find((u) => u.id === id),
  getUsersByDepartment: (departmentId) => get().users.filter((u) => u.department === departmentId),
  getUsersByRole: (role) => get().users.filter((u) => u.role === role),

  importUsersFromCSV: async (importedUsers) => {
    const results = await Promise.all(
      importedUsers.map((u) => api.post("/users", { ...u, status: "active" }))
    )
    const newUsers = results.map((r) => r.data)
    set((state) => ({ users: [...state.users, ...newUsers] }))
  },
}))
