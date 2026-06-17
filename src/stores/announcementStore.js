import { create } from "zustand"

const useAnnouncementStore = create((set) => ({
  announcements: [],
  loading: false,

  fetchAnnouncements: async (API_URL) => {
    set({ loading: true })
    try {
      const res = await fetch(`${API_URL}/announcements/`)
      const data = await res.json()

      set({
        announcements: Array.isArray(data) ? data : data.announcements || [],
      })
    } catch (err) {
      console.error(err)
    } finally {
      set({ loading: false })
    }
  },

  addAnnouncement: async (API_URL, newAnnouncement) => {
    try {
      const res = await fetch(`${API_URL}/announcements/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnnouncement),
      })

      const data = await res.json()

      if (!res.ok) return data

      if (data.announcement) {
        set((state) => ({
          announcements: [data.announcement, ...state.announcements],
        }))
      }

      return data
    } catch (err) {
      return { message: "Failed to add announcement" }
    }
  },

  updateAnnouncement: async (API_URL, id, updatedAnnouncement) => {
    try {
      const res = await fetch(`${API_URL}/announcements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAnnouncement),
      })

      const data = await res.json()

      if (!res.ok) return data

      if (data.announcement) {
        set((state) => ({
          announcements: state.announcements.map((a) =>
            a._id === id ? data.announcement : a
          ),
        }))
      }

      return data
    } catch (err) {
      return { message: "Failed to update announcement" }
    }
  },

  deleteAnnouncement: async (API_URL, id) => {
    try {
      const res = await fetch(`${API_URL}/announcements/${id}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) return data

      set((state) => ({
        announcements: state.announcements.filter((a) => a._id !== id),
      }))

      return data
    } catch (err) {
      return { message: "Failed to delete announcement" }
    }
  },

  deleteManyAnnouncements: async (API_URL, { ids }) => {
    const res = await fetch(`${API_URL}/announcements/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })

    const data = await res.json()

    if (data.message?.toLowerCase().includes("success")) {
      set((state) => ({
        announcements: state.announcements.filter(
          (item) => !ids.includes(item._id)
        ),
      }))
    }

    return data
  },
}))

export default useAnnouncementStore
