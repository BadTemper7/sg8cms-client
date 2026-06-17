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
  MdSearch,
  MdFilterList,
  MdDownload,
  MdRefresh,
  MdCheckCircle,
  MdError,
  MdVisibilityOff,
  MdViewList,
  MdViewModule,
  MdAnnouncement,
  MdAccessTime,
  MdCalendarToday,
  MdPerson,
  MdMoreHoriz,
} from "react-icons/md";
import { FiUploadCloud } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import Swal from "sweetalert2";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

import ModalAnnouncements from "../components/modals/modalAnnouncements";
import CountCards from "../components/cards/countCards";
import useAnnouncementStore from "../stores/announcementStore";
import { formatDate, formatDateTime } from "../components/utils/formatDate";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalContext } from "../context/GlobalContextProvider";

// Configure toastr
toastr.options = {
  closeButton: true,
  progressBar: true,
  positionClass: "toast-top-right",
  timeOut: 3000,
  extendedTimeOut: 1000,
  showMethod: "fadeIn",
  hideMethod: "fadeOut",
  toastClass: "rounded-lg shadow-lg",
};

// Enhanced Status Badge with animations
const StatusBadge = ({ status }) => {
  const config = {
    active: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
      icon: MdCheckCircle,
      label: "Active",
    },
    expired: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      dot: "bg-rose-500",
      icon: MdError,
      label: "Expired",
    },
    hidden: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      dot: "bg-slate-500",
      icon: MdVisibilityOff,
      label: "Hidden",
    },
  };

  const {
    bg,
    text,
    border,
    dot,
    icon: Icon,
    label,
  } = config[status] || config.hidden;

  return (
    <motion.span
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${bg} ${text} ${border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
      <Icon className="text-sm" />
      {label}
    </motion.span>
  );
};

// Filter Button Component
const FilterButton = ({ icon: Icon, label, value, currentValue, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onClick(value)}
    className={`
      flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
      border shadow-sm
      ${
        currentValue === value
          ? "text-white border-[#d81318] shadow-md"
          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
      }
    `}
    style={currentValue === value ? { background: "#d81318" } : {}}
  >
    {Icon && <Icon className="text-lg" />}
    {label}
  </motion.button>
);

// Announcement Card Component for Grid View
const AnnouncementCard = ({
  item,
  index,
  currentPage,
  pageSize,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
  onStatusClick,
  getStatus,
}) => {
  const status = getStatus(item);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Status Ribbon */}
      <div
        className={`absolute top-0 right-0 w-16 h-16 ${
          status === "active"
            ? "bg-emerald-500"
            : status === "expired"
              ? "bg-rose-500"
              : "bg-slate-500"
        } transform rotate-45 translate-x-8 -translate-y-8`}
      />

      {/* Card Content */}
      <div className="p-5">
        {/* Header with Checkbox and Index */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg shadow-sm"
              style={{ background: "#d81318" }}
            >
              <MdAnnouncement className="text-white text-sm" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-mono">
                #
                {String((currentPage - 1) * pageSize + index + 1).padStart(
                  3,
                  "0",
                )}
              </div>
              <div className="text-xs text-gray-400 font-mono">
                ID: {item._id.slice(-8)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        </div>

        {/* Announcement Message */}
        <div className="mb-4">
          <p
            className={`text-gray-700 text-sm leading-relaxed ${!isExpanded && "line-clamp-3"}`}
          >
            {item.desc}
          </p>
          {item.desc && item.desc.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-medium mt-1"
              style={{ color: "#d81318" }}
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Timeline Details */}
        <div className="space-y-2 mb-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs">
            <MdCalendarToday className="text-gray-400 text-sm" />
            <span className="text-gray-500">Created:</span>
            <span className="text-gray-700 font-medium">
              {formatDateTime(item.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <MdAccessTime className="text-gray-400 text-sm" />
            <span className="text-gray-500">Expires:</span>
            {item.expiry ? (
              <span
                className={`font-medium ${new Date(item.expiry) < new Date() ? "text-rose-600" : "text-gray-700"}`}
              >
                {formatDate(item.expiry)}
              </span>
            ) : (
              <span className="text-gray-400">No expiry</span>
            )}
          </div>
          {item.uploadedBy && (
            <div className="flex items-center gap-2 text-xs">
              <MdPerson className="text-gray-400 text-sm" />
              <span className="text-gray-500">By:</span>
              <span className="text-gray-700">
                {item.uploadedBy.username || "System"}
              </span>
            </div>
          )}
        </div>

        {/* Status and Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusClick(e, item._id);
              }}
              className="hover:scale-105 transition-transform"
            >
              <StatusBadge status={status} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg transition"
              style={{ color: "#d81318" }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title="Edit"
            >
              <MdEditSquare className="text-lg" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete"
            >
              <MdDelete className="text-lg" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Announcements = () => {
  const { apiUrl } = useContext(GlobalContext);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [announcementDetails, setAnnouncementDetails] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  const defaultPageSize = 10;
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const {
    announcements,
    loading,
    fetchAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    deleteManyAnnouncements,
  } = useAnnouncementStore();

  const statusOptions = [
    { label: "Active", value: "active", color: "bg-emerald-500" },
    { label: "Hidden", value: "hide", color: "bg-slate-500" },
  ];

  const today = new Date();
  const getStatus = useCallback(
    (item) => {
      if (item.status === "hide") return "hidden";
      if (item.expiry) {
        const expiry = new Date(item.expiry);
        if (isNaN(expiry.getTime())) return "active";
        return expiry < today ? "expired" : "active";
      }
      return "active";
    },
    [today],
  );

  useEffect(() => {
    fetchAnnouncements(apiUrl);
  }, [fetchAnnouncements, apiUrl]);

  useEffect(() => {
    const closeAll = () => setOpenDropdown(null);
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  const refreshAnnouncements = async () => {
    setIsRefreshing(true);
    await fetchAnnouncements(apiUrl);
    setIsRefreshing(false);
  };

  const showToast = useCallback((type, message, title = "") => {
    const toastMap = {
      success: toastr.success,
      error: toastr.error,
      warning: toastr.warning,
      info: toastr.info,
    };
    toastMap[type]?.(message, title);
  }, []);

  const handleAdd = async (newData) => {
    const res = await addAnnouncement(apiUrl, newData);
    if (res?.message?.toLowerCase().includes("success") || res?.success) {
      showToast("success", "Announcement created successfully", "Success!");
      setShowModal(false);
      refreshAnnouncements();
    } else {
      showToast(
        "error",
        res?.message || "Failed to create announcement",
        "Error",
      );
    }
  };

  const handleUpdate = async (updated) => {
    const res = await updateAnnouncement(
      apiUrl,
      announcementDetails._id,
      updated,
    );
    if (res?.message?.toLowerCase().includes("success") || res?.success) {
      showToast("success", "Announcement updated successfully", "Updated!");
      setShowModal(false);
      refreshAnnouncements();
    } else {
      showToast(
        "error",
        res?.message || "Failed to update announcement",
        "Error",
      );
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const res = await updateAnnouncement(apiUrl, id, { status: newStatus });
    if (res?.message?.toLowerCase().includes("success") || res?.success) {
      showToast("success", "Status updated successfully", "Updated!");
    } else {
      showToast("error", res?.message || "Failed to update status", "Error");
    }
    setOpenDropdown(null);
    refreshAnnouncements();
  };

  const confirmDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Announcement?",
      text: "This announcement will be permanently removed!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d81318",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      background: "#fff",
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "rounded-lg",
        cancelButton: "rounded-lg",
      },
    });

    if (result.isConfirmed) {
      const res = await deleteAnnouncement(apiUrl, id);
      if (res?.message?.toLowerCase().includes("success") || res?.success) {
        showToast("success", "Announcement deleted successfully", "Deleted!");
        refreshAnnouncements();
      } else {
        showToast(
          "error",
          res?.message || "Failed to delete announcement",
          "Error",
        );
      }
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const result = await Swal.fire({
      title: "Delete Selected Announcements?",
      text: `You are about to delete ${ids.length} announcement(s). This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d81318",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete them!",
      background: "#fff",
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "rounded-lg",
        cancelButton: "rounded-lg",
      },
    });

    if (result.isConfirmed) {
      try {
        const res = await deleteManyAnnouncements(apiUrl, { ids });
        const isSuccess =
          res?.success || res?.message?.toLowerCase().includes("success");

        if (isSuccess) {
          showToast(
            "success",
            `${ids.length} announcement(s) deleted successfully`,
            "Deleted!",
          );
          setSelectedIds(new Set());
          await refreshAnnouncements();
        } else {
          showToast(
            "error",
            res?.message || "Failed to delete announcements",
            "Error",
          );
        }
      } catch (error) {
        showToast(
          "error",
          error?.message || "Failed to delete announcements",
          "Error",
        );
      }
    }
  };

  const { activeCount, expiredCount, hiddenCount } = useMemo(() => {
    let active = 0,
      expired = 0,
      hidden = 0;
    announcements.forEach((item) => {
      const s = getStatus(item);
      if (s === "active") active++;
      if (s === "expired") expired++;
      if (s === "hidden") hidden++;
    });
    return { activeCount: active, expiredCount: expired, hiddenCount: hidden };
  }, [announcements, getStatus]);

  const filteredAnnouncements = useMemo(() => {
    let filtered = [...announcements];

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item._id?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => getStatus(item) === filterStatus);
    }

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "createdAt" || sortConfig.key === "expiry") {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [announcements, filterStatus, searchQuery, sortConfig, getStatus]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAnnouncements.length / pageSize),
  );

  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAnnouncements.slice(start, start + pageSize);
  }, [filteredAnnouncements, currentPage, pageSize]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleSelectOne = (id) => {
    const newSet = new Set(selectedIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedIds(newSet);
  };

  const getFilteredIds = () => filteredAnnouncements.map((item) => item._id);

  const toggleSelectAll = () => {
    const ids = getFilteredIds();
    const allSelected = ids.every((id) => selectedIds.has(id));

    const newSet = new Set(selectedIds);
    if (allSelected) ids.forEach((id) => newSet.delete(id));
    else ids.forEach((id) => newSet.add(id));

    setSelectedIds(newSet);
  };

  const getBreadcrumb = () => {
    const map = {
      active: "Active",
      expired: "Expired",
      hidden: "Hidden",
      all: "All",
    };
    return map[filterStatus];
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const exportToCSV = () => {
    const headers = ["ID", "Announcement", "Created At", "Expiry", "Status"];
    const data = filteredAnnouncements.map((item) => [
      item._id,
      item.desc,
      formatDateTime(item.createdAt),
      item.expiry ? formatDate(item.expiry) : "No expiry",
      getStatus(item),
    ]);

    const csv = [headers, ...data].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `announcements-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleStatusClick = (e, id) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
    setOpenDropdown(`status-${id}`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl shadow-sm"
            style={{ background: "#d81318" }}
          >
            <MdAnnouncement className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Announcements</h1>
            <div className="flex items-center gap-1 text-sm mt-0.5">
              <span className="text-gray-400">/</span>
              <span className="text-gray-600 font-medium capitalize">
                {getBreadcrumb()}
              </span>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          onClick={refreshAnnouncements}
          disabled={isRefreshing}
          className="p-2 text-gray-600 hover:text-[#d81318] hover:bg-red-50 rounded-lg transition"
        >
          <MdRefresh
            className={`text-xl ${isRefreshing ? "animate-spin" : ""}`}
          />
        </motion.button>
      </div>

      {/* Stats Cards */}
      <CountCards
        total={announcements.length}
        active={activeCount}
        expired={expiredCount}
        hidden={hiddenCount}
        filterStatus={filterStatus}
        onFilter={(status) => {
          setFilterStatus(status);
          setCurrentPage(1);
        }}
      />

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MdFilterList className="text-lg" style={{ color: "#d81318" }} />
            Filters & Search
          </h3>
          <button
            onClick={() => {
              setFilterStatus("all");
              setSearchQuery("");
            }}
            className="text-xs text-gray-500 hover:text-[#d81318] transition"
          >
            Clear all filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Status:</span>
            {[
              { label: "All", value: "all", icon: null },
              { label: "Active", value: "active", icon: MdCheckCircle },
              { label: "Expired", value: "expired", icon: MdError },
              { label: "Hidden", value: "hidden", icon: MdVisibilityOff },
            ].map((opt) => (
              <FilterButton
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                value={opt.value}
                currentValue={filterStatus}
                onClick={setFilterStatus}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm"
            >
              <MdDownload />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Show:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20"
            >
              {[5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </select>
          </div>

          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-sm text-gray-600">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-gray-500 hover:text-[#d81318]"
              >
                Clear
              </button>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition ${
                viewMode === "list"
                  ? "bg-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={viewMode === "list" ? { color: "#d81318" } : {}}
              title="List View"
            >
              <MdViewList className="text-xl" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              style={viewMode === "grid" ? { color: "#d81318" } : {}}
              title="Grid View"
            >
              <MdViewModule className="text-xl" />
            </button>
          </div>

          {selectedIds.size > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBulkDelete}
              className="px-5 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <MdDelete />
              Delete ({selectedIds.size})
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setModalMode("add");
              setAnnouncementDetails(null);
              setShowModal(true);
            }}
            className="font-semibold py-2 px-6 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            style={{
              background: "linear-gradient(45deg, #ff9d03, #fcff1e)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              color: "#5c3d00",
            }}
          >
            <FiUploadCloud />
            New Announcement
          </motion.button>
        </div>
      </div>

      {/* Content Area - List View */}
      {viewMode === "list" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 focus:ring-[#d81318]"
                      style={{ accentColor: "#d81318" }}
                      checked={
                        filteredAnnouncements.length > 0 &&
                        filteredAnnouncements.every((a) =>
                          selectedIds.has(a._id),
                        )
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Announcement
                  </th>
                  <th
                    className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1">
                      Created
                      <MdFilterList
                        className={`text-sm ${sortConfig.key === "createdAt" ? "text-[#d81318]" : ""}`}
                      />
                    </div>
                  </th>
                  <th
                    className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort("expiry")}
                  >
                    <div className="flex items-center gap-1">
                      Expiry
                      <MdFilterList
                        className={`text-sm ${sortConfig.key === "expiry" ? "text-[#d81318]" : ""}`}
                      />
                    </div>
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="animate-spin rounded-full h-8 w-8 border-3 border-t-transparent"
                          style={{
                            borderColor: "#d81318",
                            borderTopColor: "transparent",
                          }}
                        ></div>
                        <p className="text-gray-500">
                          Loading announcements...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedAnnouncements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <MdAnnouncement className="text-4xl text-gray-300" />
                        <p className="text-gray-500">No announcements found</p>
                        <button
                          onClick={() => {
                            setModalMode("add");
                            setAnnouncementDetails(null);
                            setShowModal(true);
                          }}
                          className="text-sm font-medium"
                          style={{ color: "#d81318" }}
                        >
                          Create your first announcement
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAnnouncements.map((item, index) => {
                    const status = getStatus(item);
                    return (
                      <motion.tr
                        key={item._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 focus:ring-[#d81318]"
                            style={{ accentColor: "#d81318" }}
                            checked={selectedIds.has(item._id)}
                            onChange={() => toggleSelectOne(item._id)}
                          />
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-md">
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {item.desc}
                            </p>
                            <div className="text-xs text-gray-400 font-mono mt-1">
                              ID: {item._id.slice(-6)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {item.expiry ? (
                            formatDate(item.expiry)
                          ) : (
                            <span className="text-gray-400">No expiry</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={(e) => handleStatusClick(e, item._id)}
                          >
                            <StatusBadge status={status} />
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              onClick={() => {
                                setModalMode("edit");
                                setAnnouncementDetails(item);
                                setShowModal(true);
                              }}
                              title="Edit"
                            >
                              <MdEditSquare className="text-lg" />
                            </button>
                            <button
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              onClick={() => confirmDelete(item._id)}
                              title="Delete"
                            >
                              <MdDelete className="text-lg" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {loading ? (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-3 border-t-transparent"
                  style={{
                    borderColor: "#d81318",
                    borderTopColor: "transparent",
                  }}
                ></div>
                <p className="text-gray-500">Loading announcements...</p>
              </div>
            </div>
          ) : paginatedAnnouncements.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <MdAnnouncement className="text-4xl text-gray-300" />
                <p className="text-gray-500">No announcements found</p>
                <button
                  onClick={() => {
                    setModalMode("add");
                    setAnnouncementDetails(null);
                    setShowModal(true);
                  }}
                  className="text-sm font-medium"
                  style={{ color: "#d81318" }}
                >
                  Create your first announcement
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {paginatedAnnouncements.map((item, index) => (
                <AnnouncementCard
                  key={item._id}
                  item={item}
                  index={index}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onEdit={() => {
                    setModalMode("edit");
                    setAnnouncementDetails(item);
                    setShowModal(true);
                  }}
                  onDelete={() => confirmDelete(item._id)}
                  onSelect={() => toggleSelectOne(item._id)}
                  isSelected={selectedIds.has(item._id)}
                  onStatusClick={handleStatusClick}
                  getStatus={getStatus}
                />
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {openDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-2 min-w-[160px]"
            style={{
              top: dropdownPos.y,
              left: dropdownPos.x,
              transform: "translateX(-50%)",
            }}
          >
            <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
              <span className="text-xs font-medium text-gray-500">
                Change Status
              </span>
              <button
                onClick={() => setOpenDropdown(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoClose size={16} />
              </button>
            </div>
            <div className="py-1">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    const id = openDropdown.split("-")[1];
                    handleStatusChange(id, opt.value);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition text-sm"
                >
                  <span className={`w-2 h-2 rounded-full ${opt.color}`}></span>
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing{" "}
            {Math.min(
              (currentPage - 1) * pageSize + 1,
              filteredAnnouncements.length,
            )}{" "}
            to {Math.min(currentPage * pageSize, filteredAnnouncements.length)}{" "}
            of {filteredAnnouncements.length} results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-xl text-sm font-medium transition ${
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
              className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ModalAnnouncements
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          mode={modalMode}
          announceArray={announcementDetails}
          onSubmit={modalMode === "edit" ? handleUpdate : handleAdd}
        />
      )}
    </div>
  );
};

export default Announcements;
