// App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import Announcements from "./pages/Announcements";
import Dashboard from "./pages/Dashboard";
import Banners from "./pages/Banners";
import Outlets from "./pages/Outlets";
import Login from "./pages/Login";
import Users from "./pages/Users";
import Departments from "./pages/Departments";
import Promotions from "./pages/Promotions";
import OutletTerminalManagement from "./pages/OutletTerminalManagement";
import { GlobalContextProvider } from "./context/GlobalContextProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import ModuleRouteGuard from "./components/ModuleRouteGuard";
import Download from "./pages/Download";
import "./style.css";

// Module constants
export const MODULES = {
  DASHBOARD: "dashboard",
  OUTLETS: "outlets",
  PROMOTIONS: "promotions",
  VIDEO_ADS: "videoAds",
  USERS: "users",
  BANNERS: "banners",
  ANNOUNCEMENTS: "announcements",
};

function App() {
  return (
    <GlobalContextProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/downloads" element={<Download />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/dashboard" replace />}
                    />

                    <Route
                      path="/dashboard"
                      element={
                        <ModuleRouteGuard requiredModule={MODULES.DASHBOARD}>
                          <Dashboard />
                        </ModuleRouteGuard>
                      }
                    />

                    <Route
                      path="/outlet-terminals"
                      element={
                        <ModuleRouteGuard requiredModule={MODULES.OUTLETS}>
                          <OutletTerminalManagement />
                        </ModuleRouteGuard>
                      }
                    />

                    <Route
                      path="/promotions"
                      element={
                        <ModuleRouteGuard requiredModule={MODULES.PROMOTIONS}>
                          <Promotions />
                        </ModuleRouteGuard>
                      }
                    />

                    <Route
                      path="/video-ads"
                      element={
                        <ModuleRouteGuard requiredModule={MODULES.VIDEO_ADS}>
                          <Outlets />
                        </ModuleRouteGuard>
                      }
                    />

                    <Route
                      path="/users"
                      element={
                        <ModuleRouteGuard requiredModule={MODULES.USERS}>
                          <Users />
                        </ModuleRouteGuard>
                      }
                    />

                    <Route
                      path="/announcements"
                      element={
                        <ModuleRouteGuard
                          requiredModule={MODULES.ANNOUNCEMENTS}
                        >
                          <Announcements />
                        </ModuleRouteGuard>
                      }
                    />

                    <Route
                      path="/banners"
                      element={
                        <ModuleRouteGuard requiredModule={MODULES.BANNERS}>
                          <Banners />
                        </ModuleRouteGuard>
                      }
                    />

                    <Route path="/departments" element={<Departments />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </GlobalContextProvider>
  );
}

export default App;
