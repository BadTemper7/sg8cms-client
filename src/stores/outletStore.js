// src/stores/outletStore.js
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

export const useOutletStore = create((set, get) => ({
  outlets: [],
  currentOutlet: null,
  loading: false,
  error: "",

  // ✅ Fetch all outlets with optional filtering
  fetchOutlets: async (query = {}) => {
    set({ loading: true, error: "" });
    try {
      const qs = new URLSearchParams();
      if (query.active !== undefined) qs.set("active", query.active);
      if (query.siteValue) qs.set("siteValue", query.siteValue);

      const res = await fetch(
        `${API}/outlets${qs.toString() ? `?${qs.toString()}` : ""}`,
      );
      const data = await safeJson(res);

      set({ outlets: data, loading: false });
      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to fetch outlets",
      });
      throw err;
    }
  },

  // ✅ Create a new outlet
  createOutlet: async (outletData) => {
    set({ loading: true, error: "" });
    try {
      const { code, name, location, siteValue, active = true } = outletData;

      if (!code || !name || !siteValue) {
        throw new Error("code, name, and siteValue are required");
      }

      const res = await fetch(`${API}/outlets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          name,
          location,
          siteValue,
          active,
        }),
      });

      const data = await safeJson(res);

      set((state) => ({
        outlets: [data, ...state.outlets],
        currentOutlet: data,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to create outlet",
      });
      throw err;
    }
  },

  // ✅ Get single outlet by ID
  getOutlet: async (outletId) => {
    set({ loading: true, error: "" });
    try {
      if (!outletId) throw new Error("Missing outletId");

      const res = await fetch(`${API}/outlets/${outletId}`);
      const data = await safeJson(res);

      set({
        currentOutlet: data,
        loading: false,
      });

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to fetch outlet",
      });
      throw err;
    }
  },

  // ✅ Update outlet
  updateOutlet: async (outletId, updateData) => {
    set({ loading: true, error: "" });
    try {
      if (!outletId) throw new Error("Missing outletId");

      const res = await fetch(`${API}/outlets/${outletId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await safeJson(res);

      set((state) => ({
        outlets: state.outlets.map((outlet) =>
          outlet._id === outletId ? data : outlet,
        ),
        currentOutlet: data,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to update outlet",
      });
      throw err;
    }
  },

  // ✅ Delete outlet
  deleteOutlet: async (outletId) => {
    set({ loading: true, error: "" });
    try {
      if (!outletId) throw new Error("Missing outletId");

      const res = await fetch(`${API}/outlets/${outletId}`, {
        method: "DELETE",
      });

      const data = await safeJson(res);

      set((state) => ({
        outlets: state.outlets.filter((outlet) => outlet._id !== outletId),
        currentOutlet:
          state.currentOutlet?._id === outletId ? null : state.currentOutlet,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to delete outlet",
      });
      throw err;
    }
  },

  // ✅ Delete multiple outlets
  deleteMultipleOutlets: async (outletIds) => {
    set({ loading: true, error: "" });
    try {
      if (!outletIds || !Array.isArray(outletIds) || outletIds.length === 0) {
        throw new Error("outletIds array is required");
      }

      // Delete outlets one by one or implement bulk delete in backend
      const promises = outletIds.map((id) =>
        fetch(`${API}/outlets/${id}`, {
          method: "DELETE",
        }).then((res) => safeJson(res)),
      );

      await Promise.all(promises);

      set((state) => ({
        outlets: state.outlets.filter(
          (outlet) => !outletIds.includes(outlet._id),
        ),
        currentOutlet:
          state.currentOutlet && outletIds.includes(state.currentOutlet._id)
            ? null
            : state.currentOutlet,
        loading: false,
      }));

      return { message: "Outlets deleted successfully" };
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to delete outlets",
      });
      throw err;
    }
  },

  // ✅ Get outlet by code (client-side search)
  getOutletByCode: (code) => {
    return get().outlets.find((outlet) => outlet.code === code);
  },

  // ✅ Get outlet by siteValue (client-side search)
  getOutletBySiteValue: (siteValue) => {
    return get().outlets.find((outlet) => outlet.siteValue === siteValue);
  },

  // ✅ Toggle outlet active status
  toggleOutletActive: async (outletId) => {
    const outlet = get().outlets.find((o) => o._id === outletId);
    if (!outlet) throw new Error("Outlet not found");

    return get().updateOutlet(outletId, {
      active: !outlet.active,
    });
  },

  // ✅ Clear current outlet selection
  clearCurrentOutlet: () => {
    set({ currentOutlet: null });
  },

  // ✅ Clear all data (reset)
  clearOutlets: () => {
    set({ outlets: [], currentOutlet: null, error: "" });
  },
}));
