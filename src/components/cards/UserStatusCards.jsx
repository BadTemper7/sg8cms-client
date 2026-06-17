import React from "react";
import { FaUsers } from "react-icons/fa";
import { MdCheckCircle, MdRemoveCircle } from "react-icons/md";

const Card = ({
  active,
  title,
  value,
  subtitle,
  icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-700",
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
          className={`
            w-11 h-11 rounded-xl flex items-center justify-center
            ${iconBg}
            shadow-inner
          `}
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

export default function UserStatusCards({
  total = 0,
  activeCount = 0,
  inactiveCount = 0,
  filterStatus = "all",
  onFilter,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card
        active={filterStatus === "all"}
        title="Total Students"
        value={total}
        subtitle="Active + Inactive"
        icon={<FaUsers />}
        iconBg="bg-gray-100"
        iconColor="text-gray-700"
        accentColor="linear-gradient(to right, #6b7280, #475569)"
        onClick={() => onFilter?.("all")}
      />

      <Card
        active={filterStatus === "active"}
        title="Active"
        value={activeCount}
        subtitle="Currently active"
        icon={<MdCheckCircle />}
        iconBg="bg-green-100"
        iconColor="text-green-700"
        accentColor="linear-gradient(to right, #22c55e, #10b981)"
        onClick={() => onFilter?.("active")}
      />

      <Card
        active={filterStatus === "inactive"}
        title="Inactive"
        value={inactiveCount}
        subtitle="Archived / inactive"
        icon={<MdRemoveCircle />}
        iconBg="bg-gray-200"
        iconColor="text-gray-700"
        accentColor="linear-gradient(to right, #ef4444, #f43f5e)"
        onClick={() => onFilter?.("inactive")}
      />
    </div>
  );
}
