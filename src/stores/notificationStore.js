import { create } from "zustand"

const useNotificationStore = create((set) => ({
  notifications: [],
  loading: false,

  fetchNotifications: async (API_URL) => {
    try {
      set({ loading: true })
      const res = await fetch(`${API_URL}/notifications`)
      const data = await res.json()

      set({ notifications: data || [] })
      return data
    } catch (err) {
      console.error("Failed to load notifications")
      return []
    } finally {
      set({ loading: false })
    }
  },

  createNotification: async (API_URL, newData) => {
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      })

      const data = await res.json()

      if (!res.ok) return data

      if (data.notification) {
        set((state) => ({
          notifications: [data.notification, ...state.notifications],
        }))
      }

      return data // { message: "Notification created successfully" }
    } catch {
      return { message: "Failed to create notification" }
    }
  },

  updateNotification: async (API_URL, id, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      })

      const data = await res.json()

      if (!res.ok) return data

      if (data.notification) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n._id === id ? data.notification : n
          ),
        }))
      }

      return data // { message: "Notification updated successfully" }
    } catch {
      return { message: "Failed to update notification" }
    }
  },

  deleteNotification: async (API_URL, id) => {
    try {
      const res = await fetch(`${API_URL}/notifications/${id}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) return data

      set((state) => ({
        notifications: state.notifications.filter((n) => n._id !== id),
      }))

      return data // { message: "Notification deleted successfully" }
    } catch {
      return { message: "Failed to delete notification" }
    }
  },
  deleteManyNotifications: async (API_URL, ids) => {
    try {
      const res = await fetch(`${API_URL}/notifications/bulk-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })

      const data = await res.json()
      if (!res.ok) return data

      set((state) => ({
        notifications: state.notifications.filter((n) => !ids.includes(n._id)),
      }))

      return data // { message: "Deleted X notifications" }
    } catch {
      return { message: "Failed to delete notifications" }
    }
  },
}))

export default useNotificationStore
