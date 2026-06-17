import React, { useState } from "react";
import NotificationsMenu from "./NotificationsMenu";
import AccountMenu from "./AccountMenu";
import { MdNotifications, MdAccountCircle } from "react-icons/md";

const Header = ({ onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const gradientTextStyle = {
    background: "linear-gradient(45deg, #ff9d03, #fcff1e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  return (
    <header className="bg-white shadow-sm h-16 flex items-center justify-end px-6">
      {/* Right Section */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-gray-600 hover:text-[#d81318] focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 relative group"
          >
            <MdNotifications className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            <span
              className="absolute top-1 right-1 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
              style={{
                background: "linear-gradient(45deg, #ff9d03, #fcff1e)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                color: "#5c3d00",
                fontSize: "8px",
                fontWeight: "700",
              }}
            >
              3
            </span>
          </button>
          {showNotifications && (
            <NotificationsMenu onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* Account Menu */}
        <div className="relative">
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="flex items-center space-x-2 text-gray-600 hover:text-[#d81318] focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
          >
            <MdAccountCircle className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
          </button>
          {showAccountMenu && (
            <AccountMenu
              onClose={() => setShowAccountMenu(false)}
              onLogout={onLogout}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
