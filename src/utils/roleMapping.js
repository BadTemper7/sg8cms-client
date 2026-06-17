// src/utils/roleMapping.js

// User Roles (for system permissions)
export const ROLE_DISPLAY_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Super Admin", value: "superadmin" },
];

// Role colors for display
const ROLE_COLORS = {
  Admin: { bg: "bg-orange-100", text: "text-orange-700" },
  "Super Admin": { bg: "bg-red-100", text: "text-red-700" },
};

// Department colors (for display)
export const DEPARTMENT_COLORS = {
  Marketing: { bg: "bg-pink-100", text: "text-pink-700" },
  "Web Development": { bg: "bg-blue-100", text: "text-blue-700" },
  Graphics: { bg: "bg-purple-100", text: "text-purple-700" },
  CSR: { bg: "bg-yellow-100", text: "text-yellow-700" },
  None: { bg: "bg-gray-100", text: "text-gray-600" },
};

// Map frontend role (display name) to backend role (database value)
export const mapRoleToBackend = (frontendRole) => {
  if (frontendRole === "Super Admin") return "superadmin";
  return "admin";
};

// Map backend role (database value) to frontend display name
export const mapRoleToFrontend = (backendRole) => {
  if (backendRole === "superadmin") return "Super Admin";
  return "Admin";
};

// Get role color for display
export const getRoleColor = (role) => {
  if (role === "Super Admin") return ROLE_COLORS["Super Admin"];
  return ROLE_COLORS["Admin"];
};

// Get department color for display
export const getDepartmentColor = (department) => {
  return DEPARTMENT_COLORS[department] || DEPARTMENT_COLORS.None;
};
