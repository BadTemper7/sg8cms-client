// components/ModuleRouteGuard.jsx
import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";

const MODULE_ROUTES = [
  { module: "dashboard", path: "/dashboard" },
  { module: "outlets", path: "/outlet-terminals" },
  { module: "promotions", path: "/promotions" },
  { module: "videoAds", path: "/video-ads" },
  { module: "users", path: "/users" },
];

const AccessDeniedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const firstAccessible = MODULE_ROUTES.find(({ module }) =>
    user?.modules?.includes(module),
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-6">
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #0d1650, #03082d)" }}
        >
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Access Restricted
        </h1>
        <p className="text-gray-500 mb-8">
          You don't have permission to view this page. Please contact your
          administrator if you think this is a mistake.
        </p>

        {firstAccessible ? (
          <button
            onClick={() => navigate(firstAccessible.path, { replace: true })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            style={{
              background: "linear-gradient(45deg, #ff9d03, #fcff1e)",
              color: "#5c3d00",
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go to My Dashboard
          </button>
        ) : (
          // No accessible modules at all — only option is logout
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            style={{ background: "#d81318", color: "#fff" }}
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
};

const ModuleRouteGuard = ({ children, requiredModule }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // No required module = always accessible
  if (!requiredModule) {
    return children;
  }

  const userModules = user?.modules || [];

  // ✅ User has access
  if (userModules.includes(requiredModule)) {
    return children;
  }

  // ❌ No access — show restricted page
  return <AccessDeniedPage />;
};

export default ModuleRouteGuard;
