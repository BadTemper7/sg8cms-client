// src/stores/outletVideoAssignmentStore.js
import { create } from "zustand"

const API =
  window.location.hostname === "localhost"
    ? process.env.REACT_APP_BACKEND_API_TEST
    : process.env.REACT_APP_BACKEND_API

async function safeJson(res) {
  const ct = res.headers.get("content-type") || ""
  const isJson = ct.includes("application/json")
  const data = isJson ? await res.json().catch(() => null) : await res.text()

  if (!res.ok) {
    const msg =
      (isJson && data && (data.error || data.message)) ||
      (!isJson && typeof data === "string" && data.trim()) ||
      `Request failed (${res.status})`
    throw new Error(msg)
  }

  return data
}

export const useOutletVideoAssignmentStore = create((set, get) => ({
  assignments: [],
  currentAssignment: null,
  loading: false,
  error: "",

  // ✅ Fetch all assignments with optional filtering
  fetchAssignments: async (query = {}) => {
    set({ loading: true, error: "" })
    try {
      const qs = new URLSearchParams()
      if (query.outletId) qs.set("outletId", query.outletId)
      if (query.active !== undefined) qs.set("active", query.active)

      const res = await fetch(
        `${API}/assignments${qs.toString() ? `?${qs.toString()}` : ""}`
      )
      const data = await safeJson(res)

      set({ assignments: data, loading: false })
      return data
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to fetch assignments",
      })
      throw err
    }
  },

  // ✅ Create a new assignment for an outlet
  createAssignment: async (outletId, assignmentData) => {
    set({ loading: true, error: "" })
    try {
      const {
        videoId,
        startAt = null,
        endAt = null,
        active = true,
      } = assignmentData

      if (!videoId) throw new Error("videoId is required")

      // Validate dates
      if (startAt && endAt && new Date(startAt) > new Date(endAt)) {
        throw new Error("startAt must be <= endAt")
      }

      const res = await fetch(`${API}/assignments/${outletId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId,
          startAt,
          endAt,
          active,
        }),
      })

      const data = await safeJson(res)

      set((state) => ({
        assignments: [data, ...state.assignments],
        currentAssignment: data,
        loading: false,
      }))

      return data
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to create assignment",
      })
      throw err
    }
  },

  // ✅ Get single assignment by ID
  getAssignment: async (assignmentId) => {
    set({ loading: true, error: "" })
    try {
      if (!assignmentId) throw new Error("Missing assignmentId")

      const res = await fetch(`${API}/assignments/${assignmentId}`)
      const data = await safeJson(res)

      set({
        currentAssignment: data,
        loading: false,
      })

      return data
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to fetch assignment",
      })
      throw err
    }
  },

  // ✅ Update assignment
  updateAssignment: async (assignmentId, updateData) => {
    set({ loading: true, error: "" })
    try {
      if (!assignmentId) throw new Error("Missing assignmentId")

      // Validate dates
      if (updateData.startAt && updateData.endAt) {
        if (new Date(updateData.startAt) > new Date(updateData.endAt)) {
          throw new Error("startAt must be <= endAt")
        }
      }

      const res = await fetch(`${API}/assignments/${assignmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      const data = await safeJson(res)

      set((state) => ({
        assignments: state.assignments.map((assignment) =>
          assignment._id === assignmentId ? data : assignment
        ),
        currentAssignment: data,
        loading: false,
      }))

      return data
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to update assignment",
      })
      throw err
    }
  },

  // ✅ Delete assignment
  deleteAssignment: async (assignmentId) => {
    set({ loading: true, error: "" })
    try {
      if (!assignmentId) throw new Error("Missing assignmentId")

      const res = await fetch(`${API}/assignments/${assignmentId}`, {
        method: "DELETE",
      })

      const data = await safeJson(res)

      set((state) => ({
        assignments: state.assignments.filter(
          (assignment) => assignment._id !== assignmentId
        ),
        currentAssignment:
          state.currentAssignment?._id === assignmentId
            ? null
            : state.currentAssignment,
        loading: false,
      }))

      return data
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to delete assignment",
      })
      throw err
    }
  },

  // ✅ Get assignments by outlet ID
  getAssignmentsByOutletId: (outletId) => {
    return get().assignments.filter(
      (assignment) => String(assignment.outletId) === String(outletId)
    )
  },

  // ✅ Get assignments by video ID
  getAssignmentsByVideoId: (videoId) => {
    return get().assignments.filter(
      (assignment) => String(assignment.videoId) === String(videoId)
    )
  },

  // ✅ Get active assignments for an outlet (with date filtering)
  getActiveAssignmentsForOutlet: (outletId, now = new Date()) => {
    const assignments = get().getAssignmentsByOutletId(outletId)
    const nowMs = now.getTime()

    return assignments.filter((assignment) => {
      if (!assignment.active) return false

      const startAt = assignment.startAt
        ? new Date(assignment.startAt).getTime()
        : null
      const endAt = assignment.endAt
        ? new Date(assignment.endAt).getTime()
        : null

      if (startAt && nowMs < startAt) return false
      if (endAt && nowMs > endAt) return false

      return true
    })
  },

  // ✅ Toggle assignment active status
  toggleAssignmentActive: async (assignmentId) => {
    const assignment = get().assignments.find((a) => a._id === assignmentId)
    if (!assignment) throw new Error("Assignment not found")

    return get().updateAssignment(assignmentId, {
      active: !assignment.active,
    })
  },

  // ✅ Clear current assignment selection
  clearCurrentAssignment: () => {
    set({ currentAssignment: null })
  },

  // ✅ Clear all data (reset)
  clearAssignments: () => {
    set({ assignments: [], currentAssignment: null, error: "" })
  },
}))
