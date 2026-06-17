// src/pages/Departments.jsx
import React, { useEffect, useMemo, useState, useContext } from "react";
import {
  MdDelete,
  MdEditSquare,
  MdCheckCircle,
  MdRemoveCircle,
  MdFilterList,
  MdSearch,
  MdDownload,
  MdRefresh,
  MdBusiness,
  MdAdd,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import useFetch from "../hooks/useFetch";
import useDepartmentStore from "../stores/departmentStore";
import useAuthStore from "../stores/authStore";
import { GlobalContext } from "../context/GlobalContextProvider";
import DepartmentStatusCards from "../components/cards/DepartmentStatusCards";
import ModalDepartmentManagement from "../components/modals/ModalDepartmentManagement";
import CardDelete from "../components/cards/cardDelete";
import CardSuccess from "../components/cards/cardSuccess";

const DEPARTMENT_COLORS = {
  Marketing: {
    bg: "bg-pink-100",
    text: "text-pink-700",
    border: "border-pink-200",
  },
  "Web Development": {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  Graphics: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  CSR: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
};

const StatusBadge = ({ status }) => {
  const config = {
    active: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
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
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <Icon className="text-sm" />
      {label}
    </span>
  );
};

const Departments = () => {
  const { apiUrl } = useContext(GlobalContext);
  const { token } = useAuthStore();
  const { fetchWithAuth } = useFetch();
  const {
    departments,
    loading,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  } = useDepartmentStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState({
    title: "",
    description: "",
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (token) {
      loadDepartments();
    }
  }, [token]);

  const loadDepartments = async () => {
    const result = await fetchDepartments(apiUrl, fetchWithAuth);
    if (!result.success && result.sessionExpired) return;
    if (!result.success && !result.sessionExpired) {
      setSuccessData({ title: "Error!", description: result.error });
      setShowSuccess(true);
    }
  };

  const refreshDepartments = async () => {
    setIsRefreshing(true);
    await loadDepartments();
    setIsRefreshing(false);
  };

  const { totalCount, activeCount, inactiveCount } = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d.status === "active").length;
    return {
      totalCount: total,
      activeCount: active,
      inactiveCount: total - active,
    };
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    let rows = [...departments];

    if (filterStatus !== "all") {
      rows = rows.filter((d) => d.status === filterStatus);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.code?.toLowerCase().includes(q) ||
          d.headOfDepartment?.toLowerCase().includes(q),
      );
    }

    rows.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [departments, filterStatus, search, sortConfig]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDepartments.length / pageSize),
  );
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDepartments.slice(start, start + pageSize);
  }, [filteredDepartments, currentPage, pageSize]);

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
    return statusMap[filterStatus] || "All";
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const result = await deleteDepartment(apiUrl, deleteId, fetchWithAuth);
    if (result.success) {
      setShowDelete(false);
      setDeleteId(null);
      setSuccessData({
        title: "Deleted!",
        description: "Department deleted successfully.",
      });
      setShowSuccess(true);
    } else if (!result.sessionExpired) {
      setSuccessData({ title: "Error!", description: result.error });
      setShowSuccess(true);
    }
  };

  const onSaveDepartment = async (payload) => {
    let result;
    if (mode === "add") {
      result = await createDepartment(apiUrl, payload, fetchWithAuth);
    } else {
      result = await updateDepartment(
        apiUrl,
        selectedDepartment._id,
        payload,
        fetchWithAuth,
      );
    }

    if (result.success) {
      setSuccessData({
        title: mode === "add" ? "Success!" : "Updated!",
        description:
          mode === "add"
            ? "Department added successfully."
            : "Department updated successfully.",
      });
      setShowSuccess(true);
      setShowModal(false);
      setSelectedDepartment(null);
      setMode("add");
    } else if (!result.sessionExpired) {
      setSuccessData({ title: "Error!", description: result.error });
      setShowSuccess(true);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "#",
      "Name",
      "Code",
      "Description",
      "Head of Department",
      "Status",
      "Created At",
    ];
    const data = filteredDepartments.map((d, i) => [
      i + 1,
      d.name,
      d.code,
      d.description,
      d.headOfDepartment,
      d.status === "active" ? "Active" : "Inactive",
      d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...data].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `departments-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getDepartmentColor = (name) => {
    return (
      DEPARTMENT_COLORS[name] || {
        bg: "bg-gray-100",
        text: "text-gray-700",
        border: "border-gray-200",
      }
    );
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl shadow-sm"
            style={{ background: "#d81318" }}
          >
            <MdBusiness className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Department Management
            </h1>
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
          onClick={refreshDepartments}
          disabled={isRefreshing}
          className="p-2 text-gray-600 hover:text-[#d81318] hover:bg-red-50 rounded-lg transition"
        >
          <MdRefresh
            className={`text-xl ${isRefreshing ? "animate-spin" : ""}`}
          />
        </motion.button>
      </div>

      <DepartmentStatusCards
        total={totalCount}
        active={activeCount}
        inactive={inactiveCount}
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
              setSearch("");
            }}
            className="text-xs text-gray-500 hover:text-[#d81318] transition"
          >
            Clear all filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, code, description, or head..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318]"
            />
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
              setSelectedDepartment(null);
              setShowModal(true);
            }}
            className="font-semibold text-white py-2 px-6 rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            style={{
              background: "#d81318",
              boxShadow: "0 4px 15px rgba(216, 19, 24, 0.3)",
            }}
          >
            <MdAdd /> Add Department
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
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    #{" "}
                    <MdFilterList
                      className={`text-sm ${sortConfig.key === "name" ? "text-[#d81318]" : ""}`}
                    />
                  </button>
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
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
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="animate-spin rounded-full h-8 w-8 border-3 border-t-transparent"
                        style={{
                          borderColor: "#d81318",
                          borderTopColor: "transparent",
                        }}
                      />
                      <p className="text-gray-500">Loading departments...</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <MdBusiness className="text-4xl text-gray-300" />
                      <p className="text-gray-500">No departments found.</p>
                      <button
                        onClick={() => {
                          setMode("add");
                          setSelectedDepartment(null);
                          setShowModal(true);
                        }}
                        className="text-sm font-medium"
                        style={{ color: "#d81318" }}
                      >
                        Add your first department
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((dept, index) => {
                  const colors = getDepartmentColor(dept.name);
                  return (
                    <motion.tr
                      key={dept._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-4 py-4 text-sm text-gray-500 font-mono">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}
                          >
                            <MdBusiness className={`${colors.text} text-lg`} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {dept.name}
                            </div>
                            {dept.description && (
                              <div className="text-xs text-gray-400">
                                {dept.description.substring(0, 50)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={dept.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-lg transition"
                            style={{ color: "#d81318" }}
                            onClick={() => {
                              setMode("edit");
                              setSelectedDepartment(dept);
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
                            onClick={() => {
                              setDeleteId(dept._id);
                              setShowDelete(true);
                            }}
                            title="Delete"
                          >
                            <MdDelete className="text-lg" />
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
            {filteredDepartments.length === 0
              ? 0
              : (currentPage - 1) * pageSize + 1}{" "}
            to {Math.min(currentPage * pageSize, filteredDepartments.length)} of{" "}
            {filteredDepartments.length} results
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

      {showDelete && (
        <CardDelete
          message="This department will be permanently deleted. Users in this department will lose their department assignment."
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
        <ModalDepartmentManagement
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          mode={mode}
          departmentData={selectedDepartment}
          onSave={onSaveDepartment}
        />
      )}
    </div>
  );
};

export default Departments;
