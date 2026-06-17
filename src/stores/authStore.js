// stores/authStore.js - Add these helper methods
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      sessionId: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      sidebarOpen: true,
      hasHydrated: false,

      setHasHydrated: (state) => set({ hasHydrated: state }),

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      login: async (apiUrl, username, password) => {
        set({ loading: true, error: null });

        try {
          const response = await fetch(`${apiUrl}/users/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Login failed");
          }

          if (data.token) {
            const userData = {
              ...data.user,
              modules: data.user.modules || [],
            };

            set({
              user: userData,
              token: data.token,
              sessionId: data.sessionId,
              isAuthenticated: true,
              loading: false,
              error: null,
            });

            return { success: true, data: { ...data, user: userData } };
          }

          throw new Error("Invalid login response");
        } catch (error) {
          set({
            loading: false,
            error: error.message,
            isAuthenticated: false,
          });

          return { success: false, error: error.message };
        }
      },

      logout: async (apiUrl) => {
        const { token, sessionId } = get();

        try {
          if (token && sessionId) {
            await fetch(`${apiUrl}/users/logout`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                "X-Session-ID": sessionId,
              },
              body: JSON.stringify({ sessionId }),
            });
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          set({
            user: null,
            token: null,
            sessionId: null,
            isAuthenticated: false,
            loading: false,
            error: null,
          });
        }
      },

      checkSession: async (apiUrl) => {
        const { token, sessionId } = get();

        if (!token || !sessionId) {
          set({ isAuthenticated: false });
          return { valid: false, reason: "missing_auth" };
        }

        try {
          const response = await fetch(`${apiUrl}/users/session`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Session-ID": sessionId,
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              set({
                user: null,
                token: null,
                sessionId: null,
                isAuthenticated: false,
              });
              return { valid: false, reason: "unauthorized" };
            }
            return { valid: false, reason: "request_failed" };
          }

          const data = await response.json();

          if (data.currentSessionId && data.currentSessionId === sessionId) {
            // ✅ Fetch fresh user profile to sync modules/roles
            try {
              const profileRes = await fetch(`${apiUrl}/users/me`, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "X-Session-ID": sessionId,
                },
              });

              if (profileRes.ok) {
                const profileData = await profileRes.json();
                set({
                  isAuthenticated: true,
                  user: { ...profileData, modules: profileData.modules || [] },
                });
              } else {
                // Profile fetch failed but session is valid — keep existing user
                set({ isAuthenticated: true });
              }
            } catch {
              // Network error on profile — keep existing user
              set({ isAuthenticated: true });
            }

            return { valid: true };
          }

          set({
            user: null,
            token: null,
            sessionId: null,
            isAuthenticated: false,
          });
          return { valid: false, reason: "session_mismatch" };
        } catch (error) {
          console.error("Session check error:", error);
          return { valid: false, reason: "network_error" };
        }
      },

      clearError: () => set({ error: null }),

      // Helper method to check if user has access to a module
      hasModuleAccess: (moduleName) => {
        const { user, isAuthenticated } = get();
        if (!isAuthenticated || !user) return false;

        // SUPER ADMIN ALWAYS HAS ACCESS TO ALL MODULES
        if (user.roles === "superadmin") return true;

        // Regular users check their assigned modules
        return user.modules?.includes(moduleName) || false;
      },

      // Helper method to get user's accessible modules
      getUserModules: () => {
        const { user, isAuthenticated } = get();
        if (!isAuthenticated || !user) return [];

        // SUPER ADMIN GETS ALL MODULES
        if (user.roles === "superadmin") {
          return ["dashboard", "outlets", "promotions", "videoAds", "users"];
        }

        // Regular users return their assigned modules
        return user.modules || [];
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        sessionId: state.sessionId,
        isAuthenticated: state.isAuthenticated,
        sidebarOpen: state.sidebarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export default useAuthStore;
