// src/stores/departmentStore.js
import { create } from "zustand";

const useDepartmentStore = create((set, get) => ({
  departments: [],
  loading: false,
  error: null,

  // Fetch all departments
  fetchDepartments: async (apiUrl, fetchWithAuth) => {
    set({ loading: true, error: null });
    try {
      const response = await fetchWithAuth(`${apiUrl}/departments`);
      const data = await response.json();
      set({ departments: data, loading: false });
      return { success: true, data };
    } catch (error) {
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Create department
  createDepartment: async (apiUrl, departmentData, fetchWithAuth) => {
    set({ loading: true, error: null });
    try {
      const response = await fetchWithAuth(`${apiUrl}/departments`, {
        method: "POST",
        body: JSON.stringify(departmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create department");
      }

      const data = await response.json();

      // Refresh departments list
      await get().fetchDepartments(apiUrl, fetchWithAuth);

      set({ loading: false });
      return { success: true, data };
    } catch (error) {
      if (error.message === "Session expired") {
        return { success: false, error: error.message, sessionExpired: true };
      }
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Update department
  updateDepartment: async (apiUrl, id, departmentData, fetchWithAuth) => {
    set({ loading: true, error: null });
    try {
      const response = await fetchWithAuth(`${apiUrl}/departments/${id}`, {
        method: "PUT",
        body: JSON.stringify(departmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update department");
      }

      const data = await response.json();

      // Update local state
      set((state) => ({
        departments: state.departments.map((dept) =>
          dept._id === id ? { ...dept, ...data } : dept,
        ),
        loading: false,
      }));

      return { success: true, data };
    } catch (error) {
      if (error.message === "Session expired") {
        return { success: false, error: error.message, sessionExpired: true };
      }
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Delete department
  deleteDepartment: async (apiUrl, id, fetchWithAuth) => {
    set({ loading: true, error: null });
    try {
      const response = await fetchWithAuth(`${apiUrl}/departments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete department");
      }

      const data = await response.json();

      // Update local state
      set((state) => ({
        departments: state.departments.filter((dept) => dept._id !== id),
        loading: false,
      }));

      return { success: true, data };
    } catch (error) {
      if (error.message === "Session expired") {
        return { success: false, error: error.message, sessionExpired: true };
      }
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useDepartmentStore;
