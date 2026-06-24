import { create } from "zustand"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import type { Ticket, TicketComment } from "@/types"

interface TicketState {
  tickets: Ticket[]
  loading: boolean
  error: string | null
  fetchTickets: () => Promise<void>
  addTicket: (ticket: Omit<Ticket, "id" | "ticketNumber" | "createdAt" | "updatedAt">) => Promise<void>
  updateTicket: (id: string, ticket: Partial<Ticket>) => Promise<void>
  deleteTicket: (id: string) => Promise<void>
  assignTicket: (ticketId: string, userId: string, userName: string) => Promise<void>
  resolveTicket: (ticketId: string) => Promise<void>
  addComment: (ticketId: string, comment: Omit<TicketComment, "id" | "createdAt">) => Promise<void>
  getTicketById: (id: string) => Ticket | undefined
  getTicketsByUser: (userId: string) => Ticket[]
  getTicketsByStatus: (status: Ticket["status"]) => Ticket[]
  getTicketsByAsset: (assetId: string) => Ticket[]
}

export const useTicketStore = create<TicketState>()((set, get) => ({
  tickets: [],
  loading: false,
  error: null,

  fetchTickets: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get("/tickets")
      set({ tickets: data, loading: false })
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, "Failed to load tickets"), loading: false })
    }
  },

  addTicket: async (ticketData) => {
    const { data } = await api.post("/tickets", ticketData)
    set((state) => ({ tickets: [data, ...state.tickets] }))
  },

  updateTicket: async (id, ticketData) => {
    const { data } = await api.put(`/tickets/${id}`, ticketData)
    set((state) => ({ tickets: state.tickets.map((t) => t.id === id ? data : t) }))
  },

  deleteTicket: async (id) => {
    await api.delete(`/tickets/${id}`)
    set((state) => ({ tickets: state.tickets.filter((t) => t.id !== id) }))
  },

  assignTicket: async (ticketId, userId, userName) => {
    const { data } = await api.post(`/tickets/${ticketId}/assign`, { userId, userName })
    set((state) => ({ tickets: state.tickets.map((t) => t.id === ticketId ? data : t) }))
  },

  resolveTicket: async (ticketId) => {
    const { data } = await api.post(`/tickets/${ticketId}/resolve`)
    set((state) => ({ tickets: state.tickets.map((t) => t.id === ticketId ? data : t) }))
  },

  addComment: async (ticketId, commentData) => {
    const { data } = await api.post(`/tickets/${ticketId}/comments`, commentData)
    set((state) => ({ tickets: state.tickets.map((t) => t.id === ticketId ? data : t) }))
  },

  getTicketById: (id) => get().tickets.find((t) => t.id === id),
  getTicketsByUser: (userId) => get().tickets.filter((t) => t.createdBy === userId || t.assignedTo === userId),
  getTicketsByStatus: (status) => get().tickets.filter((t) => t.status === status),
  getTicketsByAsset: (assetId) => get().tickets.filter((t) => t.assetId === assetId),
}))
