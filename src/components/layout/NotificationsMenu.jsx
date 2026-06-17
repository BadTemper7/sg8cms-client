import React, { useEffect, useRef } from "react";
import { MdCheckCircle, MdError, MdInfo, MdClose } from "react-icons/md";

const NotificationsMenu = ({ onClose }) => {
  const menuRef = useRef(null);

  const notifications = [
    {
      id: 1,
      title: "New announcement created",
      message: "A new announcement has been published",
      time: "5 minutes ago",
      read: false,
      type: "success",
    },
    {
      id: 2,
      title: "Announcement expired",
      message: 'Your announcement "Special Offer" has expired',
      time: "1 hour ago",
      read: false,
      type: "warning",
    },
    {
      id: 3,
      title: "System update",
      message: "New version 2.0.0 is available",
      time: "3 hours ago",
      read: true,
      type: "info",
    },
  ];

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <MdCheckCircle style={{ color: "#d81318" }} />;
      case "warning":
        return <MdError className="text-amber-500" />;
      default:
        return <MdInfo className="text-blue-500" />;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const gradientTextStyle = {
    background: "linear-gradient(45deg, #ff9d03, #fcff1e)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
    >
      <div
        className="p-4 border-b border-gray-200/20 flex justify-between items-center"
        style={{
          background: "linear-gradient(180deg, #0d1650, #0e1243 44%, #03082d)",
        }}
      >
        <h3 className="text-lg font-semibold" style={gradientTextStyle}>
          Notifications
        </h3>
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-white transition-colors duration-200"
        >
          <MdClose className="w-5 h-5" />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
              !notification.read
                ? "bg-gradient-to-r from-[#d81318]/5 to-transparent"
                : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-gray-800">
                    {notification.title}
                  </h4>
                  <span className="text-xs text-gray-400 ml-2">
                    {notification.time}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 text-center border-t border-gray-200 bg-gray-50">
        <button
          className="text-sm font-medium transition-all duration-300 hover:scale-105 hover:opacity-80"
          style={{ color: "#d81318" }}
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationsMenu;
