import { create } from "zustand"

const useProviderStore = create((set, get) => ({
  providers: [],
  loading: false,

  // ============================
  // FETCH ALL PROVIDERS
  // ============================
  getSlotsProviderList: async (API_URL) => {
    try {
      set({ loading: true })

      const res = await fetch(`${API_URL}/providers`)
      const data = await res.json()

      set({ providers: Array.isArray(data) ? data : [] })
      return data
    } catch (err) {
      console.error("Failed to load providers:", err)
      return []
    } finally {
      set({ loading: false })
    }
  },

  // ============================
  // CREATE PROVIDER
  // ============================
  createProvider: async (API_URL, newData) => {
    try {
      const res = await fetch(`${API_URL}/providers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      })

      const data = await res.json()
      if (!res.ok) return data

      if (data.provider) {
        set((state) => ({
          providers: [data.provider, ...state.providers],
        }))
      }

      return data
    } catch {
      return { message: "Failed to create provider" }
    }
  },

  // ============================
  // UPDATE PROVIDER
  // ============================
  updateProvider: async (API_URL, id, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/providers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })

      const data = await res.json()
      if (!res.ok) return data

      if (data.provider) {
        set((state) => ({
          providers: state.providers.map((p) =>
            p._id === id ? data.provider : p
          ),
        }))
      }

      return data
    } catch {
      return { message: "Failed to update provider" }
    }
  },

  // ============================
  // DELETE PROVIDER
  // ============================
  deleteProvider: async (API_URL, id) => {
    try {
      const res = await fetch(`${API_URL}/providers/${id}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) return data

      set((state) => ({
        providers: state.providers.filter((p) => p._id !== id),
      }))

      return data
    } catch {
      return { message: "Failed to delete provider" }
    }
  },

  // ============================
  // BULK DELETE
  // ============================
  deleteManyProviders: async (API_URL, ids) => {
    try {
      const res = await fetch(`${API_URL}/providers/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })

      const data = await res.json()
      if (!res.ok) return data

      set((state) => ({
        providers: state.providers.filter((p) => !ids.includes(p._id)),
      }))

      return data
    } catch {
      return { message: "Failed to delete providers" }
    }
  },

  // ============================
  // UPDATE TOP GAME ONLY
  // ============================
  updateProviderTopGame: async (API_URL, id, topGame) => {
    try {
      const res = await fetch(`${API_URL}/providers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topGame }),
      })

      const data = await res.json()
      if (!res.ok) return data

      set((state) => ({
        providers: state.providers.map((p) =>
          p._id === id ? { ...p, topGame } : p
        ),
      }))

      return data
    } catch {
      return { message: "Failed to update topGame" }
    }
  },

  // ============================
  // UPDATE NEW GAME ONLY
  // ============================
  updateProviderNewGame: async (API_URL, id, newGame) => {
    try {
      const res = await fetch(`${API_URL}/providers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newGame }),
      })

      const data = await res.json()
      if (!res.ok) return data

      set((state) => ({
        providers: state.providers.map((p) =>
          p._id === id ? { ...p, newGame } : p
        ),
      }))

      return data
    } catch {
      return { message: "Failed to update newGame" }
    }
  },

  // ============================
  // UPDATE HIDDEN ONLY
  // ============================
  updateProviderHidden: async (API_URL, id, hidden) => {
    try {
      const res = await fetch(`${API_URL}/providers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden }),
      })

      const data = await res.json()
      if (!res.ok) return data

      set((state) => ({
        providers: state.providers.map((p) =>
          p._id === id ? { ...p, hidden } : p
        ),
      }))

      return data
    } catch {
      return { message: "Failed to update hidden status" }
    }
  },
  reorderProviders: async (API_URL, orderedIds) => {
    try {
      const res = await fetch(`${API_URL}/providers/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      })

      const data = await res.json()
      if (!res.ok) return data

      // backend must return data.providers
      set(() => ({
        providers: data.providers,
      }))

      return data
    } catch {
      return { message: "Failed to reorder providers" }
    }
  },

  // reorderProviders: async (API_URL, orderedIds) => {
  //   // 🔥 1. Optimistic update (instant UI change)
  //   set((state) => ({
  //     providers: state.providers
  //       .slice()
  //       .sort((a, b) => orderedIds.indexOf(a._id) - orderedIds.indexOf(b._id))
  //       .map((p, i) => ({ ...p, order: i })),
  //   }))

  //   // 🔥 2. Send update to backend (non-blocking, no waiting)
  //   fetch(`${API_URL}/slots-provider/reorder`, {
  //     method: "PUT",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ orderedIds }),
  //   }).catch((err) => {
  //     console.error("Reorder failed:", err)
  //   })
  // },
}))

export default useProviderStore
