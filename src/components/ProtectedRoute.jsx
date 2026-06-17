import React, { useEffect, useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import { GlobalContext } from "../context/GlobalContextProvider";
import useAuthStore from "../stores/authStore";
import Swal from "sweetalert2";

const ProtectedRoute = ({ children }) => {
  const { apiUrl } = useContext(GlobalContext);

  const { isAuthenticated, checkSession, token, sessionId, hasHydrated } =
    useAuthStore();

  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (!hasHydrated) return;

      if (!token || !sessionId) {
        setIsVerifying(false);
        return;
      }

      const result = await checkSession(apiUrl);

      if (!result.valid && result.reason === "session_mismatch") {
        Swal.fire({
          title: "Session Expired",
          text: "Your account was logged in on another device.",
          icon: "warning",
          confirmButtonColor: "#d33",
        });
      }

      if (!result.valid && result.reason === "unauthorized") {
        Swal.fire({
          title: "Session Expired",
          text: "Please login again.",
          icon: "warning",
          confirmButtonColor: "#d33",
        });
      }

      setIsVerifying(false);
    };

    verifySession();
  }, [apiUrl, token, sessionId, hasHydrated, checkSession]);

  if (!hasHydrated || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
