// src/pages/Users.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdDelete,
  MdEditSquare,
  MdCheckCircle,
  MdRemoveCircle,
  MdFilterList,
  MdSearch,
  MdDownload,
  MdRefresh,
  MdLockReset,
  MdPeople,
  MdPersonAdd,
  MdBusiness,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import { mapRoleToFrontend, getRoleColor } from "../utils/roleMapping";
import useFetch from "../hooks/useFetch";
import UserStatusCards from "../components/cards/UserStatusCards";
import ModalUserManagement from "../components/modals/ModalUserManagement";
import CardDelete from "../components/cards/cardDelete";
import CardSuccess from "../components/cards/cardSuccess";
import useUserStore from "../stores/userStore";
import useDepartmentStore from "../stores/departmentStore";
import { useOutletStore } from "../stores/outletStore";
import useAuthStore from "../stores/authStore";
import { GlobalContext } from "../context/GlobalContextProvider";

const ROLE_OPTIONS = ["Admin", "Super Admin"];

const DEPARTMENT_COLORS = {
  Marketing: { bg: "bg-pink-100", text: "text-pink-700" },
  "Web Development": { bg: "bg-blue-100", text: "text-blue-700" },
  Graphics: { bg: "bg-purple-100", text: "text-purple-700" },
  CSR: { bg: "bg-yellow-100", text: "text-yellow-700" },
};

const StatusBadge = ({ status, onClick }) => {
  const config = {
    active: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
      icon: MdCheckCircle,
      label: "Active",
    },
    inactive: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
      dot: "bg-gray-400",
      icon: MdRemoveCircle,
      label: "Inactive",
    },
  };
  const {
    bg,
    text,
    border,
    dot,
    icon: Icon,
    label,
  } = config[status] || config.inactive;

  return (
    <button
      onClick={onClick}
      title="Click to toggle status"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition hover:opacity-80 ${bg} ${text} ${border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <Icon className="text-sm" />
      {label}
    </button>
  );
};

const RoleBadge = ({ role }) => {
  const displayRole = mapRoleToFrontend(role);
  const { bg, text } = getRoleColor(displayRole);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      {displayRole}
    </span>
  );
};

const DepartmentBadge = ({ department }) => {
  if (!department) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const colors = DEPARTMENT_COLORS[department.name] || {
    bg: "bg-gray-100",
    text: "text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <MdBusiness className="mr-1 text-xs" />
      {department.name}
    </span>
  );
};

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
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl transition-opacity duration-300"
        style={{ background: accentColor, opacity: active ? 1 : 0 }}
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

const Avatar = ({ firstName, lastName }) => {
  const initials =
    `${(firstName || "?")[0]}${(lastName || "?")[0]}`.toUpperCase();
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  const color =
    colors[(initials.charCodeAt(0) + initials.charCodeAt(1)) % colors.length];
  return (
    <div
      className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
    >
      {initials}
    </div>
  );
};

const Users = () => {
  const navigate = useNavigate();
  const { apiUrl } = useContext(GlobalContext);
  const { user: currentAuthUser, token } = useAuthStore();
  const { fetchWithAuth } = useFetch();
  const {
    users,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetPassword,
  } = useUserStore();
  const { outlets, fetchOutlets } = useOutletStore();
  const { departments, fetchDepartments } = useDepartmentStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState({
    title: "",
    description: "",
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (token) {
      loadUsers();
      loadDepartments();
      loadOutlets();
    }
  }, [token]);

  const loadUsers = async () => {
    const result = await fetchUsers(apiUrl, token, fetchWithAuth);
    if (!result.success && result.sessionExpired) return;
    if (!result.success && !result.sessionExpired) {
      setSuccessData({ title: "Error!", description: result.error });
      setShowSuccess(true);
    }
  };

  const loadDepartments = async () => {
    await fetchDepartments(apiUrl, fetchWithAuth);
  };
  const loadOutlets = async () => {
    await fetchOutlets(apiUrl, fetchWithAuth);
  };

  const resolveRelation = (value, collection) => {
    if (!value) return null;
    if (typeof value === "object") return value;

    return (
      collection.find((item) => String(item._id) === String(value)) || value
    );
  };

  const getUpdatedUserFromResult = (result, payload) => {
    const returnedUser =
      result?.user ||
      result?.updatedUser ||
      result?.data?.user ||
      result?.data?.updatedUser ||
      result?.data;

    const safeReturnedUser =
      returnedUser &&
      typeof returnedUser === "object" &&
      !Array.isArray(returnedUser)
        ? returnedUser
        : {};

    const mergedUser = {
      ...currentAuthUser,
      ...selectedUser,
      ...payload,
      ...safeReturnedUser,
    };

    const departmentSource =
      safeReturnedUser.departmentId ??
      payload.departmentId ??
      selectedUser?.departmentId ??
      currentAuthUser?.departmentId;

    const outletSource =
      safeReturnedUser.outletId ??
      payload.outletId ??
      selectedUser?.outletId ??
      currentAuthUser?.outletId;

    return {
      ...mergedUser,
      departmentId: resolveRelation(departmentSource, departments),
      outletId: resolveRelation(outletSource, outlets),
      modules: mergedUser.modules || [],
    };
  };

  const syncCurrentAuthUser = (nextUser) => {
    if (!nextUser?._id) return;

    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        ...nextUser,
        modules: nextUser.modules || [],
      },
    });

    window.dispatchEvent(
      new CustomEvent("sg8-auth-user-updated", {
        detail: {
          userId: nextUser._id,
          user: nextUser,
        },
      }),
    );
  };

  const refreshUsers = async () => {
    setIsRefreshing(true);
    await loadUsers();
    setIsRefreshing(false);
  };

  const { totalCount, activeCount, inactiveCount } = useMemo(() => {
    const total = users.length;
    const active = users.filter(
      (u) => u.active === true || u.status === "active",
    ).length;
    return {
      totalCount: total,
      activeCount: active,
      inactiveCount: total - active,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    let rows = [...users];

    if (filterStatus !== "all") {
      rows = rows.filter((u) => {
        const isActive = u.active === true || u.status === "active";
        return filterStatus === "active" ? isActive : !isActive;
      });
    }

    if (filterRole !== "all") {
      rows = rows.filter((u) => {
        const displayRole = mapRoleToFrontend(u.roles);
        return displayRole === filterRole;
      });
    }

    if (filterDepartment !== "all") {
      rows = rows.filter((u) => {
        const deptId = u.departmentId?._id || u.departmentId;
        return deptId === filterDepartment;
      });
    }

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          mapRoleToFrontend(u.roles).toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.departmentId?.name?.toLowerCase().includes(q),
      );
    }

    rows.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === "createdAt") {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }
      if (sortConfig.key === "name") {
        aVal = `${a.lastName} ${a.firstName}`;
        bVal = `${b.lastName} ${b.firstName}`;
      }
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [users, filterStatus, filterRole, filterDepartment, search, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getBreadcrumb = () => {
    const statusMap = { all: "All", active: "Active", inactive: "Inactive" };
    const roleText = filterRole === "all" ? "" : ` • ${filterRole}`;
    const deptText =
      filterDepartment !== "all" && filterDepartment !== ""
        ? ` • ${departments.find((d) => d._id === filterDepartment)?.name || "Department"}`
        : "";
    return `${statusMap[filterStatus] || "All"}${roleText}${deptText}`;
  };

  const handleToggleActive = async (u) => {
    const currentStatus =
      u.active === true || u.status === "active" ? "active" : "inactive";
    const result = await toggleUserStatus(
      apiUrl,
      token,
      u._id,
      currentStatus,
      fetchWithAuth,
    );
    if (result.success) {
      setSuccessData({
        title: "Updated!",
        description: "Status updated successfully.",
      });
      setShowSuccess(true);
    } else if (!result.sessionExpired) {
      setSuccessData({ title: "Error!", description: result.error });
      setShowSuccess(true);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const result = await deleteUser(apiUrl, token, deleteId, fetchWithAuth);
    if (result.success) {
      setShowDelete(false);
      setDeleteId(null);
      setSuccessData({
        title: "Deleted!",
        description: "User deleted successfully.",
      });
      setShowSuccess(true);
    } else if (!result.sessionExpired) {
      setSuccessData({ title: "Error!", description: result.error });
      setShowSuccess(true);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    const result = await resetPassword(
      apiUrl,
      token,
      resetUser._id,
      fetchWithAuth,
    );
    if (result.success) {
      setShowResetPassword(false);
      setResetUser(null);
      setSuccessData({
        title: "Password Reset!",
        description: `Password reset link sent for ${resetUser.firstName} ${resetUser.lastName}.`,
      });
      setShowSuccess(true);
    } else if (!result.sessionExpired) {
      setSuccessData({ title: "Error!", description: result.error });
      setShowSuccess(true);
    }
  };

  const onSaveUser = async (payload) => {
    let result;
    if (mode === "add") {
      result = await createUser(apiUrl, token, payload, fetchWithAuth);
    } else {
      result = await updateUser(
        apiUrl,
        token,
        selectedUser._id,
        payload,
        fetchWithAuth,
      );
    }

    if (result.success) {
      if (mode !== "add") {
        if (String(selectedUser?._id) === String(currentAuthUser?._id)) {
          syncCurrentAuthUser(getUpdatedUserFromResult(result, payload));
        } else {
          window.dispatchEvent(
            new CustomEvent("sg8-auth-user-updated", {
              detail: { userId: selectedUser?._id },
            }),
          );
        }
      }

      setSuccessData({
        title: mode === "add" ? "Success!" : "Updated!",
        description:
          mode === "add"
            ? "User added successfully."
            : "User updated successfully.",
      });
      setShowSuccess(true);
      setShowModal(false);
      setSelectedUser(null);
      setMode("add");
    } else if (!result.sessionExpired) {
      setSuccessData({ title: "Error!", description: result.error });
      setShowSuccess(true);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "#",
      "Last Name",
      "First Name",
      "Username",
      "Email",
      "Role",
      "Department",
      "Status",
      "Created At",
    ];
    const data = filteredUsers.map((u, i) => [
      i + 1,
      u.lastName,
      u.firstName,
      u.username,
      u.email,
      mapRoleToFrontend(u.roles),
      u.departmentId?.name || "",
      u.active === true || u.status === "active" ? "Active" : "Inactive",
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...data].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const activeDepartments =
    departments?.filter((d) => d.status === "active") || [];

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl shadow-sm"
            style={{ background: "#d81318" }}
          >
            <MdPeople className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              User Management
            </h1>
            <div className="flex items-center gap-1 text-sm mt-0.5">
              <span className="text-gray-400">/</span>
              <span className="text-gray-600 font-medium capitalize">
                {getBreadcrumb()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Add View Departments Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/departments")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm"
          >
            <MdBusiness className="text-lg" />
            View Departments
          </motion.button>

          <motion.button
            whileHover={{ rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshUsers}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-[#d81318] hover:bg-red-50 rounded-lg transition"
          >
            <MdRefresh
              className={`text-xl ${isRefreshing ? "animate-spin" : ""}`}
            />
          </motion.button>
        </div>
      </div>

      <UserStatusCards
        total={totalCount}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        filterStatus={filterStatus}
        onFilter={(status) => {
          setFilterStatus(status);
          setCurrentPage(1);
        }}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MdFilterList className="text-lg" style={{ color: "#d81318" }} />
            Filters & Search
          </h3>
          <button
            onClick={() => {
              setFilterStatus("all");
              setFilterRole("all");
              setFilterDepartment("all");
              setSearch("");
            }}
            className="text-xs text-gray-500 hover:text-[#d81318] transition"
          >
            Clear all filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, username, email, role, or department..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Role:</span>
            <button
              onClick={() => {
                setFilterRole("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border shadow-sm ${
                filterRole === "all"
                  ? "text-white border-[#d81318] shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
              style={filterRole === "all" ? { background: "#d81318" } : {}}
            >
              All
            </button>
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setFilterRole(r);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border shadow-sm ${
                  filterRole === r
                    ? "text-white border-[#d81318] shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
                style={filterRole === r ? { background: "#d81318" } : {}}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Department:</span>
            <button
              onClick={() => {
                setFilterDepartment("all");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border shadow-sm ${
                filterDepartment === "all"
                  ? "text-white border-[#d81318] shadow-md"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
              style={
                filterDepartment === "all" ? { background: "#d81318" } : {}
              }
            >
              All
            </button>
            {activeDepartments.map((dept) => (
              <button
                key={dept._id}
                onClick={() => {
                  setFilterDepartment(dept._id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border shadow-sm ${
                  filterDepartment === dept._id
                    ? "text-white border-[#d81318] shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
                style={
                  filterDepartment === dept._id ? { background: "#d81318" } : {}
                }
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Rows per page:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20"
          >
            {[5, 10, 20, 50].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition text-sm"
          >
            <MdDownload /> Export CSV
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setMode("add");
              setSelectedUser(null);
              setShowModal(true);
            }}
            className="font-semibold text-white py-2 px-6 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            style={{
              background: "#d81318",
              boxShadow: "0 4px 15px rgba(216, 19, 24, 0.3)",
            }}
          >
            <MdPersonAdd /> Add User
          </motion.button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("createdAt")}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    #{" "}
                    <MdFilterList
                      className={`text-sm ${sortConfig.key === "createdAt" ? "text-[#d81318]" : ""}`}
                    />
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    User{" "}
                    <MdFilterList
                      className={`text-sm ${sortConfig.key === "name" ? "text-[#d81318]" : ""}`}
                    />
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("createdAt")}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Created At{" "}
                    <MdFilterList
                      className={`text-sm ${sortConfig.key === "createdAt" ? "text-[#d81318]" : ""}`}
                    />
                  </button>
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
                      />
                      <p className="text-gray-500">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <MdPeople className="text-4xl text-gray-300" />
                      <p className="text-gray-500">No users found.</p>
                      <button
                        onClick={() => {
                          setMode("add");
                          setSelectedUser(null);
                          setShowModal(true);
                        }}
                        className="text-sm font-medium"
                        style={{ color: "#d81318" }}
                      >
                        Add your first user
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((u, index) => {
                  const status =
                    u.active === true || u.status === "active"
                      ? "active"
                      : "inactive";
                  return (
                    <motion.tr
                      key={u._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            firstName={u.firstName}
                            lastName={u.lastName}
                          />
                          <div>
                            <div className="font-medium text-gray-900">
                              {u.lastName}, {u.firstName}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              @{u.username}
                            </div>
                            {u.email && (
                              <div className="text-xs text-gray-400">
                                {u.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <RoleBadge role={u.roles} />
                      </td>
                      <td className="px-4 py-4">
                        <DepartmentBadge department={u.departmentId} />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        <div>
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "—"}
                        </div>
                        {u.createdAt && (
                          <div className="text-xs text-gray-400">
                            {new Date(u.createdAt).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          status={status}
                          onClick={() => handleToggleActive(u)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-lg transition"
                            style={{ color: "#d81318" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMode("edit");
                              setSelectedUser(u);
                              setShowModal(true);
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
                              setDeleteId(u._id);
                              setShowDelete(true);
                            }}
                            title="Delete"
                          >
                            <MdDelete className="text-lg" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResetUser(u);
                              setShowResetPassword(true);
                            }}
                            title="Reset Password"
                          >
                            <MdLockReset className="text-lg" />
                          </motion.button>
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

      <div className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing{" "}
            {filteredUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}{" "}
            to {Math.min(currentPage * pageSize, filteredUsers.length)} of{" "}
            {filteredUsers.length} results
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
              {(() => {
                const pages = [];
                if (totalPages <= 5)
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                else if (currentPage <= 3) pages.push(1, 2, 3, 4, 5);
                else if (currentPage >= totalPages - 2)
                  for (let i = totalPages - 4; i <= totalPages; i++)
                    pages.push(i);
                else
                  for (let i = currentPage - 2; i <= currentPage + 2; i++)
                    pages.push(i);
                return pages.map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-xl text-sm font-medium transition ${currentPage === p ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
                    style={currentPage === p ? { background: "#d81318" } : {}}
                  >
                    {p}
                  </button>
                ));
              })()}
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

      <AnimatePresence>
        {showResetPassword && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowResetPassword(false)}
            />
            <motion.div
              className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                  <MdLockReset className="text-3xl text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Reset Password
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Are you sure you want to reset the password for{" "}
                    <span className="font-semibold text-gray-700">
                      {resetUser?.firstName} {resetUser?.lastName}
                    </span>
                    ? A reset link will be sent to their account.
                  </p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => {
                      setShowResetPassword(false);
                      setResetUser(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPassword}
                    className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90 transition shadow-sm"
                    style={{ background: "#d81318" }}
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDelete && (
        <CardDelete
          message="This user will be permanently deleted."
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
      {showModal && (
        <ModalUserManagement
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          mode={mode}
          userData={selectedUser}
          departments={departments}
          outlets={outlets}
          onSave={onSaveUser}
        />
      )}
    </div>
  );
};

export default Users;
