import { create } from "zustand"

const useBannerStore = create((set) => ({
  banners: [],
  loading: false,

  // FETCH ALL BANNERS
  fetchBanners: async (API_URL) => {
    try {
      set({ loading: true })
      const res = await fetch(`${API_URL}/banners`)
      const data = await res.json()
      set({ banners: Array.isArray(data) ? data : [] })
      return data
    } catch (error) {
      console.error("Failed to load banners:", error)
      return []
    } finally {
      set({ loading: false })
    }
  },

  // CREATE BANNER
  createBanner: async (API_URL, newData) => {
    try {
      const res = await fetch(`${API_URL}/banners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      })
      const data = await res.json()
      if (!res.ok) return data

      // Extract created banner (backend puts it under data.banner)
      const createdBanner = data.banner || data

      // Ensure message always exists
      const message = data.message || "Banner created successfully."

      // Update Zustand store
      set((state) => ({
        banners: [createdBanner, ...state.banners],
      }))

      // Return final object so UI gets banner + message
      return {
        ...createdBanner,
        message,
      }
    } catch (err) {
      console.error("Error creating banner:", err)
      return { message: "Failed to create banner" }
    }
  },

  // UPDATE BANNER
  updateBanner: async (API_URL, id, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })
      const data = await res.json()

      if (!res.ok) return data

      // Guarantee a success message
      if (!data.message) {
        data.message = "Banner updated successfully."
      }

      set((state) => ({
        banners: state.banners.map((b) => (b._id === id ? data : b)),
      }))

      return data
    } catch {
      return { message: "Failed to update banner" }
    }
  },

  // DELETE BANNER
  deleteBanner: async (API_URL, id) => {
    try {
      const res = await fetch(`${API_URL}/banners/${id}`, {
        method: "DELETE",
      })
      let data = await res.json()

      if (!res.ok) return data

      // Guarantee a success message
      if (!data.message) {
        data.message = "Banner deleted successfully."
      }

      set((state) => ({
        banners: state.banners.filter((b) => b._id !== id),
      }))

      return data
    } catch {
      return { message: "Failed to delete banner" }
    }
  },

  // DELETE MANY BANNERS
  deleteManyBanners: async (API_URL, { ids }) => {
    const res = await fetch(`${API_URL}/banners/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })

    const data = await res.json()

    if (data.message?.toLowerCase().includes("success")) {
      set((state) => ({
        banners: state.banners.filter((b) => !ids.includes(b._id)),
      }))
    }

    return data
  },
  // bannerStore.js
  updateBannerStatus: async (API_URL, id, status) => {
    try {
      const res = await fetch(`${API_URL}/banners/status/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const data = await res.json()
      if (!res.ok) return data

      set((state) => ({
        banners: state.banners.map((b) =>
          b._id === id ? { ...b, status } : b
        ),
      }))

      return data
    } catch {
      return { message: "Failed to update banner status" }
    }
  },

  updateBannerTheme: async (API_URL, id, theme) => {
    try {
      const res = await fetch(`${API_URL}/banners/theme/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      })

      const data = await res.json()
      if (!res.ok) return data

      set((state) => ({
        banners: state.banners.map((b) => (b._id === id ? { ...b, theme } : b)),
      }))

      return data
    } catch {
      return { message: "Failed to update banner theme" }
    }
  },

  updateBannerDevice: async (API_URL, id, device) => {
    try {
      const res = await fetch(`${API_URL}/banners/device/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device }),
      })

      const data = await res.json()
      if (!res.ok) return data

      set((state) => ({
        banners: state.banners.map((b) =>
          b._id === id ? { ...b, device } : b
        ),
      }))

      return data
    } catch {
      return { message: "Failed to update banner device mode" }
    }
  },
}))

export default useBannerStore
