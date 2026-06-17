import React, { createContext, useState, useEffect } from "react";

// Create the context
export const GlobalContext = createContext();

export const GlobalContextProvider = ({ children }) => {
  const [apiUrl, setApiUrl] = useState(process.env.REACT_APP_BACKEND_API);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userModules, setUserModules] = useState([]);
  const [userOutletId, setUserOutletId] = useState(null);

  // Function to get user from localStorage
  const getUserFromStorage = () => {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        const parsedData = JSON.parse(authStorage);
        const user = parsedData.state?.user;

        setCurrentUser(user);
        setUserRole(user?.roles || null);
        setIsSuperAdmin(user?.roles === "superadmin");
        setUserModules(user?.modules || []);
        setUserOutletId(user?.outletId?._id || user?.outletId || null);

        console.log("=== User Information from GlobalContext ===");
        console.log("Username:", user?.username);
        console.log("Role:", user?.roles);
        console.log("Is Super Admin:", user?.roles === "superadmin");
        console.log("Modules:", user?.modules);
        console.log("Outlet ID:", user?.outletId?._id || user?.outletId);
        console.log("Full User Object:", user);

        return user;
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setIsSuperAdmin(false);
        setUserModules([]);
        setUserOutletId(null);
        console.log("No auth-storage found. Please login first.");
        return null;
      }
    } catch (error) {
      console.error("Error parsing auth-storage:", error);
      return null;
    }
  };

  // Listen for storage events (when localStorage changes in another tab)
  const handleStorageChange = (event) => {
    if (event.key === "auth-storage") {
      console.log("auth-storage changed, refreshing user data...");
      getUserFromStorage();
    }
  };

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname === "localhost") {
      setApiUrl(process.env.REACT_APP_BACKEND_API_TEST);
    }

    // Check if screen is mobile on initial load
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Get initial user data
    getUserFromStorage();

    // Listen for localStorage changes
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Also check for user changes periodically (optional, for same-tab updates)
  useEffect(() => {
    const interval = setInterval(() => {
      const authStorage = localStorage.getItem("auth-storage");
      if (authStorage) {
        try {
          const parsedData = JSON.parse(authStorage);
          const user = parsedData.state?.user;

          // Check if user data changed
          if (JSON.stringify(user) !== JSON.stringify(currentUser)) {
            console.log("User data changed, updating...");
            getUserFromStorage();
          }
        } catch (error) {
          console.error("Error checking user data:", error);
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [currentUser]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Helper method to refresh user data manually
  const refreshUserData = () => {
    return getUserFromStorage();
  };

  return (
    <GlobalContext.Provider
      value={{
        apiUrl,
        sidebarOpen,
        toggleSidebar,
        currentUser,
        userRole,
        isSuperAdmin,
        userModules,
        userOutletId,
        refreshUserData,
        // Helper methods
        hasModuleAccess: (moduleName) => {
          if (isSuperAdmin) return true;
          return userModules.includes(moduleName);
        },
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
