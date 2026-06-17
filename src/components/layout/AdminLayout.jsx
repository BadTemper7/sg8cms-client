// components/layout/AdminLayout.jsx
import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Sidebar from "./Sidebar";
import Header from "./Header";
import BreadCrumbs from "./Breadcrumbs";
import { GlobalContext } from "../../context/GlobalContextProvider";
import useAuthStore from "../../stores/authStore";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const { apiUrl } = useContext(GlobalContext);
  const { logout, sidebarOpen } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of your account.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      background: "#fff",
      customClass: {
        popup: "rounded-xl",
        confirmButton: "rounded-lg",
        cancelButton: "rounded-lg",
      },
    });

    if (result.isConfirmed) {
      await logout(apiUrl);

      Swal.fire({
        title: "Logged Out!",
        text: "You have been successfully logged out.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        background: "#fff",
      });

      navigate("/login");
    }
  };

  // Only apply marginLeft on desktop devices
  const sidebarWidth = !isMobile && sidebarOpen ? 240 : !isMobile ? 80 : 0;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onLogout={handleLogout} />

      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : `${sidebarWidth}px` }}
      >
        <Header onLogout={handleLogout} />
        <BreadCrumbs />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          {/* Add padding-bottom on mobile to account for bottom navigation */}
          <div
            className={`container mx-auto px-4 sm:px-6 py-4 sm:py-6 ${isMobile ? "pb-20" : ""}`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
