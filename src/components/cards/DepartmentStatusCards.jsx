// src/components/cards/DepartmentStatusCards.jsx
import React from "react";
import { MdBusiness, MdCheckCircle, MdRemoveCircle } from "react-icons/md";

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

const DepartmentStatusCards = ({
  total,
  active,
  inactive,
  filterStatus,
  onFilter,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        active={filterStatus === "all"}
        title="Total Departments"
        value={total}
        subtitle="All departments"
        icon={<MdBusiness />}
        iconBg="bg-gray-100"
        iconColor="text-gray-700"
        accentColor="linear-gradient(to right, #6b7280, #475569)"
        onClick={() => onFilter?.("all")}
      />
      <StatCard
        active={filterStatus === "active"}
        title="Active"
        value={active}
        subtitle="Active departments"
        icon={<MdCheckCircle />}
        iconBg="bg-emerald-100"
        iconColor="text-emerald-700"
        accentColor="linear-gradient(to right, #22c55e, #10b981)"
        onClick={() => onFilter?.("active")}
      />
      <StatCard
        active={filterStatus === "inactive"}
        title="Inactive"
        value={inactive}
        subtitle="Inactive departments"
        icon={<MdRemoveCircle />}
        iconBg="bg-gray-200"
        iconColor="text-gray-600"
        accentColor="linear-gradient(to right, #ef4444, #f43f5e)"
        onClick={() => onFilter?.("inactive")}
      />
    </div>
  );
};

export default DepartmentStatusCards;
