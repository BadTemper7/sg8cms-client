import React, { useRef, useState, useEffect, useMemo } from "react";
import { IoClose, IoCloudUploadOutline } from "react-icons/io5";
import { FiUploadCloud, FiCheck, FiRefreshCw } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useVideoStore } from "../../stores/videoStore";
import { useOutletStore } from "../../stores/outletStore";
import { useOutletVideoAssignmentStore } from "../../stores/outletVideoAssignmentStore";
const asdf = {
  terminal: {
    _id: "69eae76d10ea4be2c7f828ae",
    outletId: "69e59951b26c94f678b52076",
    code: "PC-2",
    description: "",
    deviceKey: "7fb24e69f0148add22c97de2e434551b",
    isLocked: false,
    isGameDisabled: false,
    active: true,
    isOnline: false,
    lastSeenAt: "2026-05-12T09:41:23.018Z",
    lastStatus: {
      isPlaying: false,
      videoUrl: "",
      positionSec: 0,
      updatedAt: "2026-05-12T09:41:23.018Z",
    },
    createdAt: "2026-04-24T03:45:49.585Z",
    updatedAt: "2026-05-12T09:41:40.065Z",
    __v: 0,
    isLaunchedGame: true,
  },
  outlet: {
    _id: "69e59951b26c94f678b52076",
    code: "OUTLET-A",
    name: "OUTLET A",
    location: "Quezon City",
    siteValue: "SG8ECA1",
    active: true,
    createdAt: "2026-04-20T03:11:13.810Z",
    updatedAt: "2026-04-20T03:11:13.810Z",
    __v: 0,
  },
  playlist: [
    {
      assignmentId: "6a02f24f38bf076e4346ad0e",
      startAt: null,
      endAt: null,
      isActiveNow: true,
      video: {
        id: "6a02f24f38bf076e4346ad0d",
        title: "Test",
        url: "/videos/outlet/1778577999309-39d01623aa52.mp4",
        secureUrl: "/videos/outlet/1778577999309-39d01623aa52.mp4",
        durationSec: 0,
        format: "mp4",
        bytes: 67276637,
        active: true,
      },
    },
  ],
  isOnline: false,
  offlineThresholdMs: 15000,
};
// For displaying stored ISO into <input type="datetime-local" />
const toLocalInput = (iso) => {
  if (!iso) return "";
  if (typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return `${iso}T00:00`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

// Normalize raw datetime-local string; if date-only, default to 00:00
const normalizeDateTimeLocal = (value) => {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00`;
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
  ) {
    return value;
  }

  return value;
};

// Basic completeness check for datetime-local
const isCompleteDateTimeLocal = (value) => {
  if (!value) return false;
  if (typeof value !== "string") return false;

  // allow date-only too (will become 00:00)
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;

  // standard datetime-local value
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
};

// Convert local datetime to ISO string
const toIsoOrNull = (localString) => {
  if (!localString) return null;
  const normalized = normalizeDateTimeLocal(localString);
  if (!normalized) return null;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const ModalPromotions = ({
  isOpen,
  onClose,
  refresh,
  mode, // "add" | "edit"
  promoData, // video data for edit mode
  onSuccess,
}) => {
  const fileInputRef = useRef(null);
  const selectedOutletsRef = useRef(null);

  // Use the new stores
  const {
    createVideo,
    updateVideo,
    replaceVideo,
    getOutletsForVideo,
    loading: videoLoading,
  } = useVideoStore();

  const { outlets, fetchOutlets, loading: outletLoading } = useOutletStore();

  const {
    createAssignment,
    updateAssignment,
    deleteAssignment,
    fetchAssignments,
    loading: assignmentLoading,
  } = useOutletVideoAssignmentStore();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isReplacingVideo, setIsReplacingVideo] = useState(false);

  const [selectedOutlets, setSelectedOutlets] = useState([]);

  // Store RAW local strings for schedule
  const [scheduleByOutlet, setScheduleByOutlet] = useState({});

  // Active state for the video
  const [active, setActive] = useState(true);

  // Track if data is being loaded for edit mode
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Store video assignments data
  const [videoAssignmentsData, setVideoAssignmentsData] = useState(null);

  const resetState = () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setTitle("");
    setDescription("");
    setErrorMessage("");
    setSelectedOutlets([]);
    setScheduleByOutlet({});
    setActive(true);
    setIsLoadingData(false);
    setVideoAssignmentsData(null);
    setIsReplacingVideo(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        await Promise.all([fetchOutlets(), fetchAssignments()]);

        // If edit mode, also fetch video assignments
        if (mode === "edit" && promoData) {
          const assignmentsData = await getOutletsForVideo(promoData._id);
          setVideoAssignmentsData(assignmentsData);
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [
    isOpen,
    mode,
    promoData,
    fetchOutlets,
    fetchAssignments,
    getOutletsForVideo,
  ]);

  // Load data for edit mode from the fetched assignments
  useEffect(() => {
    if (!isOpen) return;

    if (mode === "add") {
      resetState();
      return;
    }

    if (mode === "edit" && promoData && videoAssignmentsData) {
      console.log("Loading edit data from API:", videoAssignmentsData);

      // Set basic video info
      const url = promoData?.secureUrl || null;
      setPreviewUrl(url);
      setTitle(promoData.title || "");
      setDescription(promoData.description || "");
      setActive(promoData.active !== false);
      setFile(null);
      setIsReplacingVideo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Extract selected outlets from assignments
      const selected = videoAssignmentsData.assignments.map((assignment) =>
        String(assignment.outlet._id),
      );

      console.log("Selected outlets from API:", selected);
      setSelectedOutlets(selected);

      // Set up schedules for each outlet
      const sched = {};
      videoAssignmentsData.assignments.forEach((assignment) => {
        const outletId = String(assignment.outlet._id);
        sched[outletId] = {
          start_local: toLocalInput(assignment.outletAssigned.startAt ?? null),
          end_local: toLocalInput(assignment.outletAssigned.endAt ?? null),
        };
      });

      // Initialize schedules for all selected outlets
      selected.forEach((outletId) => {
        if (!sched[outletId]) {
          sched[outletId] = { start_local: "", end_local: "" };
        }
      });

      console.log("Schedule data from API:", sched);
      setScheduleByOutlet(sched);
    }
  }, [isOpen, mode, promoData, videoAssignmentsData]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "video/mp4") {
      return setErrorMessage(`Only MP4 videos are allowed. (Got: ${f.type})`);
    }

    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setErrorMessage("");
  };

  const handleReplaceVideo = () => {
    setIsReplacingVideo(true);
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancelReplace = () => {
    setIsReplacingVideo(false);
    setFile(null);
    setPreviewUrl(promoData?.secureUrl || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveVideo = () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setIsReplacingVideo(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOutletToggle = (outletId) => {
    setSelectedOutlets((prev) => {
      const next = prev.includes(outletId)
        ? prev.filter((id) => id !== outletId)
        : [...prev, outletId];
      return next;
    });

    // Ensure schedule defaults exist for this outlet
    setScheduleByOutlet((prev) => {
      if (prev[outletId]) return prev;
      return {
        ...prev,
        [outletId]: { start_local: "", end_local: "" },
      };
    });
  };

  const removeOutlet = (outletId) => {
    setSelectedOutlets((prev) => prev.filter((id) => id !== outletId));
  };

  const handleSelectAll = () => {
    const all = outlets.map((outlet) => String(outlet._id));
    setSelectedOutlets(all);
    setScheduleByOutlet((prev) => {
      const next = { ...prev };
      all.forEach((id) => {
        if (!next[id]) next[id] = { start_local: "", end_local: "" };
      });
      return next;
    });
  };

  const handleClearAll = () => setSelectedOutlets([]);

  const setOutletStartRaw = (outletId, raw) => {
    setScheduleByOutlet((prev) => ({
      ...prev,
      [outletId]: { ...(prev[outletId] || {}), start_local: raw ?? "" },
    }));
  };

  const setOutletEndRaw = (outletId, raw) => {
    setScheduleByOutlet((prev) => ({
      ...prev,
      [outletId]: { ...(prev[outletId] || {}), end_local: raw ?? "" },
    }));
  };

  const validateSchedules = () => {
    for (const outletId of selectedOutlets) {
      const s = scheduleByOutlet[outletId] || {};
      const startRaw = (s.start_local || "").trim();
      const endRaw = (s.end_local || "").trim();

      const hasStart = startRaw.length > 0;
      const hasEnd = endRaw.length > 0;

      // allow empty both
      if (!hasStart && !hasEnd) continue;

      // if provided, must be complete
      if (hasStart && !isCompleteDateTimeLocal(startRaw))
        return "Please complete the start date/time.";
      if (hasEnd && !isCompleteDateTimeLocal(endRaw))
        return "Please complete the end date/time.";

      // normalize (date-only => 00:00)
      const startNorm = hasStart ? normalizeDateTimeLocal(startRaw) : null;
      const endNorm = hasEnd ? normalizeDateTimeLocal(endRaw) : null;

      const startIso = startNorm ? toIsoOrNull(startNorm) : null;
      const endIso = endNorm ? toIsoOrNull(endNorm) : null;

      // invalid dates
      if (hasStart && !startIso) return "Invalid start date.";
      if (hasEnd && !endIso) return "Invalid end date.";

      const a = startIso ? new Date(startIso) : null;
      const b = endIso ? new Date(endIso) : null;

      if (a && Number.isNaN(a.getTime())) return "Invalid start date.";
      if (b && Number.isNaN(b.getTime())) return "Invalid end date.";

      // only compare if BOTH exist
      if (a && b && b < a) return "End date must be after start date.";
    }

    return null;
  };

  const handleSubmit = async () => {
    try {
      if (!title.trim()) {
        return setErrorMessage("Title is required.");
      }

      if (selectedOutlets.length === 0) {
        return setErrorMessage("Please select at least 1 outlet.");
      }

      const scheduleErr = validateSchedules();
      if (scheduleErr) return setErrorMessage(scheduleErr);

      setLoading(true);

      let videoId = promoData?._id || null;

      // Create or update video
      if (mode === "add") {
        if (!file) return setErrorMessage("Please upload an MP4 video.");

        const videoData = {
          title: title.trim(),
          description: description.trim(),
          active,
        };

        const createdVideo = await createVideo(videoData, file);
        videoId = createdVideo._id;
        if (!videoId) throw new Error("Failed to create video");
      } else if (mode === "edit") {
        if (!videoId) throw new Error("Missing video ID for edit.");

        const updateData = {
          title: title.trim(),
          description: description.trim(),
          active,
        };

        if (isReplacingVideo && file) {
          // Replace the physical file + update metadata in one call
          await replaceVideo(videoId, updateData, file);
        } else {
          // Metadata-only update
          await updateVideo(videoId, updateData);
        }
      }

      // Get existing assignments from the API data
      const existingAssignments = videoAssignmentsData?.assignments || [];

      // Process each selected outlet
      for (const outletId of selectedOutlets) {
        const schedule = scheduleByOutlet[outletId] || {};
        const startRaw = (schedule.start_local || "").trim();
        const endRaw = (schedule.end_local || "").trim();

        const startNorm = startRaw ? normalizeDateTimeLocal(startRaw) : null;
        const endNorm = endRaw ? normalizeDateTimeLocal(endRaw) : null;

        const assignmentData = {
          videoId,
          startAt: startNorm ? toIsoOrNull(startNorm) : null,
          endAt: endNorm ? toIsoOrNull(endNorm) : null,
          active: true,
        };

        // Check if assignment already exists
        const existingAssignment = existingAssignments.find(
          (assignment) => String(assignment.outlet._id) === outletId,
        );

        if (existingAssignment) {
          // Update existing assignment
          await updateAssignment(
            existingAssignment.outletAssigned.assignmentId,
            assignmentData,
          );
        } else {
          // Create new assignment
          await createAssignment(outletId, assignmentData);
        }
      }

      // Remove assignments for outlets that are no longer selected (edit mode only)
      if (mode === "edit") {
        for (const assignment of existingAssignments) {
          const assignmentOutletId = String(assignment.outlet._id);
          if (!selectedOutlets.includes(assignmentOutletId)) {
            await deleteAssignment(assignment.outletAssigned.assignmentId);
          }
        }
      }

      // Refresh data
      await fetchAssignments();
      await refresh?.();

      handleClose();
      onSuccess?.(
        mode === "edit"
          ? isReplacingVideo
            ? "Video replaced and outlet assignments synced successfully!"
            : "Video updated and outlet assignments synced."
          : "Video uploaded and assigned to selected outlets.",
      );
    } catch (err) {
      console.error("Submit error:", err);
      setErrorMessage(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(""), 3000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  const selectedCount = selectedOutlets.length;
  const totalCount = outlets.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  const selectedRows = useMemo(() => {
    const map = new Map(outlets.map((outlet) => [String(outlet._id), outlet]));
    return selectedOutlets
      .map((id) => map.get(id))
      .filter(Boolean)
      .sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")));
  }, [outlets, selectedOutlets]);

  const isLoading =
    loading ||
    videoLoading ||
    assignmentLoading ||
    outletLoading ||
    isLoadingData;

  // Check if an outlet is selected
  const isOutletSelected = (outletId) => {
    return selectedOutlets.includes(String(outletId));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="relative bg-white rounded-lg shadow-xl z-10 w-full max-w-3xl p-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {mode === "edit"
                  ? `Edit Video: ${promoData?.title || ""}`
                  : "Upload Video Promotion"}
              </h2>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <IoClose size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Loading indicator when fetching data */}
            {isLoadingData && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                Loading video and assignment data...
              </div>
            )}

            {/* Video Details Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Active Status
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActive(true)}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setActive(false)}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !active
                        ? "bg-gray-100 text-gray-700 border border-gray-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Inactive
                  </button>
                </div>
                {mode === "edit" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Current status: {promoData?.active ? "Active" : "Inactive"}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter video description (optional)"
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Upload Area - Shows for add mode OR replace mode in edit */}
            {(mode === "add" || (mode === "edit" && isReplacingVideo)) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video File {mode === "add" && "*"}
                </label>
                <div
                  onClick={() =>
                    !previewUrl && !isLoading && fileInputRef.current?.click()
                  }
                  onDragOver={(e) => {
                    if (isLoading) return;
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => !isLoading && setIsDragging(false)}
                  onDrop={(e) => {
                    if (isLoading) return;
                    e.preventDefault();
                    setIsDragging(false);
                    handleFile(e.dataTransfer.files[0]);
                  }}
                  className={`border-2 border-dashed rounded-lg transition-all ${
                    isLoading
                      ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                      : isDragging
                        ? "border-blue-500 bg-blue-50 cursor-pointer"
                        : previewUrl
                          ? "border-gray-300 cursor-pointer"
                          : "border-gray-300 hover:border-gray-400 cursor-pointer"
                  }`}
                >
                  {previewUrl ? (
                    <div className="p-4">
                      <div className="relative w-full overflow-hidden rounded-lg bg-gray-900 h-48 mb-3">
                        <video
                          key={previewUrl}
                          src={previewUrl}
                          controls
                          playsInline={false}
                          className="relative z-0 w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveVideo();
                          }}
                          disabled={isLoading}
                          className="absolute top-2 right-2 z-20 pointer-events-auto bg-white/90 hover:bg-white text-gray-800 rounded-full p-1.5 shadow-md transition"
                          aria-label="Remove video"
                        >
                          <IoClose size={14} />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {file?.name || "Video file"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">MP4 format</p>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <FiUploadCloud className="text-3xl mx-auto text-gray-400 mb-3" />
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Choose a file or drag & drop it here
                      </p>
                      <p className="text-xs text-gray-500">MP4 format only</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Max file size: 100MB
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])}
                    disabled={isLoading}
                  />
                </div>
                {mode === "edit" && isReplacingVideo && (
                  <button
                    type="button"
                    onClick={handleCancelReplace}
                    disabled={isLoading}
                    className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel replace
                  </button>
                )}
              </div>
            )}

            {/* Edit mode: show current video with replace option */}
            {mode === "edit" && promoData?.secureUrl && !isReplacingVideo && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Video
                </label>
                <div className="relative w-full overflow-hidden rounded-lg bg-gray-900">
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-48 object-contain"
                  />
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">File:</span> {promoData.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Size:</span>{" "}
                    {promoData.bytes
                      ? `${(promoData.bytes / (1024 * 1024)).toFixed(2)} MB`
                      : "Unknown"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Duration:</span>{" "}
                    {promoData.durationSec
                      ? `${Math.floor(promoData.durationSec / 60)}:${String(
                          Math.floor(promoData.durationSec % 60),
                        ).padStart(2, "0")}`
                      : "Unknown"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReplaceVideo}
                  disabled={isLoading}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  <FiRefreshCw className="text-sm" />
                  Replace Video
                </button>
                {videoAssignmentsData && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Currently assigned to{" "}
                    {videoAssignmentsData.totalAssignedOutlets} outlet(s)
                  </p>
                )}
              </div>
            )}

            {/* Outlets header + actions */}
            <div className="mt-4 mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                Assign to Outlets *
                <span className="text-gray-500 ml-2">
                  ({selectedCount}/{totalCount})
                </span>
                {mode === "edit" && videoAssignmentsData && (
                  <span className="text-xs text-green-600 ml-2">
                    ✓ {videoAssignmentsData.totalAssignedOutlets} outlet(s)
                    currently assigned
                  </span>
                )}
              </p>
              {outlets.length > 0 && (
                <button
                  type="button"
                  onClick={allSelected ? handleClearAll : handleSelectAll}
                  disabled={isLoading}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                >
                  {allSelected ? "Clear All" : "Select All"}
                </button>
              )}
            </div>

            {/* Selected outlet chips */}
            <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
              {selectedOutlets.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {isLoading ? "Loading..." : "No outlets selected."}
                  {mode === "edit" &&
                    !isLoading &&
                    videoAssignmentsData?.totalAssignedOutlets === 0 && (
                      <span className="text-xs text-gray-400 block mt-1">
                        This video is not assigned to any outlets yet.
                      </span>
                    )}
                </p>
              ) : (
                <div
                  ref={selectedOutletsRef}
                  className="flex items-center gap-2 overflow-x-auto pb-1 min-h-[40px]"
                >
                  {selectedRows.map((outlet) => {
                    const id = String(outlet._id);
                    const label = `${outlet.code} - ${outlet.name}`;

                    return (
                      <div
                        key={id}
                        className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-2 rounded-full text-sm font-medium shrink-0"
                        style={{ minWidth: "180px", maxWidth: "280px" }}
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <FiCheck size={14} className="shrink-0" />
                          <span className="truncate">{label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOutlet(id)}
                          disabled={isLoading}
                          className="text-blue-600 hover:text-blue-800 shrink-0 ml-2 disabled:text-gray-400"
                        >
                          <IoClose size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Available outlets list */}
            <div className="mb-4 rounded-lg border border-gray-200 p-2">
              {outletLoading ? (
                <p className="text-center text-gray-500 py-4">
                  Loading outlets...
                </p>
              ) : outlets.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No outlets available.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {outlets.map((outlet) => {
                    const outletId = String(outlet._id);
                    const isSelected = isOutletSelected(outletId);

                    return (
                      <button
                        type="button"
                        key={outlet._id}
                        onClick={() => handleOutletToggle(outletId)}
                        disabled={isLoading}
                        className={`flex items-center gap-2 p-3 rounded-lg text-left transition border ${
                          isSelected
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span
                          className={`flex items-center justify-center h-5 w-5 rounded border ${
                            isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <FiCheck size={12} className="text-white" />
                          )}
                        </span>

                        <span
                          className={`flex-1 text-sm ${
                            isSelected
                              ? "font-medium text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          <div className="font-medium">{outlet.code}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {outlet.name}
                            {outlet.location && ` • ${outlet.location}`}
                          </div>
                          <div className="text-xs text-gray-400">
                            Site: {outlet.siteValue || "N/A"}
                          </div>
                          {isSelected && mode === "edit" && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ Currently assigned
                            </div>
                          )}
                        </span>

                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            outlet.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {outlet.active ? "Active" : "Inactive"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Per-outlet schedule editor */}
            {selectedOutlets.length > 0 && (
              <div className="mb-4 rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Schedule per Outlet (Optional)
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    Leave empty for continuous playback
                  </span>
                </p>

                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {selectedRows.map((outlet) => {
                    const id = String(outlet._id);
                    const sch = scheduleByOutlet[id] || {};
                    const hasSchedule = sch.start_local || sch.end_local;

                    return (
                      <div
                        key={id}
                        className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                      >
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-700">
                            {outlet.code} - {outlet.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {outlet.location || "No location specified"}
                          </p>
                          {hasSchedule && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Schedule configured
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Start Date/Time
                            </label>
                            <input
                              type="datetime-local"
                              value={sch.start_local || ""}
                              onChange={(e) =>
                                setOutletStartRaw(id, e.target.value)
                              }
                              disabled={isLoading}
                              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                            />
                            <button
                              type="button"
                              onClick={() => setOutletStartRaw(id, "")}
                              disabled={isLoading}
                              className="mt-1 text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                            >
                              Clear start time
                            </button>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              End Date/Time
                            </label>
                            <input
                              type="datetime-local"
                              value={sch.end_local || ""}
                              onChange={(e) =>
                                setOutletEndRaw(id, e.target.value)
                              }
                              disabled={isLoading}
                              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                            />
                            <button
                              type="button"
                              onClick={() => setOutletEndRaw(id, "")}
                              disabled={isLoading}
                              className="mt-1 text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                            >
                              Clear end time
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {errorMessage && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {errorMessage}
              </p>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className={`flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium transition-colors ${
                  isLoading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`flex-1 py-2.5 rounded-lg text-white font-medium transition-all ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                }`}
              >
                {isLoading
                  ? "Processing..."
                  : mode === "edit"
                    ? isReplacingVideo
                      ? "Replace Video"
                      : "Update Video"
                    : "Upload Video"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalPromotions;
