// src/stores/userStore.js
import { create } from "zustand";

const useUserStore = create((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async (apiUrl, token, fetchWithAuth) => {
    set({ loading: true, error: null });

    try {
      const response = await fetchWithAuth(`${apiUrl}/users`, {
        method: "GET",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch users");
      }

      const data = await response.json();
      set({ users: data, loading: false });
      return { success: true, data };
    } catch (error) {
      if (error.message === "Session expired") {
        return { success: false, error: error.message, sessionExpired: true };
      }
      set({ loading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  createUser: async (apiUrl, token, userData, fetchWithAuth) => {
    set({ loading: true, error: null });

    try {
      const response = await fetchWithAuth(`${apiUrl}/users/create`, {
        method: "POST",
        body: JSON.stringify({
          username: userData.username,
          password: userData.password,
          roles: userData.roles,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email || "",
          contactNumber: userData.contactNumber || "",
          departmentId: userData.departmentId || null,
          outletId: userData.outletId || null,
          modules: userData.modules || [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }

      const data = await response.json();
      await get().fetchUsers(apiUrl, token, fetchWithAuth);

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

  updateUser: async (apiUrl, token, userId, userData, fetchWithAuth) => {
    set({ loading: true, error: null });

    try {
      const requestBody = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        contactNumber: userData.contactNumber,
        roles: userData.roles,
        departmentId: userData.departmentId || null,
        outletId: userData.outletId || null,
        modules: userData.modules || [],
      };

      console.log("Update user request body:", requestBody);

      const response = await fetchWithAuth(`${apiUrl}/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }

      const data = await response.json();
      await get().fetchUsers(apiUrl, token, fetchWithAuth);

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

  deleteUser: async (apiUrl, token, userId, fetchWithAuth) => {
    set({ loading: true, error: null });

    try {
      const response = await fetchWithAuth(`${apiUrl}/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }

      const data = await response.json();

      set((state) => ({
        users: state.users.filter((user) => user._id !== userId),
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

  deleteManyUsers: async (apiUrl, token, userIds, fetchWithAuth) => {
    set({ loading: true, error: null });

    try {
      const response = await fetchWithAuth(`${apiUrl}/users/bulk-delete`, {
        method: "POST",
        body: JSON.stringify({ ids: userIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete users");
      }

      const data = await response.json();

      set((state) => ({
        users: state.users.filter((user) => !userIds.includes(user._id)),
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

  toggleUserStatus: async (
    apiUrl,
    token,
    userId,
    currentStatus,
    fetchWithAuth,
  ) => {
    set({ loading: true, error: null });

    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const response = await fetchWithAuth(`${apiUrl}/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user status");
      }

      const data = await response.json();

      set((state) => ({
        users: state.users.map((user) =>
          user._id === userId
            ? { ...user, active: newStatus === "active", status: newStatus }
            : user,
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

  resetPassword: async (apiUrl, token, userId, fetchWithAuth) => {
    set({ loading: true, error: null });

    try {
      const response = await fetchWithAuth(
        `${apiUrl}/users/${userId}/reset-password`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }

      const data = await response.json();

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

  clearError: () => set({ error: null }),
}));

export default useUserStore;
