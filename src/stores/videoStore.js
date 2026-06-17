// src/stores/videoStore.js
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

export const useVideoStore = create((set, get) => ({
  videos: [],
  currentVideo: null,
  videoAssignments: {}, // Store assignments by videoId
  loading: false,
  error: "",

  // ✅ Fetch all videos with optional filtering
  fetchVideos: async (query = {}) => {
    set({ loading: true, error: "" });
    try {
      const qs = new URLSearchParams();
      if (query.active !== undefined) qs.set("active", query.active);

      const res = await fetch(
        `${API}/videos${qs.toString() ? `?${qs.toString()}` : ""}`,
      );
      const data = await safeJson(res);

      set({ videos: data, loading: false });
      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to fetch videos",
      });
      throw err;
    }
  },

  // ✅ Get outlets assigned to a specific video
  getOutletsForVideo: async (videoId) => {
    set({ loading: true, error: "" });
    try {
      if (!videoId) throw new Error("Missing videoId");

      const res = await fetch(`${API}/videos/${videoId}/outlets`);
      const data = await safeJson(res);

      // Store assignments for this video
      set((state) => ({
        videoAssignments: {
          ...state.videoAssignments,
          [videoId]: data,
        },
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to fetch video outlets",
      });
      throw err;
    }
  },

  // ✅ Get cached outlets for a video
  getCachedOutletsForVideo: (videoId) => {
    return get().videoAssignments[videoId] || null;
  },

  // ✅ Create a new video (with file upload)
  createVideo: async (videoData, file) => {
    set({ loading: true, error: "" });
    try {
      const { title, description, active = true } = videoData;

      if (!title) throw new Error("title is required");
      if (!file) throw new Error("file is required");

      const formData = new FormData();
      formData.append("title", title);
      if (description) formData.append("description", description);
      formData.append("active", String(active));
      formData.append("file", file);

      const res = await fetch(`${API}/videos`, {
        method: "POST",
        body: formData,
      });

      const data = await safeJson(res);

      set((state) => ({
        videos: [data, ...state.videos],
        currentVideo: data,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to create video",
      });
      throw err;
    }
  },

  // ✅ Get single video by ID
  getVideo: async (videoId) => {
    set({ loading: true, error: "" });
    try {
      if (!videoId) throw new Error("Missing videoId");

      const res = await fetch(`${API}/videos/${videoId}`);
      const data = await safeJson(res);

      set({
        currentVideo: data,
        loading: false,
      });

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to fetch video",
      });
      throw err;
    }
  },

  // ✅ Replace video file + update metadata in one request
  replaceVideo: async (videoId, updateData, file) => {
    set({ loading: true, error: "" });
    try {
      if (!videoId) throw new Error("Missing videoId");
      if (!file) throw new Error("file is required for replacement");

      const formData = new FormData();
      formData.append("file", file);
      if (updateData.title) formData.append("title", updateData.title);
      if (updateData.description !== undefined)
        formData.append("description", updateData.description);
      formData.append("active", String(updateData.active ?? true));

      const res = await fetch(`${API}/videos/${videoId}/replace`, {
        method: "PUT",
        body: formData,
      });

      const data = await safeJson(res);

      set((state) => ({
        videos: state.videos.map((video) =>
          video._id === videoId ? data : video,
        ),
        currentVideo: data,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to replace video",
      });
      throw err;
    }
  },

  // ✅ Update video (metadata only)
  updateVideo: async (videoId, updateData) => {
    set({ loading: true, error: "" });
    try {
      if (!videoId) throw new Error("Missing videoId");

      const res = await fetch(`${API}/videos/${videoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data = await safeJson(res);

      set((state) => ({
        videos: state.videos.map((video) =>
          video._id === videoId ? data : video,
        ),
        currentVideo: data,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to update video",
      });
      throw err;
    }
  },

  // ✅ Delete video (removes local file on server)
  deleteVideo: async (videoId) => {
    set({ loading: true, error: "" });
    try {
      if (!videoId) throw new Error("Missing videoId");

      const res = await fetch(`${API}/videos/${videoId}`, {
        method: "DELETE",
      });

      const data = await safeJson(res);

      set((state) => ({
        videos: state.videos.filter((video) => video._id !== videoId),
        currentVideo:
          state.currentVideo?._id === videoId ? null : state.currentVideo,
        // Remove assignments cache for this video
        videoAssignments: Object.keys(state.videoAssignments).reduce(
          (acc, key) => {
            if (key !== videoId) acc[key] = state.videoAssignments[key];
            return acc;
          },
          {},
        ),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to delete video",
      });
      throw err;
    }
  },

  // ✅ Delete multiple videos
  deleteMultipleVideos: async (videoIds) => {
    set({ loading: true, error: "" });
    try {
      if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
        throw new Error("videoIds array is required");
      }

      const promises = videoIds.map((id) =>
        fetch(`${API}/videos/${id}`, { method: "DELETE" }).then((res) =>
          safeJson(res),
        ),
      );

      await Promise.all(promises);

      set((state) => ({
        videos: state.videos.filter((video) => !videoIds.includes(video._id)),
        currentVideo:
          state.currentVideo && videoIds.includes(state.currentVideo._id)
            ? null
            : state.currentVideo,
        // Remove assignments cache for deleted videos
        videoAssignments: Object.keys(state.videoAssignments).reduce(
          (acc, key) => {
            if (!videoIds.includes(key)) acc[key] = state.videoAssignments[key];
            return acc;
          },
          {},
        ),
        loading: false,
      }));

      return { message: "Videos deleted successfully" };
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to delete videos",
      });
      throw err;
    }
  },

  // ✅ Get video by filename
  getVideoByFilename: (filename) => {
    return get().videos.find((video) => video.filename === filename);
  },

  // ✅ Toggle video active status
  toggleVideoActive: async (videoId) => {
    const video = get().videos.find((v) => v._id === videoId);
    if (!video) throw new Error("Video not found");

    return get().updateVideo(videoId, {
      active: !video.active,
    });
  },

  // ✅ Clear assignments cache for a video
  clearVideoAssignmentsCache: (videoId) => {
    if (videoId) {
      set((state) => {
        const newAssignments = { ...state.videoAssignments };
        delete newAssignments[videoId];
        return { videoAssignments: newAssignments };
      });
    } else {
      set({ videoAssignments: {} });
    }
  },

  // ✅ Clear current video selection
  clearCurrentVideo: () => {
    set({ currentVideo: null });
  },

  // ✅ Clear all data (reset)
  clearVideos: () => {
    set({ videos: [], currentVideo: null, videoAssignments: {}, error: "" });
  },
}));
