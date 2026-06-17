// stores/promotionDocumentStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import useAuthStore from "./authStore"; // Import auth store to get sessionId

const usePromotionDocumentStore = create(
  persist(
    (set, get) => ({
      // State
      documents: [],
      currentDocument: null,
      loading: false,
      error: null,
      pagination: null,
      ws: null,
      isWebSocketConnected: false,

      // Helper to get headers with auth
      getAuthHeaders: () => {
        const { token, sessionId } = useAuthStore.getState();
        const headers = {
          Authorization: `Bearer ${token}`,
        };
        if (sessionId) {
          headers["X-Session-ID"] = sessionId;
        }
        return headers;
      },

      // FETCH ALL DOCUMENTS (Admin)
      fetchAllDocuments: async (API_URL, token, params = {}) => {
        try {
          set({ loading: true, error: null });
          const queryParams = new URLSearchParams(params).toString();
          const url = `${API_URL}/promotions${queryParams ? `?${queryParams}` : ""}`;

          const headers = get().getAuthHeaders();

          const res = await fetch(url, { headers });

          if (!res.ok) {
            if (res.status === 401) {
              const errorData = await res.json();
              if (errorData.code === "SESSION_EXPIRED") {
                // Clear auth state
                useAuthStore.getState().logout();
                throw new Error("Session expired. Please login again.");
              }
              throw new Error("Not authorized. Please login again.");
            }
            throw new Error("Failed to fetch documents");
          }
          const data = await res.json();

          set({
            documents: data.data,
            pagination: data.pagination,
            loading: false,
          });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchPublicDocuments: async (API_URL, params = {}) => {
        try {
          set({ loading: true, error: null });
          const queryParams = new URLSearchParams(params).toString();
          const url = `${API_URL}/promotions/public${queryParams ? `?${queryParams}` : ""}`;

          // ✅ No headers needed for public endpoints
          const res = await fetch(url);
          if (!res.ok) throw new Error("Failed to fetch public documents");
          const data = await res.json();

          set({
            documents: data.data,
            pagination: data.pagination,
            loading: false,
          });
          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // FETCH SINGLE DOCUMENT BY SLUG (Public - No auth)
      fetchDocumentBySlug: async (API_URL, slug) => {
        try {
          set({ loading: true, error: null, currentDocument: null });
          // ✅ Using public endpoint
          const url = `${API_URL}/promotions/public/${slug}`;

          // ✅ No headers needed
          const res = await fetch(url);
          if (!res.ok) throw new Error("Document not found");
          const data = await res.json();

          // Only return if the promotion is active (isShow = true)
          // Backend already filters this, but we can double-check
          if (!data.data.isShow) {
            throw new Error("Promotion not available");
          }

          set({ currentDocument: data.data, loading: false });
          return data.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // FETCH SINGLE DOCUMENT BY ID (Admin)
      fetchDocumentById: async (API_URL, id, token) => {
        try {
          set({ loading: true, error: null });

          const headers = get().getAuthHeaders();

          const res = await fetch(`${API_URL}/promotions/id/${id}`, {
            headers,
          });

          if (!res.ok) throw new Error("Document not found");
          const data = await res.json();

          set({ currentDocument: data.data, loading: false });
          return data.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // CREATE DOCUMENT
      createDocument: async (API_URL, formData, token) => {
        try {
          set({ loading: true, error: null });

          const headers = get().getAuthHeaders();
          // Don't set Content-Type - browser will set it with boundary for FormData

          const res = await fetch(`${API_URL}/promotions`, {
            method: "POST",
            headers,
            body: formData,
          });

          if (!res.ok) {
            const error = await res.json();
            if (res.status === 401 && error.code === "SESSION_EXPIRED") {
              useAuthStore.getState().logout();
              throw new Error("Session expired. Please login again.");
            }
            throw new Error(error.message || "Failed to create document");
          }

          const data = await res.json();

          set((state) => ({
            documents: [data.data, ...state.documents],
            loading: false,
          }));

          return data.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // UPDATE DOCUMENT
      updateDocument: async (API_URL, id, formData, token) => {
        try {
          set({ loading: true, error: null });

          const headers = get().getAuthHeaders();

          const res = await fetch(`${API_URL}/promotions/${id}`, {
            method: "PUT",
            headers,
            body: formData,
          });

          if (!res.ok) {
            const error = await res.json();
            if (res.status === 401 && error.code === "SESSION_EXPIRED") {
              useAuthStore.getState().logout();
              throw new Error("Session expired. Please login again.");
            }
            throw new Error(error.message || "Failed to update document");
          }

          const data = await res.json();

          set((state) => ({
            documents: state.documents.map((doc) =>
              doc._id === id ? data.data : doc,
            ),
            currentDocument:
              state.currentDocument?._id === id
                ? data.data
                : state.currentDocument,
            loading: false,
          }));

          return data.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // UPDATE VISIBILITY
      updateVisibility: async (API_URL, id, isShow, token) => {
        try {
          set({ loading: true, error: null });

          const headers = get().getAuthHeaders();

          const res = await fetch(`${API_URL}/promotions/visibility/${id}`, {
            method: "PATCH",
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ isShow }),
          });

          if (!res.ok) {
            if (res.status === 401) {
              const errorData = await res.json();
              if (errorData.code === "SESSION_EXPIRED") {
                useAuthStore.getState().logout();
                throw new Error("Session expired. Please login again.");
              }
              throw new Error("Not authorized");
            }
            throw new Error("Failed to update visibility");
          }
          const data = await res.json();

          set((state) => ({
            documents: state.documents.map((doc) =>
              doc._id === id ? data.data : doc,
            ),
            currentDocument:
              state.currentDocument?._id === id
                ? data.data
                : state.currentDocument,
            loading: false,
          }));

          return data.data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // DELETE DOCUMENT
      deleteDocument: async (API_URL, id, token) => {
        try {
          set({ loading: true, error: null });

          const headers = get().getAuthHeaders();

          const res = await fetch(`${API_URL}/promotions/${id}`, {
            method: "DELETE",
            headers,
          });

          if (!res.ok) {
            if (res.status === 401) {
              const errorData = await res.json();
              if (errorData.code === "SESSION_EXPIRED") {
                useAuthStore.getState().logout();
                throw new Error("Session expired. Please login again.");
              }
              throw new Error("Not authorized");
            }
            throw new Error("Failed to delete document");
          }
          const data = await res.json();

          set((state) => ({
            documents: state.documents.filter((doc) => doc._id !== id),
            currentDocument:
              state.currentDocument?._id === id ? null : state.currentDocument,
            loading: false,
          }));

          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // BULK DELETE DOCUMENTS
      bulkDeleteDocuments: async (API_URL, ids, token) => {
        try {
          set({ loading: true, error: null });

          const headers = get().getAuthHeaders();

          const res = await fetch(`${API_URL}/promotions/bulk-delete`, {
            method: "POST",
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ids }),
          });

          if (!res.ok) {
            if (res.status === 401) {
              const errorData = await res.json();
              if (errorData.code === "SESSION_EXPIRED") {
                useAuthStore.getState().logout();
                throw new Error("Session expired. Please login again.");
              }
              throw new Error("Not authorized");
            }
            throw new Error("Failed to delete documents");
          }
          const data = await res.json();

          set((state) => ({
            documents: state.documents.filter((doc) => !ids.includes(doc._id)),
            loading: false,
          }));

          return data;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // WebSocket Integration
      initWebSocket: (wsUrl, token) => {
        const { sessionId } = useAuthStore.getState();
        const ws = new WebSocket(
          `${wsUrl}?token=${token}&sessionId=${sessionId}`,
        );

        ws.onopen = () => {
          console.log("Promotion Document WebSocket connected");
          set({ isWebSocketConnected: true, ws });
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "PROMOTION_DOCUMENT_UPDATED") {
              get().handleWebSocketMessage(data);
            }
          } catch (error) {
            console.error("WebSocket message error:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          set({ isWebSocketConnected: false });
        };

        ws.onclose = () => {
          console.log("Promotion Document WebSocket disconnected");
          set({ isWebSocketConnected: false, ws: null });

          // Auto-reconnect after 5 seconds
          setTimeout(() => {
            if (token) get().initWebSocket(wsUrl, token);
          }, 5000);
        };

        set({ ws });
      },

      handleWebSocketMessage: (message) => {
        const { action, data } = message;

        switch (action) {
          case "create":
            set((state) => ({
              documents: [data, ...state.documents],
            }));
            break;

          case "update":
            set((state) => ({
              documents: state.documents.map((doc) =>
                doc._id === data._id ? data : doc,
              ),
              currentDocument:
                state.currentDocument?._id === data._id
                  ? data
                  : state.currentDocument,
            }));
            break;

          case "visibility_update":
            set((state) => ({
              documents: state.documents.map((doc) =>
                doc._id === data._id ? data : doc,
              ),
              currentDocument:
                state.currentDocument?._id === data._id
                  ? data
                  : state.currentDocument,
            }));
            break;

          case "delete":
            set((state) => ({
              documents: state.documents.filter((doc) => doc._id !== data.id),
              currentDocument:
                state.currentDocument?._id === data.id
                  ? null
                  : state.currentDocument,
            }));
            break;

          case "bulk_delete":
            set((state) => ({
              documents: state.documents.filter(
                (doc) => !data.ids.includes(doc._id),
              ),
            }));
            break;

          default:
            console.log("Unknown action:", action);
        }
      },

      closeWebSocket: () => {
        const { ws } = get();
        if (ws) {
          ws.close();
          set({ ws: null, isWebSocketConnected: false });
        }
      },

      clearError: () => set({ error: null }),

      reset: () => {
        get().closeWebSocket();
        set({
          documents: [],
          currentDocument: null,
          loading: false,
          error: null,
          pagination: null,
          isWebSocketConnected: false,
          ws: null,
        });
      },
    }),
    {
      name: "promotion-document-storage",
      partialize: (state) => ({
        // Only persist non-sensitive data
        documents: state.documents.filter((doc) => doc.isShow),
      }),
    },
  ),
);

export default usePromotionDocumentStore;
