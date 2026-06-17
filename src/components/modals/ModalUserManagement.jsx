// src/components/modals/ModalUserManagement.jsx
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import {
  ROLE_DISPLAY_OPTIONS,
  mapRoleToBackend,
  mapRoleToFrontend,
} from "../../utils/roleMapping";

// Module constants
const MODULES = {
  DASHBOARD: "dashboard",
  OUTLETS: "outlets",
  PROMOTIONS: "promotions",
  VIDEO_ADS: "videoAds",
  USERS: "users",
};

const MODULE_LABELS = {
  [MODULES.DASHBOARD]: "Dashboard",
  [MODULES.OUTLETS]: "Outlets",
  [MODULES.PROMOTIONS]: "Promotions",
  [MODULES.VIDEO_ADS]: "Video Ads",
  [MODULES.USERS]: "Users",
};

const ModalUserManagement = ({
  isOpen,
  onClose,
  mode,
  userData,
  departments = [],
  outlets = [],
  onSave,
}) => {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin");
  const [departmentId, setDepartmentId] = useState("");
  const [outletId, setOutletId] = useState("");
  const [selectedModules, setSelectedModules] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Available modules list
  const availableModules = [
    { value: MODULES.DASHBOARD, label: MODULE_LABELS[MODULES.DASHBOARD] },
    { value: MODULES.OUTLETS, label: MODULE_LABELS[MODULES.OUTLETS] },
    { value: MODULES.PROMOTIONS, label: MODULE_LABELS[MODULES.PROMOTIONS] },
    { value: MODULES.VIDEO_ADS, label: MODULE_LABELS[MODULES.VIDEO_ADS] },
    { value: MODULES.USERS, label: MODULE_LABELS[MODULES.USERS] },
  ];

  // Check if current role is Super Admin
  const isSuperAdmin = role === "Super Admin";

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && userData) {
        setLastName(userData.lastName || "");
        setFirstName(userData.firstName || "");
        setUsername(userData.username || "");
        setEmail(userData.email || "");
        setContactNumber(userData.contactNumber || "");
        const displayRole = mapRoleToFrontend(userData.roles || "admin");
        setRole(displayRole);
        setDepartmentId(
          userData.departmentId?._id || userData.departmentId || "",
        );
        setOutletId(userData.outletId?._id || userData.outletId || "");

        // Set selected modules from user data (even for super admin)
        setSelectedModules(userData.modules || []);

        setPassword("");
        setErrorMessage("");
      } else if (mode === "add") {
        setLastName("");
        setFirstName("");
        setUsername("");
        setEmail("");
        setContactNumber("");
        setPassword("");
        setRole("Admin");
        setDepartmentId("");
        setOutletId("");
        // Default modules for new user (all 5 for super admin, 3 for regular admin)
        setSelectedModules(["dashboard", "outlets", "promotions"]);
        setErrorMessage("");
      }
    }
  }, [isOpen, mode, userData]);

  // Update modules when role changes
  useEffect(() => {
    if (mode === "add" && isOpen) {
      if (role === "Super Admin") {
        // Super Admin gets all modules by default when creating
        setSelectedModules([
          "dashboard",
          "outlets",
          "promotions",
          "videoAds",
          "users",
        ]);
      } else if (role === "Admin") {
        // Regular Admin gets default 3 modules
        setSelectedModules(["dashboard", "outlets", "promotions"]);
      }
    }
  }, [role, mode, isOpen]);

  const handleClose = () => {
    setErrorMessage("");
    setLoading(false);
    onClose();
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setRole(newRole);

    // Auto-select modules based on role
    if (mode === "add") {
      if (newRole === "Super Admin") {
        setSelectedModules([
          "dashboard",
          "outlets",
          "promotions",
          "videoAds",
          "users",
        ]);
      } else if (newRole === "Admin") {
        setSelectedModules(["dashboard", "outlets", "promotions"]);
      }
    }
    // For edit mode, don't auto-change modules when role changes
  };

  const handleModuleToggle = (moduleValue) => {
    // Allow module changes for all roles (including super admin when editing others)
    setSelectedModules((prev) =>
      prev.includes(moduleValue)
        ? prev.filter((m) => m !== moduleValue)
        : [...prev, moduleValue],
    );
  };

  const handleSubmit = async () => {
    try {
      if (!lastName.trim()) return setErrorMessage("Last name is required.");
      if (!firstName.trim()) return setErrorMessage("First name is required.");
      if (!username.trim() && mode === "add")
        return setErrorMessage("Username is required.");
      if (!password.trim() && mode === "add")
        return setErrorMessage("Password is required.");
      if (!role) return setErrorMessage("Role is required.");

      // Validate at least one module is selected (for non-super admin users being created/edited)
      if (selectedModules.length === 0 && role !== "Super Admin") {
        return setErrorMessage("Please select at least one module.");
      }

      setLoading(true);

      const backendRole = mapRoleToBackend(role);

      // Build payload for both add and edit modes
      const payload = {
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim(),
        roles: backendRole,
        departmentId: departmentId || null,
        outletId: outletId || null,
        modules: selectedModules,
      };

      // Add username and password only for add mode
      if (mode === "add") {
        payload.username = username.trim();
        payload.password = password.trim();
      }

      console.log("Submitting payload:", payload);

      await onSave?.(payload);
      handleClose();
    } catch (err) {
      setErrorMessage(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(""), 3000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  const activeDepartments =
    departments?.filter((d) => d.status === "active") || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative bg-white rounded-2xl shadow-xl w-[600px] max-w-full p-6 z-10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-5 sticky top-0 bg-white pb-2">
              <h2 className="text-lg font-semibold text-gray-800">
                {mode === "edit" ? "Edit User" : "Add User"}
              </h2>
              <button
                className="text-gray-500 hover:text-[#d81318] transition p-1 rounded-lg hover:bg-red-50"
                onClick={handleClose}
              >
                <IoClose size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition"
                  placeholder="Enter first name"
                />
              </div>

              {mode === "add" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition"
                    placeholder="Enter username"
                  />
                </div>
              )}

              {mode === "add" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition"
                    placeholder="Enter password"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition"
                  placeholder="Enter contact number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={role}
                  onChange={handleRoleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition"
                >
                  {ROLE_DISPLAY_OPTIONS.map((r) => (
                    <option key={r.value} value={r.label}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition"
                >
                  <option value="">No Department</option>
                  {activeDepartments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outlet
                </label>
                <select
                  value={outletId}
                  onChange={(e) => setOutletId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition"
                >
                  <option value="">No Site</option>
                  {outlets.map((outlet) => (
                    <option key={outlet._id} value={outlet._id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modules Selection Section - Always show for all roles */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accessible Modules *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableModules.map((module) => (
                  <label
                    key={module.value}
                    className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(module.value)}
                      onChange={() => handleModuleToggle(module.value)}
                      className="w-4 h-4 text-[#d81318] rounded focus:ring-[#d81318]"
                    />
                    <span className="text-sm text-gray-700">
                      {module.label}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isSuperAdmin
                  ? "Super Admin users have access to all modules by default in the system, but you can still select which modules they can manage for other users."
                  : "Select which modules this user can access"}
              </p>
            </div>

            {errorMessage && (
              <p className="text-red-500 text-sm mt-4">{errorMessage}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`mt-6 w-full py-2.5 rounded-xl text-white font-semibold transition-all ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "hover:shadow-lg hover:-translate-y-0.5"
              }`}
              style={!loading ? { background: "#d81318" } : {}}
            >
              {loading
                ? "Saving..."
                : mode === "edit"
                  ? "Update User"
                  : "Add User"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalUserManagement;
