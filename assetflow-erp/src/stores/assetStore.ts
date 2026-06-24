import { create } from "zustand"
import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import type { Asset } from "@/types"

interface AssetState {
  assets: Asset[]
  loading: boolean
  error: string | null
  fetchAssets: () => Promise<void>
  addAsset: (asset: Omit<Asset, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
  assignAsset: (assetId: string, userId: string, userName: string) => Promise<void>
  returnAsset: (assetId: string) => Promise<void>
  getAssetById: (id: string) => Asset | undefined
  getAssetsByUser: (userId: string) => Asset[]
  getAssetsByStatus: (status: Asset["status"]) => Asset[]
  importAssetsFromCSV: (rows: Partial<Asset>[]) => Promise<{ success: number; failed: number }>
}

export const useAssetStore = create<AssetState>()((set, get) => ({
  assets: [],
  loading: false,
  error: null,

  fetchAssets: async () => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.get("/assets")
      set({ assets: data, loading: false })
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, "Failed to load assets"), loading: false })
    }
  },

  addAsset: async (assetData) => {
    const { data } = await api.post("/assets", assetData)
    set((state) => ({ assets: [data, ...state.assets] }))
  },

  updateAsset: async (id, assetData) => {
    const { data } = await api.put(`/assets/${id}`, assetData)
    set((state) => ({ assets: state.assets.map((a) => a.id === id ? data : a) }))
  },

  deleteAsset: async (id) => {
    await api.delete(`/assets/${id}`)
    set((state) => ({ assets: state.assets.filter((a) => a.id !== id) }))
  },

  assignAsset: async (assetId, userId) => {
    const { data } = await api.post(`/assets/${assetId}/assign`, { userId })
    set((state) => ({ assets: state.assets.map((a) => a.id === assetId ? data : a) }))
  },

  returnAsset: async (assetId) => {
    const { data } = await api.post(`/assets/${assetId}/return`)
    set((state) => ({ assets: state.assets.map((a) => a.id === assetId ? data : a) }))
  },

  getAssetById: (id) => get().assets.find((a) => a.id === id),
  getAssetsByUser: (userId) => get().assets.filter((a) => a.assignedTo === userId),
  getAssetsByStatus: (status) => get().assets.filter((a) => a.status === status),

  importAssetsFromCSV: async (rows) => {
    let success = 0
    let failed = 0
    for (const row of rows) {
      try {
        const { data } = await api.post("/assets", row)
        set((state) => ({ assets: [data, ...state.assets] }))
        success++
      } catch {
        failed++
      }
    }
    return { success, failed }
  },
}))
