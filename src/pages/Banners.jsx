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
  MdDesktopWindows,
  MdPhoneIphone,
  MdDarkMode,
  MdLightMode,
  MdSearch,
  MdFilterList,
  MdDownload,
  MdRefresh,
  MdMoreVert,
  MdCheckCircle,
  MdError,
  MdVisibilityOff,
  MdViewList,
  MdViewModule,
} from "react-icons/md";
import { FiUploadCloud } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import Swal from "sweetalert2";
import toastr from "toastr";
import "toastr/build/toastr.min.css";

import ModalBanner from "../components/modals/modalBanner";
import CountCards from "../components/cards/countCards";
import useBannerStore from "../stores/bannerStore";
import { motion, AnimatePresence } from "framer-motion";
import { GlobalContext } from "../context/GlobalContextProvider";

// Configure toastr with better styling
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

// Status badge component
const StatusBadge = ({ status }) => {
  const config = {
    active: {
      bg: "bg-green-100",
      text: "text-green-700",
      dot: "bg-green-500",
      icon: MdCheckCircle,
      label: "Active",
    },
    expired: {
      bg: "bg-red-100",
      text: "text-red-700",
      dot: "bg-red-500",
      icon: MdError,
      label: "Expired",
    },
    hidden: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      dot: "bg-gray-500",
      icon: MdVisibilityOff,
      label: "Hidden",
    },
  };

  const { bg, text, dot, icon: Icon, label } = config[status] || config.hidden;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <Icon className="text-sm" />
      {label}
    </span>
  );
};

// Device badge component
const DeviceBadge = ({ device }) => {
  const config = {
    desktop: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      icon: MdDesktopWindows,
      label: "Desktop",
    },
    mobile: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: MdPhoneIphone,
      label: "Mobile",
    },
  };

  const { bg, text, icon: Icon, label } = config[device] || config.desktop;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      <Icon className="text-sm" />
      {label}
    </span>
  );
};

// Theme badge component
const ThemeBadge = ({ theme }) => {
  const config = {
    dark: {
      bg: "bg-gray-800",
      text: "text-white",
      icon: MdDarkMode,
      label: "Dark",
    },
    light: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      icon: MdLightMode,
      label: "Light",
    },
  };

  const { bg, text, icon: Icon, label } = config[theme] || config.light;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      <Icon className="text-sm" />
      {label}
    </span>
  );
};

// Filter button component
const FilterButton = ({ icon: Icon, label, value, currentValue, onClick }) => (
  <button
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
  </button>
);

// Table header component with sorting
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

// Banner Card component for grid view
const BannerCard = ({
  item,
  index,
  currentPage,
  pageSize,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
  onPreview,
  onDeviceClick,
  onThemeClick,
  onStatusClick,
  getStatus,
}) => {
  const status = getStatus(item);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
    >
      {/* Banner Image */}
      <div
        className="relative h-48 bg-gray-100 cursor-pointer"
        onClick={() => onPreview(item.url)}
      >
        <img
          src={item.url}
          alt="banner"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
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
      </div>

      {/* Card Details */}
      <div className="p-4 space-y-3">
        {/* Uploaded By & ID */}
        <div>
          <div className="font-medium text-gray-900">
            {item.uploadedBy?.username || "Unknown"}
          </div>
          <div className="text-xs text-gray-400 font-mono">
            ID: {item._id?.slice(-6) || "N/A"}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-400">Created:</span>
            <div className="font-medium text-gray-700">
              {new Date(item.createdAt).toLocaleDateString()}
            </div>
            <div className="text-gray-400 text-[10px]">
              {new Date(item.createdAt).toLocaleTimeString()}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Expiry:</span>
            {item.expiry ? (
              <>
                <div className="font-medium text-gray-700">
                  {new Date(item.expiry).toLocaleDateString()}
                </div>
                <div className="text-gray-400 text-[10px]">
                  {new Date(item.expiry).toLocaleTimeString()}
                </div>
              </>
            ) : (
              <div className="text-gray-400">No expiry</div>
            )}
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {/* Device Badge with Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeviceClick(e, item._id);
              }}
              className="hover:opacity-80 transition"
            >
              <DeviceBadge device={item.device} />
            </button>
          </div>

          {/* Theme Badge with Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onThemeClick(e, item._id);
              }}
              className="hover:opacity-80 transition"
            >
              <ThemeBadge theme={item.theme} />
            </button>
          </div>

          {/* Status Badge with Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusClick(e, item._id);
              }}
              className="hover:opacity-80 transition"
            >
              <StatusBadge status={status} />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
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
            onClick={(e) => {
              e.stopPropagation();
              // Handle more options if needed
            }}
            title="More options"
          >
            <MdMoreVert className="text-lg" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Banners = () => {
  const { apiUrl } = useContext(GlobalContext);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedBanner, setSelectedBanner] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const defaultPageSize = 10;
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });

  const [previewImg, setPreviewImg] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState("list");

  // Filter states
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState("all");

  const statusOptions = [
    { label: "Active", value: "active", color: "bg-green-500" },
    { label: "Hidden", value: "hide", color: "bg-gray-500" },
  ];

  const themeOptions = [
    { label: "Dark", value: "dark", color: "bg-green-500" },
    { label: "Light", value: "light", color: "bg-gray-500" },
  ];

  const deviceOptions = [
    { label: "Desktop", value: "desktop", color: "bg-purple-500" },
    { label: "Mobile", value: "mobile", color: "bg-blue-500" },
  ];

  const {
    banners,
    loading,
    fetchBanners,
    deleteBanner,
    deleteManyBanners,
    updateBannerStatus,
    updateBannerTheme,
    updateBannerDevice,
  } = useBannerStore();

  const today = new Date();

  const getStatus = useCallback(
    (item) => {
      if (item.status === "hide") return "hidden";
      if (item.status === "active") return "active";
      if (item.expiry) {
        const expiry = new Date(item.expiry);
        return expiry < today ? "expired" : "active";
      }
      return "active";
    },
    [today],
  );

  useEffect(() => {
    fetchBanners(apiUrl);
  }, [fetchBanners]);

  useEffect(() => {
    const closeAll = () => setOpenDropdown(null);
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  const refreshBanners = async () => {
    setIsRefreshing(true);
    await fetchBanners(apiUrl);
    setIsRefreshing(false);
  };

  // Toast helper function
  const showToast = useCallback((type, message, title = "") => {
    const toastMap = {
      success: toastr.success,
      error: toastr.error,
      warning: toastr.warning,
      info: toastr.info,
    };
    toastMap[type]?.(message, title);
  }, []);

  // Update status
  const handleStatusChange = async (id, newStatus) => {
    const res = await updateBannerStatus(apiUrl, id, newStatus);

    if (res?.message?.toLowerCase().includes("success") || res?.success) {
      showToast("success", "Status updated successfully", "Updated!");
    } else {
      showToast("error", res?.message || "Failed to update status", "Error");
    }

    setOpenDropdown(null);
    refreshBanners();
  };

  const handleThemeChange = async (id, newTheme) => {
    const res = await updateBannerTheme(apiUrl, id, newTheme);

    if (res?.message?.toLowerCase().includes("success") || res?.success) {
      showToast("success", "Theme updated successfully", "Updated!");
    } else {
      showToast("error", res?.message || "Failed to update theme", "Error");
    }

    setOpenDropdown(null);
    refreshBanners();
  };

  const handleDeviceChange = async (id, newDevice) => {
    const res = await updateBannerDevice(apiUrl, id, newDevice);

    if (res?.message?.toLowerCase().includes("success") || res?.success) {
      showToast("success", "Device updated successfully", "Updated!");
    } else {
      showToast("error", res?.message || "Failed to update device", "Error");
    }

    setOpenDropdown(null);
    refreshBanners();
  };

  const { activeCount, expiredCount, hiddenCount } = useMemo(() => {
    let active = 0,
      expired = 0,
      hidden = 0;
    banners.forEach((b) => {
      const s = getStatus(b);
      if (s === "active") active++;
      if (s === "expired") expired++;
      if (s === "hidden") hidden++;
    });
    return { activeCount: active, expiredCount: expired, hiddenCount: hidden };
  }, [banners, getStatus]);

  const filteredBanners = useMemo(() => {
    let sorted = [...banners];

    // Apply search
    if (searchQuery) {
      sorted = sorted.filter(
        (item) =>
          item.uploadedBy?.username
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          item._id?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply filters
    if (filterStatus !== "all") {
      sorted = sorted.filter((item) => getStatus(item) === filterStatus);
    }

    if (deviceFilter !== "all") {
      sorted = sorted.filter((item) => item.device === deviceFilter);
    }

    if (themeFilter !== "all") {
      sorted = sorted.filter((item) => item.theme === themeFilter);
    }

    // Apply sorting
    sorted.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "createdAt" || sortConfig.key === "expiry") {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }

      if (sortConfig.key === "uploadedBy") {
        aVal = a.uploadedBy?.username || "";
        bVal = b.uploadedBy?.username || "";
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [
    banners,
    filterStatus,
    deviceFilter,
    themeFilter,
    searchQuery,
    sortConfig,
    getStatus,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredBanners.length / pageSize));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBanners.slice(start, start + pageSize);
  }, [filteredBanners, currentPage, pageSize]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Single delete confirmation
  const confirmDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This banner will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d81318",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      background: "#fff",
      customClass: {
        popup: "rounded-xl",
        confirmButton: "rounded-lg",
        cancelButton: "rounded-lg",
      },
    });

    if (result.isConfirmed) {
      const res = await deleteBanner(apiUrl, id);

      if (res?.message?.toLowerCase().includes("success") || res?.success) {
        showToast("success", "Banner has been deleted.", "Deleted!");
        refreshBanners();
      } else {
        showToast("error", res?.message || "Failed to delete banner", "Error");
      }
    }
  };

  // Bulk delete confirmation
  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const result = await Swal.fire({
      title: "Delete Selected Banners?",
      text: `You are about to delete ${ids.length} banner(s). This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d81318",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete them!",
      background: "#fff",
      customClass: {
        popup: "rounded-xl",
        confirmButton: "rounded-lg",
        cancelButton: "rounded-lg",
      },
    });

    if (result.isConfirmed) {
      try {
        const res = await deleteManyBanners(apiUrl, { ids });

        const isSuccess =
          res?.success ||
          res?.message?.toLowerCase().includes("success") ||
          res?.status === "success";

        if (isSuccess) {
          showToast(
            "success",
            `${ids.length} banner(s) deleted successfully`,
            "Deleted!",
          );
          setSelectedIds(new Set());
          await refreshBanners();
        } else {
          showToast(
            "error",
            res?.message || "Failed to delete banners",
            "Error",
          );
        }
      } catch (error) {
        console.error("Bulk delete error:", error);
        showToast(
          "error",
          error?.message || "Failed to delete banners",
          "Error",
        );
      }
    }
  };

  const toggleSelectOne = (id) => {
    const newSet = new Set(selectedIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedIds(newSet);
  };

  const getFilteredIds = () => filteredBanners.map((item) => item._id);

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
    const headers = [
      "ID",
      "Banner URL",
      "Uploaded By",
      "Created At",
      "Expiry",
      "Device",
      "Theme",
      "Status",
    ];
    const data = filteredBanners.map((item) => [
      item._id,
      item.url,
      item.uploadedBy?.username || "Unknown",
      new Date(item.createdAt).toLocaleDateString(),
      item.expiry ? new Date(item.expiry).toLocaleDateString() : "No expiry",
      item.device || "desktop",
      item.theme || "light",
      getStatus(item),
    ]);

    const csv = [headers, ...data].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banners-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Handle dropdown clicks
  const handleDeviceClick = (e, id) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
    setOpenDropdown(`device-${id}`);
  };

  const handleThemeClick = (e, id) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    });
    setOpenDropdown(`theme-${id}`);
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
      {/* Header with breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl shadow-sm"
            style={{ background: "#d81318" }}
          >
            <FiUploadCloud className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Banners</h1>
            <div className="flex items-center gap-1 text-sm mt-0.5">
              <span className="text-gray-400">/</span>
              <span className="text-gray-600 font-medium capitalize">
                {getBreadcrumb()}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={refreshBanners}
          disabled={isRefreshing}
          className="p-2 text-gray-600 hover:text-[#d81318] hover:bg-red-50 rounded-lg transition"
        >
          <MdRefresh
            className={`text-xl ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Stats Cards */}
      <CountCards
        total={banners.length}
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MdFilterList className="text-lg" style={{ color: "#d81318" }} />
            Filters
          </h3>
          <button
            onClick={() => {
              setDeviceFilter("all");
              setThemeFilter("all");
              setFilterStatus("all");
              setSearchQuery("");
            }}
            className="text-xs text-gray-500 hover:text-[#d81318] transition"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318]"
            />
          </div>

          {/* Device Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Device:</span>
            {[
              { label: "All", value: "all", icon: null },
              { label: "Desktop", value: "desktop", icon: MdDesktopWindows },
              { label: "Mobile", value: "mobile", icon: MdPhoneIphone },
            ].map((opt) => (
              <FilterButton
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                value={opt.value}
                currentValue={deviceFilter}
                onClick={setDeviceFilter}
              />
            ))}
          </div>

          {/* Theme Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">Theme:</span>
            {[
              { label: "All", value: "all", icon: null },
              { label: "Dark", value: "dark", icon: MdDarkMode },
              { label: "Light", value: "light", icon: MdLightMode },
            ].map((opt) => (
              <FilterButton
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                value={opt.value}
                currentValue={themeFilter}
                onClick={setThemeFilter}
              />
            ))}
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
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
            <label className="text-sm text-gray-600">Rows per page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20"
            >
              {[5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
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
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition ${
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
              className={`p-2 rounded-md transition ${
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
            <button
              onClick={handleBulkDelete}
              className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <MdDelete />
              Delete Selected ({selectedIds.size})
            </button>
          )}

          <button
            onClick={() => {
              setMode("add");
              setSelectedBanner(null);
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
            Upload Banner
          </button>
        </div>
      </div>

      {/* Content Area - Conditional rendering based on viewMode */}
      {viewMode === "list" ? (
        /* Table View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 focus:ring-[#d81318]"
                        style={{ accentColor: "#d81318" }}
                        checked={
                          filteredBanners.length > 0 &&
                          filteredBanners.every((a) => selectedIds.has(a._id))
                        }
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  <TableHeader
                    sortable
                    onSort={() => handleSort("createdAt")}
                    sorted={sortConfig.key === "createdAt"}
                  >
                    #
                  </TableHeader>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banner
                  </th>
                  <TableHeader
                    sortable
                    onSort={() => handleSort("uploadedBy")}
                    sorted={sortConfig.key === "uploadedBy"}
                  >
                    Uploaded By
                  </TableHeader>
                  <TableHeader
                    sortable
                    onSort={() => handleSort("createdAt")}
                    sorted={sortConfig.key === "createdAt"}
                  >
                    Created
                  </TableHeader>
                  <TableHeader
                    sortable
                    onSort={() => handleSort("expiry")}
                    sorted={sortConfig.key === "expiry"}
                  >
                    Expiry
                  </TableHeader>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Theme
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
                    <td colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="animate-spin rounded-full h-8 w-8 border-3 border-t-transparent"
                          style={{
                            borderColor: "#d81318",
                            borderTopColor: "transparent",
                          }}
                        ></div>
                        <p className="text-gray-500">Loading banners...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FiUploadCloud className="text-4xl text-gray-300" />
                        <p className="text-gray-500">No banners found</p>
                        <button
                          onClick={() => setShowModal(true)}
                          className="text-sm font-medium"
                          style={{ color: "#d81318" }}
                        >
                          Upload your first banner
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((item, index) => {
                    const status = getStatus(item);

                    return (
                      <motion.tr
                        key={item._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 focus:ring-[#d81318]"
                            style={{ accentColor: "#d81318" }}
                            checked={selectedIds.has(item._id)}
                            onChange={() => toggleSelectOne(item._id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                          {(currentPage - 1) * pageSize + index + 1}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group-hover:shadow-md transition-shadow">
                              <img
                                src={item.url}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImg(item.url);
                                  setShowPreview(true);
                                }}
                                className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-200"
                                alt="banner"
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-900">
                          <div className="font-medium">
                            {item.uploadedBy?.username || "Unknown"}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {item._id?.slice(-6) || "N/A"}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-600">
                          <div>
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString()
                              : "—"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString()
                              : "—"}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-gray-600">
                          {item.expiry ? (
                            <>
                              <div>
                                {new Date(item.expiry).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(item.expiry).toLocaleTimeString()}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">No expiry</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="relative">
                            <button
                              onClick={(e) => handleDeviceClick(e, item._id)}
                              className="hover:opacity-80 transition"
                            >
                              <DeviceBadge device={item.device} />
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="relative">
                            <button
                              onClick={(e) => handleThemeClick(e, item._id)}
                              className="hover:opacity-80 transition"
                            >
                              <ThemeBadge theme={item.theme} />
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="relative">
                            <button
                              onClick={(e) => handleStatusClick(e, item._id)}
                              className="hover:opacity-80 transition"
                            >
                              <StatusBadge status={status} />
                            </button>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMode("edit");
                                setSelectedBanner(item);
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
                                confirmDelete(item._id);
                              }}
                              title="Delete"
                            >
                              <MdDelete className="text-lg" />
                            </button>

                            <button
                              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle more options if needed
                              }}
                              title="More options"
                            >
                              <MdMoreVert className="text-lg" />
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
        /* Grid View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
                <p className="text-gray-500">Loading banners...</p>
              </div>
            </div>
          ) : paginated.length === 0 ? (
            <div className="py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <FiUploadCloud className="text-4xl text-gray-300" />
                <p className="text-gray-500">No banners found</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-sm font-medium"
                  style={{ color: "#d81318" }}
                >
                  Upload your first banner
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {paginated.map((item, index) => (
                <BannerCard
                  key={item._id}
                  item={item}
                  index={index}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onEdit={() => {
                    setMode("edit");
                    setSelectedBanner(item);
                    setShowModal(true);
                  }}
                  onDelete={() => confirmDelete(item._id)}
                  onSelect={() => toggleSelectOne(item._id)}
                  isSelected={selectedIds.has(item._id)}
                  onPreview={(url) => {
                    setPreviewImg(url);
                    setShowPreview(true);
                  }}
                  onDeviceClick={handleDeviceClick}
                  onThemeClick={handleThemeClick}
                  onStatusClick={handleStatusClick}
                  getStatus={getStatus}
                />
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Dropdown Menus */}
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
                {openDropdown?.startsWith("device") && "Select Device"}
                {openDropdown?.startsWith("theme") && "Select Theme"}
                {openDropdown?.startsWith("status") && "Select Status"}
              </span>
              <button
                onClick={() => setOpenDropdown(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IoClose size={16} />
              </button>
            </div>

            <div className="py-1">
              {openDropdown?.startsWith("device") &&
                deviceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const id = openDropdown.split("-")[1];
                      handleDeviceChange(id, opt.value);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition text-sm"
                  >
                    {opt.value === "desktop" ? (
                      <MdDesktopWindows className="text-base" />
                    ) : (
                      <MdPhoneIphone className="text-base" />
                    )}
                    {opt.label}
                  </button>
                ))}

              {openDropdown?.startsWith("theme") &&
                themeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const id = openDropdown.split("-")[1];
                      handleThemeChange(id, opt.value);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition text-sm"
                  >
                    {opt.value === "dark" ? (
                      <MdDarkMode className="text-base" />
                    ) : (
                      <MdLightMode className="text-base" />
                    )}
                    {opt.label}
                  </button>
                ))}

              {openDropdown?.startsWith("status") &&
                statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const id = openDropdown.split("-")[1];
                      handleStatusChange(id, opt.value);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition text-sm"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${opt.color}`}
                    ></span>
                    {opt.label}
                  </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      <div className="px-6 py-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredBanners.length)} of{" "}
            {filteredBanners.length} results
          </div>

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
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <ModalBanner
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          refresh={refreshBanners}
          mode={mode}
          bannerData={selectedBanner}
          onSuccess={(msg) => {
            showToast(
              "success",
              msg,
              mode === "edit" ? "Updated!" : "Success!",
            );
          }}
        />
      )}

      {/* IMAGE PREVIEW */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-[9999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setShowPreview(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="relative z-10 max-w-5xl max-h-[90vh]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <button
                onClick={() => setShowPreview(false)}
                className="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition"
              >
                <IoClose size={20} />
              </button>
              <img
                src={previewImg}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                alt="preview"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Banners;
