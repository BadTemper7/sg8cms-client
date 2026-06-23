import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useContext,
} from "react";
import {
  MdDelete,
  MdEditSquare,
  MdRemoveCircle,
  MdCheckCircle,
  MdVideoLibrary,
  MdPlayCircle,
  MdFilterList,
  MdSearch,
  MdDownload,
  MdRefresh,
  MdMoreVert,
  MdViewList,
  MdViewModule,
  MdMonitor,
} from "react-icons/md";
import { FaLayerGroup } from "react-icons/fa";
import { FiUploadCloud } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

import ModalPromotions from "../components/modals/modalOutlets";
import ModalDevices from "../components/modals/modalDevices";
import CardDelete from "../components/cards/cardDelete";
import CardSuccess from "../components/cards/cardSuccess";

import { useVideoStore } from "../stores/videoStore";
import { useTerminalStore } from "../stores/terminalStore";

import { GlobalContext } from "../context/GlobalContextProvider";

const SERVER_ORIGIN = "https://ws2.sg8.casino/";

const getMediaPreviewUrl = (video) => {
  const url = video?.secureUrl || "";
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SERVER_ORIGIN}${url}`;
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status, onClick }) => {
  const config = {
    active: {
      bg: "bg-green-100",
      text: "text-green-700",
      dot: "bg-green-500",
      icon: MdCheckCircle,
      label: "Active",
    },
    inactive: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      dot: "bg-gray-400",
      icon: MdRemoveCircle,
      label: "Inactive",
    },
  };

  const {
    bg,
    text,
    dot,
    icon: Icon,
    label,
  } = config[status] || config.inactive;

  return (
    <button
      onClick={onClick}
      title="Click to toggle status"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition hover:opacity-80 ${bg} ${text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <Icon className="text-sm" />
      {label}
    </button>
  );
};

const TableHeader = ({ children, sortable, onSort, sorted }) => (
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    <div className="flex items-center gap-1">
      {children}
      {sortable && (
        <button onClick={onSort} className="ml-1 hover:text-gray-700">
          <MdFilterList
            className={`text-sm ${sorted ? "text-[#d81318]" : ""}`}
          />
        </button>
      )}
    </div>
  </th>
);

const VideoCard = ({
  video,
  index,
  currentPage,
  pageSize,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onPreview,
  onToggleStatus,
  formatDuration,
  formatFileSize,
}) => {
  const status = video.active ? "active" : "inactive";
  const previewUrl = getMediaPreviewUrl(video);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
    >
      {/* Thumbnail / Preview area */}
      <div
        className="relative h-44 bg-gray-900 cursor-pointer flex items-center justify-center overflow-hidden"
        onClick={() => previewUrl && onPreview(previewUrl)}
      >
        <MdVideoLibrary className="text-gray-600 text-5xl group-hover:scale-110 transition-transform duration-300" />
        {previewUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <MdPlayCircle className="text-white text-6xl drop-shadow-lg" />
          </div>
        )}
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
          #{(currentPage - 1) * pageSize + index + 1}
        </div>
        <div className="absolute top-2 right-2">
          <input
            type="checkbox"
            className="rounded border-gray-300 focus:ring-[#d81318] w-4 h-4"
            style={{ accentColor: "#d81318" }}
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        {video.format && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">
            .{video.format}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        <div>
          <div className="font-semibold text-gray-900 truncate">
            {video.title}
          </div>
          {video.description && (
            <div className="text-xs text-gray-400 truncate mt-0.5">
              {video.description}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {video.durationSec > 0 && (
            <div>
              <span className="text-gray-400">Duration:</span>
              <div className="font-medium text-gray-700">
                {formatDuration(video.durationSec)}
              </div>
            </div>
          )}
          {video.bytes > 0 && (
            <div>
              <span className="text-gray-400">Size:</span>
              <div className="font-medium text-gray-700">
                {formatFileSize(video.bytes)}
              </div>
            </div>
          )}
          <div>
            <span className="text-gray-400">Created:</span>
            <div className="font-medium text-gray-700">
              {video.createdAt
                ? new Date(video.createdAt).toLocaleDateString()
                : "—"}
            </div>
          </div>
        </div>

        {/* Badges + Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <StatusBadge status={status} onClick={() => onToggleStatus(video)} />
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-lg transition"
              style={{ color: "#d81318" }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit"
            >
              <MdEditSquare className="text-lg" />
            </button>
            <button
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete"
            >
              <MdDelete className="text-lg" />
            </button>
            <button
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition"
              title="More options"
            >
              <MdMoreVert className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Stat Card (Updated with border-top design) ─────────────────────────────────────────────────────────────────
const StatCard = ({
  active,
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
  accentColor,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full text-left rounded-2xl p-5
        transition-all duration-300 overflow-hidden
        bg-white/90 backdrop-blur-sm
        ${active ? "shadow-lg ring-1 ring-[#d81318]/20" : "shadow-md hover:shadow-lg"}
      `}
    >
      {/* Border-top accent bar */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl transition-opacity duration-300"
        style={{
          background: accentColor,
          opacity: active ? 1 : 0,
        }}
      />

      <div className="flex items-center gap-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg} shadow-inner`}
        >
          <span className={`${iconColor} text-xl`}>{icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate">{title}</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900 tracking-tight">
            {value}
          </p>
        </div>
      </div>

      {subtitle && <p className="mt-4 text-xs text-gray-500">{subtitle}</p>}
    </button>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────
const Outlets = () => {
  const { apiUrl, isSuperAdmin } = useContext(GlobalContext);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [showDevicesModal, setShowDevicesModal] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState({
    title: "",
    description: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const defaultPageSize = 10;
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [viewMode, setViewMode] = useState("list");

  const {
    videos,
    loading,
    error,
    fetchVideos,
    deleteVideo,
    toggleVideoActive,
    deleteMultipleVideos,
  } = useVideoStore();

  const { fetchTerminals } = useTerminalStore();

  const refreshVideos = useCallback(async () => {
    setIsRefreshing(true);
    await fetchVideos();
    setIsRefreshing(false);
  }, [fetchVideos]);

  useEffect(() => {
    refreshVideos();
    fetchTerminals();
  }, []);

  const { totalCount, activeCount, inactiveCount } = useMemo(() => {
    const total = videos.length;
    const active = videos.filter((v) => v.active === true).length;
    return {
      totalCount: total,
      activeCount: active,
      inactiveCount: total - active,
    };
  }, [videos]);

  const filteredVideos = useMemo(() => {
    let rows = [...videos];

    if (filterStatus !== "all") {
      rows = rows.filter((v) =>
        filterStatus === "active" ? v.active === true : v.active === false,
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((v) => {
        const title = v.title || "";
        const description = v.description || "";
        return (
          String(title).toLowerCase().includes(q) ||
          String(description).toLowerCase().includes(q)
        );
      });
    }

    rows.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === "createdAt") {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [videos, filterStatus, search, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVideos.slice(start, start + pageSize);
  }, [filteredVideos, currentPage, pageSize]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const toggleSelectOne = (id) => {
    const newSet = new Set(selectedIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    const ids = filteredVideos.map((v) => v._id);
    const allSelected =
      ids.length > 0 && ids.every((id) => selectedIds.has(id));
    const newSet = new Set(selectedIds);
    if (allSelected) ids.forEach((id) => newSet.delete(id));
    else ids.forEach((id) => newSet.add(id));
    setSelectedIds(newSet);
  };

  const handleToggleActive = async (video) => {
    try {
      await toggleVideoActive(video._id);
      setSuccessData({
        title: "Updated!",
        description: "Status updated successfully.",
      });
      setShowSuccess(true);
    } catch (err) {
      setSuccessData({
        title: "Error!",
        description: err?.message || "Failed to update status",
      });
      setShowSuccess(true);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVideo(deleteId);
      setSuccessData({
        title: "Deleted!",
        description: "Video deleted successfully.",
      });
      setShowSuccess(true);
    } catch (err) {
      setSuccessData({
        title: "Error!",
        description: err?.message || "Failed to delete video",
      });
      setShowSuccess(true);
    }
    setShowDelete(false);
    setDeleteId(null);
    setSelectedIds((prev) => {
      const s = new Set(prev);
      s.delete(deleteId);
      return s;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await deleteMultipleVideos(ids);
      setSuccessData({
        title: "Deleted!",
        description: "Selected videos deleted successfully.",
      });
      setShowSuccess(true);
    } catch (err) {
      setSuccessData({
        title: "Error!",
        description: err?.message || "Failed to delete videos",
      });
      setShowSuccess(true);
    }
    setShowBulkDelete(false);
    setSelectedIds(new Set());
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Title",
      "Description",
      "Format",
      "Duration (s)",
      "Size (bytes)",
      "Status",
      "Created At",
    ];
    const data = filteredVideos.map((v) => [
      v._id,
      v.title || "",
      v.description || "",
      v.format || "",
      v.durationSec || 0,
      v.bytes || 0,
      v.active ? "active" : "inactive",
      v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...data].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promotions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getBreadcrumb = () => {
    const map = { all: "All", active: "Active", inactive: "Inactive" };
    return map[filterStatus] || "All";
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl shadow-sm"
            style={{ background: "#d81318" }}
          >
            <MdVideoLibrary className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Terminal Management
            </h1>
            <div className="flex items-center gap-1 text-sm mt-0.5">
              <span className="text-gray-400">/</span>
              <span className="text-gray-600 font-medium capitalize">
                {getBreadcrumb()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDevicesModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            style={{ background: "#d81318", color: "#fff" }}
          >
            <MdMonitor className="text-lg" />
            View Devices
          </button>
          <button
            onClick={refreshVideos}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-[#d81318] hover:bg-red-50 rounded-lg transition"
          >
            <MdRefresh
              className={`text-xl ${isRefreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ── Stat Cards (Updated with border-top design) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          active={filterStatus === "all"}
          title="Total"
          value={totalCount}
          subtitle="All videos"
          icon={<FaLayerGroup />}
          iconBg="bg-gray-100"
          iconColor="text-gray-700"
          accentColor="linear-gradient(to right, #6b7280, #475569)"
          onClick={() => {
            setFilterStatus("all");
            setCurrentPage(1);
            setSelectedIds(new Set());
          }}
        />
        <StatCard
          active={filterStatus === "active"}
          title="Active"
          value={activeCount}
          subtitle="Currently active videos"
          icon={<MdCheckCircle />}
          iconBg="bg-green-100"
          iconColor="text-green-700"
          accentColor="linear-gradient(to right, #22c55e, #10b981)"
          onClick={() => {
            setFilterStatus("active");
            setCurrentPage(1);
            setSelectedIds(new Set());
          }}
        />
        <StatCard
          active={filterStatus === "inactive"}
          title="Inactive"
          value={inactiveCount}
          subtitle="Disabled videos"
          icon={<MdRemoveCircle />}
          iconBg="bg-gray-200"
          iconColor="text-gray-600"
          accentColor="linear-gradient(to right, #ef4444, #f43f5e)"
          onClick={() => {
            setFilterStatus("inactive");
            setCurrentPage(1);
            setSelectedIds(new Set());
          }}
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ── Filters Section ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MdFilterList className="text-lg" style={{ color: "#d81318" }} />
            Filters
          </h3>
          <button
            onClick={() => {
              setFilterStatus("all");
              setSearch("");
            }}
            className="text-xs text-gray-500 hover:text-[#d81318] transition"
          >
            Clear all
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by title or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318]"
            />
          </div>

          {/* Export */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm whitespace-nowrap"
          >
            <MdDownload />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Actions Bar ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Rows per page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20"
            >
              {[5, 10, 20, 50].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-gray-500 hover:text-[#d81318]"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition ${viewMode === "list" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              style={viewMode === "list" ? { color: "#d81318" } : {}}
              title="List View"
            >
              <MdViewList className="text-xl" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition ${viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              style={viewMode === "grid" ? { color: "#d81318" } : {}}
              title="Grid View"
            >
              <MdViewModule className="text-xl" />
            </button>
          </div>

          {selectedIds.size > 0 && (
            <button
              onClick={() => setShowBulkDelete(true)}
              className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm flex items-center gap-2 text-sm"
            >
              <MdDelete />
              Delete Selected ({selectedIds.size})
            </button>
          )}

          <button
            onClick={() => {
              setMode("add");
              setSelectedVideo(null);
              setShowModal(true);
            }}
            className="font-semibold py-2 px-6 rounded-lg hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2 text-white"
            style={{
              background: "linear-gradient(45deg, #ff9d03, #fcff1e)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              color: "#5c3d00",
            }}
          >
            <FiUploadCloud />
            Upload Video
          </button>
        </div>
      </div>

      {/* ── Content Area ── */}
      {viewMode === "list" ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isSuperAdmin && (
                    <th className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 focus:ring-[#d81318]"
                        style={{ accentColor: "#d81318" }}
                        checked={
                          filteredVideos.length > 0 &&
                          filteredVideos.every((v) => selectedIds.has(v._id))
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                  )}

                  <TableHeader
                    sortable
                    onSort={() => handleSort("createdAt")}
                    sorted={sortConfig.key === "createdAt"}
                  >
                    #
                  </TableHeader>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Video Preview
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <TableHeader
                    sortable
                    onSort={() => handleSort("createdAt")}
                    sorted={sortConfig.key === "createdAt"}
                  >
                    Created At
                  </TableHeader>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {isSuperAdmin && (
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
                          style={{
                            borderColor: "#d81318",
                            borderTopColor: "transparent",
                          }}
                        />
                        <p className="text-gray-500">Loading videos...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FiUploadCloud className="text-4xl text-gray-300" />
                        <p className="text-gray-500">
                          {search || filterStatus !== "all"
                            ? "No videos match your criteria."
                            : "No videos found. Upload your first video!"}
                        </p>
                        {!search && filterStatus === "all" && (
                          <button
                            onClick={() => {
                              setMode("add");
                              setSelectedVideo(null);
                              setShowModal(true);
                            }}
                            className="text-sm font-medium"
                            style={{ color: "#d81318" }}
                          >
                            Upload your first video
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((video, index) => {
                    const status = video.active ? "active" : "inactive";
                    const vPreviewUrl = getMediaPreviewUrl(video);

                    return (
                      <motion.tr
                        key={video._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        {isSuperAdmin && (
                          <th className="px-4 py-4">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 focus:ring-[#d81318]"
                              style={{ accentColor: "#d81318" }}
                              checked={
                                filteredVideos.length > 0 &&
                                filteredVideos.every((v) =>
                                  selectedIds.has(v._id),
                                )
                              }
                              onChange={toggleSelectAll}
                            />
                          </th>
                        )}

                        <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900">
                            {video.title}
                          </div>
                          {video.description && (
                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                              {video.description}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-900 border border-gray-200 flex items-center justify-center group-hover:shadow-md transition-shadow relative">
                              <MdVideoLibrary className="text-gray-500 text-2xl" />
                              {vPreviewUrl && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MdPlayCircle className="text-white text-2xl" />
                                </div>
                              )}
                            </div>
                            <div>
                              <button
                                className="text-xs font-medium"
                                style={{ color: "#d81318" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (vPreviewUrl) {
                                    setPreviewUrl(vPreviewUrl);
                                    setShowPreview(true);
                                  }
                                }}
                                disabled={!vPreviewUrl}
                              >
                                {vPreviewUrl ? "Preview Video" : "No Preview"}
                              </button>
                              {video.format && (
                                <div className="text-xs text-gray-400 mt-0.5 font-mono uppercase">
                                  .{video.format}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-600">
                          <div className="space-y-1">
                            {video.durationSec > 0 && (
                              <div className="text-xs">
                                <span className="text-gray-400">Duration:</span>{" "}
                                <span className="font-medium">
                                  {formatDuration(video.durationSec)}
                                </span>
                              </div>
                            )}
                            {video.bytes > 0 && (
                              <div className="text-xs">
                                <span className="text-gray-400">Size:</span>{" "}
                                <span className="font-medium">
                                  {formatFileSize(video.bytes)}
                                </span>
                              </div>
                            )}
                            <div className="text-xs">
                              <span className="text-gray-400">Public ID:</span>{" "}
                              <span className="font-mono text-xs truncate max-w-[120px] inline-block">
                                {video.publicId || "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-600">
                          <div>
                            {video.createdAt
                              ? new Date(video.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )
                              : "—"}
                          </div>
                          {video.createdAt && (
                            <div className="text-xs text-gray-400">
                              {new Date(video.createdAt).toLocaleTimeString()}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={status}
                            onClick={() => handleToggleActive(video)}
                          />
                        </td>
                        {isSuperAdmin && (
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                className="p-2 rounded-lg transition"
                                style={{ color: "#d81318" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMode("edit");
                                  setSelectedVideo(video);
                                  setShowModal(true);
                                }}
                                title="Edit"
                              >
                                <MdEditSquare className="text-lg" />
                              </button>
                              <button
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(video._id);
                                  setShowDelete(true);
                                }}
                                title="Delete"
                              >
                                <MdDelete className="text-lg" />
                              </button>
                              <button
                                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition"
                                title="More options"
                              >
                                <MdMoreVert className="text-lg" />
                              </button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div
                className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
                style={{
                  borderColor: "#d81318",
                  borderTopColor: "transparent",
                }}
              />
              <p className="text-gray-500">Loading videos...</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <FiUploadCloud className="text-4xl text-gray-300" />
              <p className="text-gray-500">
                {search || filterStatus !== "all"
                  ? "No videos match your criteria."
                  : "No videos found. Upload your first video!"}
              </p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {paginated.map((video, index) => (
                <VideoCard
                  key={video._id}
                  video={video}
                  index={index}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  isSelected={selectedIds.has(video._id)}
                  onSelect={() => toggleSelectOne(video._id)}
                  onEdit={() => {
                    setMode("edit");
                    setSelectedVideo(video);
                    setShowModal(true);
                  }}
                  onDelete={() => {
                    setDeleteId(video._id);
                    setShowDelete(true);
                  }}
                  onPreview={(url) => {
                    setPreviewUrl(url);
                    setShowPreview(true);
                  }}
                  onToggleStatus={handleToggleActive}
                  formatDuration={formatDuration}
                  formatFileSize={formatFileSize}
                />
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* ── Pagination ── */}
      <div className="px-6 py-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing{" "}
            {filteredVideos.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}{" "}
            to {Math.min(currentPage * pageSize, filteredVideos.length)} of{" "}
            {filteredVideos.length} results
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                        currentPage === pageNum
                          ? "text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                      style={
                        currentPage === pageNum ? { background: "#d81318" } : {}
                      }
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Dialogs ── */}
      {showBulkDelete && (
        <CardDelete
          message={`Delete ${selectedIds.size} selected video(s)? This action cannot be undone.`}
          onCancel={() => setShowBulkDelete(false)}
          onConfirm={handleBulkDelete}
        />
      )}

      {showDelete && (
        <CardDelete
          message="Delete this video? This will remove the video from Cloudinary and all assignments."
          onCancel={() => setShowDelete(false)}
          onConfirm={confirmDelete}
        />
      )}

      {showSuccess && (
        <CardSuccess
          title={successData.title}
          description={successData.description}
          onClose={() => setShowSuccess(false)}
        />
      )}

      <ModalDevices
        isOpen={showDevicesModal}
        onClose={() => setShowDevicesModal(false)}
        API_URL={apiUrl}
      />

      {showModal && (
        <ModalPromotions
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          refresh={refreshVideos}
          mode={mode}
          promoData={selectedVideo}
          onSuccess={(msg) => {
            setSuccessData({
              title: mode === "edit" ? "Updated!" : "Success!",
              description: msg,
            });
            setShowSuccess(true);
          }}
        />
      )}

      {/* ── Video Preview Modal ── */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setShowPreview(false)}
            />
            <motion.div
              className="relative z-10 w-full max-w-5xl bg-black rounded-xl overflow-hidden shadow-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
                <p className="text-white text-sm font-medium flex items-center gap-2">
                  <MdPlayCircle className="text-blue-400" />
                  Video Preview
                </p>
                <button
                  className="text-white/70 hover:text-white transition"
                  onClick={() => setShowPreview(false)}
                >
                  <IoClose size={20} />
                </button>
              </div>
              <video
                src={previewUrl}
                controls
                autoPlay
                className="w-full bg-black"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Outlets;
