// components/layout/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FaBars, FaTags, FaUserCog, FaStoreAlt } from "react-icons/fa";
import { MdDashboard, MdVideoLibrary } from "react-icons/md";
import useAuthStore from "../../stores/authStore";

const MODULES = {
  DASHBOARD: "dashboard",
  OUTLETS: "outlets",
  PROMOTIONS: "promotions",
  VIDEO_ADS: "videoAds",
  USERS: "users",
};

function Sidebar() {
  const { sidebarOpen, toggleSidebar, user, isAuthenticated } = useAuthStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 840);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 840);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isAuthenticated || !user) return null;

  // Modules always drive visibility
  const accessibleModules = user?.modules || [];

  // Check if user has an outlet assigned
  const hasOutlet = user?.outletId !== null && user?.outletId !== undefined;

  // Super admin check for debugging/logic
  const isSuperAdmin = user?.roles === "superadmin";

  const allMenuItems = [
    {
      name: "Dashboard",
      icon: <MdDashboard className="w-6 h-6" />,
      href: "/dashboard",
      order: 1,
      module: MODULES.DASHBOARD,
      requiresOutlet: false,
    },
    {
      name: "Outlets",
      icon: <FaStoreAlt className="w-6 h-6" />,
      href: "/outlet-terminals",
      order: 2,
      module: MODULES.OUTLETS,
      requiresOutlet: false, // Changed to false - always show if user has module access
    },
    {
      name: "Promotions",
      icon: <FaTags className="w-6 h-6" />,
      href: "/promotions",
      order: 3,
      module: MODULES.PROMOTIONS,
      requiresOutlet: false,
    },
    {
      name: "Video Ads",
      icon: <MdVideoLibrary className="w-6 h-6" />,
      href: "/video-ads",
      order: 4,
      module: MODULES.VIDEO_ADS,
      requiresOutlet: false,
    },
    {
      name: "Users",
      icon: <FaUserCog className="w-6 h-6" />,
      href: "/users",
      order: 5,
      module: MODULES.USERS,
      requiresOutlet: false,
    },
  ];

  const desktopMenuItems = allMenuItems
    .filter((item) => {
      // Must have module access
      if (!accessibleModules.includes(item.module)) {
        console.log(`Filtering out ${item.name}: no module access`);
        return false;
      }

      // For outlets module: if user has no outlet assigned but has module access, still show
      // The outlet management page will handle showing all outlets or just assigned one
      if (item.module === MODULES.OUTLETS) {
        console.log(
          `Showing ${item.name}: module access granted, outlet assigned: ${hasOutlet}`,
        );
        return true;
      }

      return true;
    })
    .sort((a, b) => a.order - b.order);

  console.log("Sidebar Debug:", {
    accessibleModules,
    hasOutlet,
    isSuperAdmin,
    menuItems: desktopMenuItems.map((i) => i.name),
  });

  if (desktopMenuItems.length === 0) return null;

  const activeLinkStyle = {
    background: "linear-gradient(45deg, #ff9d03, #fcff1e)",
    color: "#5c3d00",
    fontWeight: 600,
    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between shadow-2xl h-screen fixed top-0 left-0 px-5 py-10 transition-all duration-300 z-40 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
        style={{
          background:
            "linear-gradient(180deg, #0d1650, #000327 36%, #0e1243 44%, #03082d)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none" />

        <button
          onClick={toggleSidebar}
          className="absolute top-5 -right-3 text-white rounded-full p-2 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 z-50"
          style={{ background: "#d81318" }}
        >
          <FaBars className="w-4 h-4" />
        </button>

        <div className="relative z-10">
          <div className="text-center mb-10">
            {sidebarOpen ? (
              <div className="space-y-2 overflow-hidden">
                <div className="p-0.5 rounded-2xl inline-block">
                  <img
                    src="/images/icons/sg8-casino-logo.webp"
                    alt="SG8 Casino Logo"
                    className="h-24 w-auto mx-auto"
                  />
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  Content Management System
                </p>
              </div>
            ) : (
              <div className="p-0.5 rounded-xl inline-block">
                <img
                  src="/images/icons/sg8-icon.webp"
                  alt="SG8 Icon"
                  className="h-8 w-auto"
                />
              </div>
            )}
          </div>

          <ul className="space-y-4">
            {desktopMenuItems.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center ${sidebarOpen ? "" : "justify-center"} gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "shadow-lg backdrop-blur-sm font-semibold"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`
                  }
                  style={({ isActive }) => (isActive ? activeLinkStyle : {})}
                >
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="whitespace-nowrap overflow-hidden">
                      {item.name}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <div
          className="rounded-t-3xl shadow-2xl backdrop-blur-xl"
          style={{
            background:
              "linear-gradient(180deg, #0d1650, #0e1243 44%, #03082d)",
          }}
        >
          <div className="flex justify-around items-center py-3 px-4">
            {desktopMenuItems.map((item, index) => (
              <NavLink
                key={index}
                to={item.href}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 transition-all duration-300 ${
                    isActive
                      ? "transform -translate-y-2"
                      : "hover:transform hover:-translate-y-1"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className="p-2 rounded-full transition-all duration-300"
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(45deg, #ff9d03, #fcff1e)",
                              color: "#5c3d00",
                              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                            }
                          : { color: "#9ca3af" }
                      }
                    >
                      {item.icon}
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(45deg, #ff9d03, #fcff1e)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                              fontWeight: 600,
                            }
                          : { color: "#9ca3af", fontWeight: 500 }
                      }
                    >
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
