// src/stores/terminalStore.js
import { create } from "zustand";

const API =
  window.location.hostname === "localhost"
    ? process.env.REACT_APP_BACKEND_API_TEST
    : process.env.REACT_APP_BACKEND_API;

async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const msg =
      (isJson && data && (data.error || data.message)) ||
      (!isJson && typeof data === "string" && data.trim()) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export const useTerminalStore = create((set, get) => ({
  terminals: [],
  currentTerminal: null,
  loading: false,
  error: "",

  // ✅ Fetch all terminals with optional filtering
  fetchTerminals: async (query = {}) => {
    set({ loading: true, error: "" });
    try {
      const qs = new URLSearchParams();
      if (query.outletId) qs.set("outletId", query.outletId);
      if (query.active !== undefined) qs.set("active", query.active);

      const res = await fetch(
        `${API}/terminals${qs.toString() ? `?${qs.toString()}` : ""}`,
      );
      const data = await safeJson(res);

      set({ terminals: data, loading: false });
      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to fetch terminals",
      });
      throw err;
    }
  },

  createTerminal: async (outletId, terminalData) => {
    set({ loading: true, error: "" });
    try {
      const {
        code,
        description,
        active = true,
        isGameDisabled = false,
      } = terminalData; // ✅ Added isGameDisabled

      if (!code) {
        throw new Error("code is required");
      }

      const res = await fetch(`${API}/terminals/outlets/${outletId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          description,
          active,
          isGameDisabled, // ✅ Send initial game disabled status
        }),
      });

      const data = await safeJson(res);

      set((state) => ({
        terminals: [data, ...state.terminals],
        currentTerminal: data,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to create terminal",
      });
      throw err;
    }
  },

  // ✅ Get single terminal by ID
  getTerminal: async (terminalId) => {
    set({ loading: true, error: "" });
    try {
      if (!terminalId) throw new Error("Missing terminalId");

      const res = await fetch(`${API}/terminals/${terminalId}`);
      const data = await safeJson(res);

      set({
        currentTerminal: data,
        loading: false,
      });

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to fetch terminal",
      });
      throw err;
    }
  },

  // ✅ Update terminal
  updateTerminal: async (terminalId, updateData) => {
    set({ loading: true, error: "" });
    try {
      if (!terminalId) throw new Error("Missing terminalId");

      const res = await fetch(`${API}/terminals/${terminalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await safeJson(res);

      set((state) => ({
        terminals: state.terminals.map((terminal) =>
          terminal._id === terminalId ? data : terminal,
        ),
        currentTerminal: data,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to update terminal",
      });
      throw err;
    }
  },
  updateGameLaunched: async (terminalId, isLaunchedGame) => {
    set({ loading: true, error: "" });
    try {
      if (!terminalId) throw new Error("Missing terminalId");
      if (typeof isLaunchedGame !== "boolean")
        throw new Error("isLaunchedGame must be a boolean");

      const res = await fetch(`${API}/terminals/${terminalId}/game-launched`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isLaunchedGame }),
      });

      const data = await safeJson(res);

      set((state) => ({
        terminals: state.terminals.map((terminal) =>
          terminal._id === terminalId ? data : terminal,
        ),
        currentTerminal:
          state.currentTerminal?._id === terminalId
            ? data
            : state.currentTerminal,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to update game launched status",
      });
      throw err;
    }
  },

  // ✅ Reset game launched status
  resetGameLaunched: async (terminalId) => {
    set({ loading: true, error: "" });
    try {
      if (!terminalId) throw new Error("Missing terminalId");

      const res = await fetch(`${API}/terminals/${terminalId}/game-reset`, {
        method: "PUT",
      });

      const data = await safeJson(res);

      set((state) => ({
        terminals: state.terminals.map((terminal) =>
          terminal._id === terminalId
            ? { ...data, isLaunchedGame: false }
            : terminal,
        ),
        currentTerminal:
          state.currentTerminal?._id === terminalId
            ? { ...data, isLaunchedGame: false }
            : state.currentTerminal,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to reset game launched status",
      });
      throw err;
    }
  },

  // ✅ Get game status by device key (for terminal device)
  getGameStatusByDeviceKey: async (deviceKey) => {
    try {
      if (!deviceKey) throw new Error("Missing deviceKey");

      const res = await fetch(
        `${API}/terminals/device/${deviceKey}/game-status`,
      );
      const data = await safeJson(res);

      return data;
    } catch (err) {
      console.error("Failed to get game status:", err);
      throw err;
    }
  },
  // ✅ Lock/Unlock terminal
  lockTerminal: async (terminalId, isLocked) => {
    set({ loading: true, error: "" });
    try {
      if (!terminalId) throw new Error("Missing terminalId");
      if (typeof isLocked !== "boolean")
        throw new Error("isLocked must be a boolean");

      const res = await fetch(`${API}/terminals/${terminalId}/lock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isLocked }),
      });

      const data = await safeJson(res);

      set((state) => ({
        terminals: state.terminals.map((terminal) =>
          terminal._id === terminalId ? data : terminal,
        ),
        currentTerminal:
          state.currentTerminal?._id === terminalId
            ? data
            : state.currentTerminal,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to lock/unlock terminal",
      });
      throw err;
    }
  },

  // ✅ NEW: Toggle game disabled status
  toggleGameDisabled: async (terminalId, isGameDisabled) => {
    set({ loading: true, error: "" });
    try {
      if (!terminalId) throw new Error("Missing terminalId");
      if (typeof isGameDisabled !== "boolean")
        throw new Error("isGameDisabled must be a boolean");

      const res = await fetch(`${API}/terminals/${terminalId}/game-disabled`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isGameDisabled }),
      });

      const data = await safeJson(res);

      set((state) => ({
        terminals: state.terminals.map((terminal) =>
          terminal._id === terminalId ? data : terminal,
        ),
        currentTerminal:
          state.currentTerminal?._id === terminalId
            ? data
            : state.currentTerminal,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to toggle game disabled status",
      });
      throw err;
    }
  },

  // ✅ Delete terminal
  deleteTerminal: async (terminalId) => {
    set({ loading: true, error: "" });
    try {
      if (!terminalId) throw new Error("Missing terminalId");

      const res = await fetch(`${API}/terminals/${terminalId}`, {
        method: "DELETE",
      });

      const data = await safeJson(res);

      set((state) => ({
        terminals: state.terminals.filter(
          (terminal) => terminal._id !== terminalId,
        ),
        currentTerminal:
          state.currentTerminal?._id === terminalId
            ? null
            : state.currentTerminal,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to delete terminal",
      });
      throw err;
    }
  },

  // ✅ Alias for the new launcher pairing flow. Removing a terminal lets that PC regenerate a new launcher ID.
  removeTerminal: async (terminalId) => {
    return get().deleteTerminal(terminalId);
  },

  // ✅ Delete multiple terminals
  deleteMultipleTerminals: async (terminalIds) => {
    set({ loading: true, error: "" });
    try {
      if (
        !terminalIds ||
        !Array.isArray(terminalIds) ||
        terminalIds.length === 0
      ) {
        throw new Error("terminalIds array is required");
      }

      const promises = terminalIds.map((id) =>
        fetch(`${API}/terminals/${id}`, {
          method: "DELETE",
        }).then((res) => safeJson(res)),
      );

      await Promise.all(promises);

      set((state) => ({
        terminals: state.terminals.filter(
          (terminal) => !terminalIds.includes(terminal._id),
        ),
        currentTerminal:
          state.currentTerminal &&
          terminalIds.includes(state.currentTerminal._id)
            ? null
            : state.currentTerminal,
        loading: false,
      }));

      return { message: "Terminals deleted successfully" };
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to delete terminals",
      });
      throw err;
    }
  },

  // ✅ Get terminals by outlet ID
  getTerminalsByOutletId: (outletId) => {
    return get().terminals.filter((terminal) => terminal.outletId === outletId);
  },

  // ✅ Get terminal by deviceKey
  getTerminalByDeviceKey: (deviceKey) => {
    return get().terminals.find((terminal) => terminal.deviceKey === deviceKey);
  },

  // ✅ Update terminal status (lastSeenAt, lastStatus)
  updateTerminalStatus: async (terminalId, statusData) => {
    try {
      if (!terminalId) throw new Error("Missing terminalId");

      const res = await fetch(`${API}/terminals/${terminalId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(statusData),
      });

      const data = await safeJson(res);

      // Update in local state
      set((state) => ({
        terminals: state.terminals.map((terminal) =>
          terminal._id === terminalId
            ? {
                ...terminal,
                lastSeenAt: new Date().toISOString(),
                lastStatus: {
                  ...terminal.lastStatus,
                  ...statusData,
                  updatedAt: new Date(),
                },
              }
            : terminal,
        ),
      }));

      return data;
    } catch (err) {
      throw err;
    }
  },

  // ✅ Clear current terminal selection
  clearCurrentTerminal: () => {
    set({ currentTerminal: null });
  },

  // ✅ Clear all data (reset)
  clearTerminals: () => {
    set({ terminals: [], currentTerminal: null, error: "" });
  },
}));
