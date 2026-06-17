import React, { useEffect, useRef } from "react";
import {
  MdPerson,
  MdSettings,
  MdPrivacyTip,
  MdHelp,
  MdLogout,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";

const AccountMenu = ({ onClose, onLogout }) => {
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const menuItems = [
    { icon: MdPerson, label: "Profile", href: "/profile" },
    { icon: MdSettings, label: "Settings", href: "/settings" },
    { icon: MdPrivacyTip, label: "Privacy", href: "/privacy" },
    { icon: MdHelp, label: "Help", href: "/help" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    onClose();
  };

  const handleNavigation = (href) => {
    navigate(href);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
    >
      <div
        className="p-4 border-b border-gray-200"
        style={{
          background: "linear-gradient(180deg, #0d1650, #0e1243 44%, #03082d",
        }}
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: "#d81318" }}
          >
            {user?.firstName?.charAt(0) || "U"}
            {user?.lastName?.charAt(0) || ""}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {user?.firstName || "No Name"} {user?.lastName || ""}
            </p>
            <p className="text-xs text-gray-300">{user?.email || "No Email"}</p>
          </div>
        </div>
      </div>
      <div className="py-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(item.href)}
            className="w-full flex items-center px-4 py-2.5 text-gray-700 hover:text-[#d81318] transition-colors duration-200 group"
          >
            <item.icon className="mr-3 text-lg text-gray-500 group-hover:text-[#d81318] transition-colors duration-200" />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
        <div className="border-t border-gray-200 mt-2 pt-2">
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center px-4 py-2.5 transition-colors duration-200 group"
            style={{ color: "#d81318" }}
          >
            <MdLogout
              className="mr-3 text-lg transition-colors duration-200"
              style={{ color: "#d81318" }}
            />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountMenu;
