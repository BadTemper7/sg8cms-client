// hooks/useFetch.js
import { useCallback } from "react";
import useAuthStore from "../stores/authStore";
import Swal from "sweetalert2";

const useFetch = () => {
  const { token, sessionId, logout } = useAuthStore();

  const fetchWithAuth = useCallback(
    async (url, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      if (sessionId) {
        headers["X-Session-ID"] = sessionId;
      }

      const config = {
        ...options,
        headers,
      };

      try {
        const response = await fetch(url, config);

        // Handle unauthorized (401)
        if (response.status === 401) {
          const data = await response.json();

          // Check for session expired specifically
          if (
            data.code === "SESSION_EXPIRED" ||
            data.message?.includes("Session expired") ||
            data.message?.includes("logged out from another device")
          ) {
            // Clear auth state
            await logout();

            // Show alert
            await Swal.fire({
              title: "Session Expired",
              text:
                data.message || "You have been logged out from another device.",
              icon: "warning",
              confirmButtonColor: "#d33",
              confirmButtonText: "OK",
            });

            // Redirect to login
            window.location.href = "/login";

            // Throw custom error
            const error = new Error("Session expired");
            error.code = "SESSION_EXPIRED";
            throw error;
          }

          // Other 401 errors
          throw new Error(data.message || "Unauthorized");
        }

        return response;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
    },
    [token, sessionId, logout],
  );

  return { fetchWithAuth };
};

export default useFetch;
