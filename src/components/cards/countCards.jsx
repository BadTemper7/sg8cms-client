import React from "react";
import { FaLayerGroup } from "react-icons/fa";
import {
  MdCheckCircle,
  MdAccessTimeFilled,
  MdVisibilityOff,
} from "react-icons/md";

const StatCard = ({
  active,
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
  accentColor, // ✅ changed from accentClass to accentColor (inline style)
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full text-left rounded-2xl p-5
        transition-all duration-300 overflow-hidden
        bg-white/90 backdrop-blur-sm
        ${active ? "shadow-lg ring-1 ring-blue-200" : "shadow-md hover:shadow-lg"}
      `}
    >
      {/* ✅ Accent bar using inline style — guaranteed to render */}
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

const CountCards = ({
  total = 0,
  active = 0,
  expired = 0,
  hidden = 0,
  onFilter,
  filterStatus = "all",
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        active={filterStatus === "all"}
        title="Total"
        value={total}
        subtitle="All items"
        icon={<FaLayerGroup />}
        iconBg="bg-gray-100"
        iconColor="text-gray-700"
        accentColor="linear-gradient(to right, #3b82f6, #2563eb, #4f46e5)" // ✅ inline gradient
        onClick={() => onFilter?.("all")}
      />
      <StatCard
        active={filterStatus === "active"}
        title="Active"
        value={active}
        subtitle="Visible & running"
        icon={<MdCheckCircle />}
        iconBg="bg-green-100"
        iconColor="text-green-700"
        accentColor="linear-gradient(to right, #22c55e, #10b981)"
        onClick={() => onFilter?.("active")}
      />
      <StatCard
        active={filterStatus === "expired"}
        title="Expired"
        value={expired}
        subtitle="Past expiry date"
        icon={<MdAccessTimeFilled />}
        iconBg="bg-red-100"
        iconColor="text-red-700"
        accentColor="linear-gradient(to right, #ef4444, #f43f5e)"
        onClick={() => onFilter?.("expired")}
      />
      <StatCard
        active={filterStatus === "hide"}
        title="Hidden"
        value={hidden}
        subtitle="Not visible"
        icon={<MdVisibilityOff />}
        iconBg="bg-gray-200"
        iconColor="text-gray-700"
        accentColor="linear-gradient(to right, #6b7280, #475569)"
        onClick={() => onFilter?.("hidden")}
      />
    </div>
  );
};

export default CountCards;
