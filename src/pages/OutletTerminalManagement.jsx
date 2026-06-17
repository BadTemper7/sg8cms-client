import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  IoChevronDown,
  IoStorefrontOutline,
  IoSearch,
  IoCloseCircle,
  IoArrowBack,
  IoFilter,
} from "react-icons/io5";
import {
  MdAdd,
  MdComputer,
  MdRefresh,
  MdWifi,
  MdWifiOff,
  MdDelete,
  MdStore,
} from "react-icons/md";
import AddOutletModal from "../components/modals/AddOutletModal";
import AddTerminalModal from "../components/modals/AddTerminalModal";
import { useOutletStore } from "../stores/outletStore";
import { useTerminalStore } from "../stores/terminalStore";
import useAuthStore from "../stores/authStore";
import toast, { Toaster } from "react-hot-toast";
import Swal from "sweetalert2";

/* ---------------- config ---------------- */
const OFFLINE_THRESHOLD_SECONDS = 15;
const WS_RECONNECT_DELAY = 3000;
const WS_DEBOUNCE_MS = 100;

const PRIMARY_COLOR = "#d81318";

const DEFAULT_SERVER_URL = "https://sg8cms-server.onrender.com";

const WS_URL =
  process.env.REACT_APP_WS_URL ||
  (window.location.hostname === "localhost"
    ? "ws://localhost:5000"
    : DEFAULT_SERVER_URL.replace(/^http/, "ws"));

/* ---------------- helpers ---------------- */
const cx = (...classes) => classes.filter(Boolean).join(" ");

const nowMs = () => Date.now();

const parseMs = (iso) => {
  const t = iso ? new Date(iso).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
};

const getLauncherRunningState = (terminal) => {
  if (terminal?.isLaunchedGame !== undefined) {
    return Boolean(terminal.isLaunchedGame);
  }

  if (terminal?.isLauncherRunning !== undefined) {
    return Boolean(terminal.isLauncherRunning);
  }

  if (terminal?.launcherRunning !== undefined) {
    return Boolean(terminal.launcherRunning);
  }

  if (terminal?.isOnline !== undefined) {
    return Boolean(terminal.isOnline);
  }

  return null;
};

const calculateStatus = (terminal) => {
  const launcherRunning = getLauncherRunningState(terminal);

  if (launcherRunning !== null) {
    return launcherRunning ? "online" : "offline";
  }

  const lastSeenAt = terminal?.lastSeenAt;
  const last = parseMs(lastSeenAt);

  if (!last) return "offline";

  return nowMs() - last <= OFFLINE_THRESHOLD_SECONDS * 1000
    ? "online"
    : "offline";
};

const isOnline = (status) => String(status || "").toLowerCase() === "online";

const getTerminalSearchText = (terminal) =>
  [
    terminal.name,
    terminal.terminalName,
    terminal.displayName,
    terminal.title,
    terminal.label,
    terminal.code,
    terminal.deviceKey,
    terminal.machineId,
    terminal.description,
    terminal.status,
    terminal.ipAddress,
    terminal.ip,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const RocketIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.5 4.5 19.5 10.5M4 20l4.75-1.25L18.5 9a3.54 3.54 0 0 0-5-5L3.75 13.75 2.5 18.5 4 20Z"
    />
  </svg>
);

const ShieldIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3 5 6v5c0 4.55 2.91 8.63 7 10 4.09-1.37 7-5.45 7-10V6l-7-3Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="m9 12 2 2 4-4"
    />
  </svg>
);

const PowerIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 3v9m6.36-5.36a9 9 0 1 1-12.72 0"
    />
  </svg>
);

const VideoIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 10l4.55-2.28A1 1 0 0 1 21 8.62v6.76a1 1 0 0 1-1.45.9L15 14m-9 4h7a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"
    />
  </svg>
);

/* ---------------- SweetAlert2 helpers ---------------- */
const confirmAction = (title, text, confirmButtonText = "Yes, proceed") =>
  Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: PRIMARY_COLOR,
    cancelButtonColor: "#6b7280",
    confirmButtonText,
  }).then((result) => result.isConfirmed);

const confirmDelete = (title, text) =>
  Swal.fire({
    title,
    html: text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: PRIMARY_COLOR,
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
  }).then((result) => result.isConfirmed);

/* ---------------- UI components ---------------- */
const StatCard = ({ title, value, subtitle, icon, tone = "blue" }) => {
  const tones = {
    blue: {
      card: "from-blue-50 to-blue-100 border-blue-100",
      icon: "bg-blue-500 text-white",
      label: "text-blue-600",
      value: "text-blue-800",
    },
    green: {
      card: "from-green-50 to-green-100 border-green-100",
      icon: "bg-green-500 text-white",
      label: "text-green-600",
      value: "text-green-800",
    },
    red: {
      card: "from-red-50 to-red-100 border-red-100",
      icon: "bg-red-500 text-white",
      label: "text-red-600",
      value: "text-red-800",
    },
    cyan: {
      card: "from-cyan-50 to-cyan-100 border-cyan-100",
      icon: "bg-cyan-500 text-white",
      label: "text-cyan-600",
      value: "text-cyan-800",
    },
    orange: {
      card: "from-orange-50 to-orange-100 border-orange-100",
      icon: "bg-orange-500 text-white",
      label: "text-orange-600",
      value: "text-orange-800",
    },
  };

  const current = tones[tone] || tones.blue;

  return (
    <div
      className={cx(
        "rounded-xl border bg-gradient-to-r p-4 shadow-sm transition-shadow hover:shadow-md",
        current.card,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={cx("text-sm font-medium", current.label)}>{title}</p>
          <p className={cx("mt-1 text-2xl font-bold", current.value)}>
            {value}
          </p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>

        <div
          className={cx(
            "grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl shadow-sm",
            current.icon,
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ online }) => (
  <span
    className={cx(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
      online ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
    )}
  >
    <span
      className={cx(
        "h-1.5 w-1.5 rounded-full",
        online ? "bg-green-500" : "bg-red-500",
      )}
    />
    {online ? "Online" : "Offline"}
  </span>
);

const ToggleControl = ({
  label,
  active,
  activeText,
  inactiveText,
  icon,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left transition hover:border-gray-300 hover:bg-gray-100"
  >
    <span className="flex min-w-0 items-center gap-2">
      <span className={active ? "text-green-600" : "text-gray-400"}>
        {icon}
      </span>
      <span className="truncate text-xs font-medium text-gray-700">
        {label}
      </span>
    </span>

    <span className="flex shrink-0 items-center gap-2">
      <span
        className={cx(
          "text-[10px] font-semibold",
          active ? "text-green-600" : "text-gray-500",
        )}
      >
        {active ? activeText : inactiveText}
      </span>
      <span
        className={cx(
          "relative h-5 w-9 rounded-full transition",
          active ? "bg-green-500" : "bg-gray-300",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all",
            active ? "left-4" : "left-0.5",
          )}
        />
      </span>
    </span>
  </button>
);

const TerminalActionButton = ({
  children,
  icon,
  onClick,
  disabled,
  variant = "primary",
}) => {
  const variants = {
    primary: "border-transparent bg-[#d81318] text-white hover:bg-red-700",
    neutral:
      "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800",
    danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
      )}
    >
      {icon}
      {children}
    </button>
  );
};

const SearchFilterBar = ({
  search,
  onSearchChange,
  selectedOutlet,
  filterDropdownRef,
  showFilterDropdown,
  setShowFilterDropdown,
  currentFilter,
  filterOptions,
  filter,
  setFilter,
}) => {
  const [inputValue, setInputValue] = useState(search || "");
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    setInputValue(search || "");
  }, [search]);

  useEffect(() => {
    return () => clearTimeout(searchDebounceRef.current);
  }, []);

  const updateSearch = (value) => {
    setInputValue(value);
    clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 120);
  };

  const clearSearch = () => {
    clearTimeout(searchDebounceRef.current);
    setInputValue("");
    onSearchChange("");
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <IoSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />

          <input
            value={inputValue}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder={
              selectedOutlet
                ? "Search terminals by name, code, description, IP, status..."
                : "Search outlets or terminals by name, code, description, IP, status..."
            }
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm text-gray-700 outline-none transition focus:border-[#d81318] focus:ring-2 focus:ring-[#d81318]/20"
          />

          {inputValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
            >
              <IoCloseCircle size={18} />
            </button>
          )}
        </div>

        <div className="relative" ref={filterDropdownRef}>
          <button
            type="button"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 md:w-auto"
          >
            {currentFilter.icon}
            {currentFilter.label}
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setFilter(opt.value);
                    setShowFilterDropdown(false);
                  }}
                  className={cx(
                    "flex w-full items-center gap-2 px-4 py-2 text-sm transition hover:bg-gray-50",
                    filter === opt.value
                      ? "bg-red-50 font-semibold text-[#d81318]"
                      : "text-gray-600",
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------- Component ---------------- */
const OutletTerminalManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedOutlet = searchParams.get("outlet");

  const { user } = useAuthStore();

  const {
    outlets,
    loading: outletsLoading,
    fetchOutlets,
    createOutlet,
    deleteOutlet,
  } = useOutletStore();

  const {
    terminals,
    loading: terminalsLoading,
    fetchTerminals,
    createTerminal,
    lockTerminal,
    toggleGameDisabled,
    updateGameLaunched,
    deleteTerminal,
    removeTerminal,
  } = useTerminalStore();

  const [liveTerminals, setLiveTerminals] = useState([]);
  const liveTerminalsRef = useRef([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedOutletDetails, setSelectedOutletDetails] = useState(null);

  const [showAddOutletModal, setShowAddOutletModal] = useState(false);
  const [showAddTerminalModal, setShowAddTerminalModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [lastWsMessage, setLastWsMessage] = useState(null);
  const [recentUpdates, setRecentUpdates] = useState({});
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [expandedOutlets, setExpandedOutlets] = useState({});

  const filterDropdownRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const pendingUpdatesRef = useRef(new Map());
  const wsConnectionIdRef = useRef(0);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    const handleAuthUserUpdated = (event) => {
      const nextUser = event?.detail?.user;

      if (!nextUser?._id || String(nextUser._id) !== String(user?._id)) {
        return;
      }

      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          ...nextUser,
          modules: nextUser.modules || [],
        },
      });
    };

    window.addEventListener("sg8-auth-user-updated", handleAuthUserUpdated);

    return () => {
      window.removeEventListener(
        "sg8-auth-user-updated",
        handleAuthUserUpdated,
      );
    };
  }, [user?._id]);

  const isSuperAdmin = user?.roles === "superadmin";
  const userOutletId = user?.outletId?._id || user?.outletId || null;
  const hasAssignedOutlet = Boolean(userOutletId);

  const filteredOutletsByUser = useMemo(() => {
    if (hasAssignedOutlet) {
      return outlets.filter(
        (outlet) => String(outlet._id) === String(userOutletId),
      );
    }

    return outlets;
  }, [outlets, hasAssignedOutlet, userOutletId]);

  useEffect(() => {
    liveTerminalsRef.current = liveTerminals;
  }, [liveTerminals]);

  useEffect(() => {
    const saved = localStorage.getItem("selectedOutlet");

    if (hasAssignedOutlet) {
      if (saved && String(saved) !== String(userOutletId)) {
        localStorage.removeItem("selectedOutlet");
      }

      if (selectedOutlet && String(selectedOutlet) !== String(userOutletId)) {
        setSearchParams({}, { replace: true });
      }

      return;
    }

    if (saved && !searchParams.get("outlet")) {
      setSearchParams({ outlet: saved }, { replace: true });
    }
  }, [
    searchParams,
    selectedOutlet,
    setSearchParams,
    hasAssignedOutlet,
    userOutletId,
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLockTerminal = async (terminalId, isLocked) => {
    const action = isLocked ? "release" : "secure";

    if (
      !(await confirmAction(
        `${isLocked ? "Release" : "Secure"} PC`,
        "Are you sure you want to update this PC security mode?",
        `Yes, ${action} PC`,
      ))
    ) {
      return;
    }

    try {
      await lockTerminal(terminalId, !isLocked);
      toast.success(`PC ${isLocked ? "released" : "secured"}`);
    } catch (err) {
      toast.error(err.message || `Failed to ${action} PC`);
    }
  };

  const handleToggleGameDisabled = async (terminalId, isDisabled) => {
    const nextMode = isDisabled ? "disable" : "enable";

    if (
      !(await confirmAction(
        `${isDisabled ? "Disable" : "Enable"} Video Only Mode`,
        "Are you sure you want to update the launcher mode?",
        `Yes, ${nextMode} it`,
      ))
    ) {
      return;
    }

    try {
      await toggleGameDisabled(terminalId, !isDisabled);
      toast.success(`Video Only Mode ${isDisabled ? "disabled" : "enabled"}`);
    } catch (err) {
      toast.error(err.message || "Failed to update launcher mode");
    }
  };

  const handleGameLaunch = async (terminalId, isLaunched) => {
    const action = isLaunched ? "close" : "launch";

    if (
      !(await confirmAction(
        `${isLaunched ? "Close" : "Launch"} SG8 Launcher`,
        "Are you sure?",
        `Yes, ${action} launcher`,
      ))
    ) {
      return;
    }

    try {
      const nextLaunchedState = !isLaunched;

      await updateGameLaunched(terminalId, nextLaunchedState);

      setLiveTerminals((prev) =>
        prev.map((terminal) =>
          terminal._id === terminalId || terminal._id?.toString() === terminalId
            ? {
                ...terminal,
                isLaunchedGame: nextLaunchedState,
                isOnline: nextLaunchedState,
                status: nextLaunchedState ? "online" : "offline",
                lastUpdated: nowMs(),
              }
            : terminal,
        ),
      );

      setRecentUpdates((prev) => ({ ...prev, [terminalId]: nowMs() }));
      setTimeout(
        () =>
          setRecentUpdates((prev) => {
            const next = { ...prev };
            delete next[terminalId];
            return next;
          }),
        1000,
      );

      toast.success(`SG8 Launcher ${isLaunched ? "closed" : "launched"}`);
    } catch (err) {
      toast.error(err.message || `Failed to ${action} SG8 Launcher`);
    }
  };

  const handleDeleteTerminal = async (terminalId, terminalName) => {
    if (
      !(await confirmDelete(
        "Remove Terminal and Regenerate ID?",
        `This will delete <strong>${terminalName}</strong> from CMS.<br/><br/>If the launcher is online, it will generate a new permanent ID and show the outlet setup screen. If it is offline, it will regenerate the ID when it opens and sees the old terminal no longer exists.`,
      ))
    ) {
      return;
    }

    try {
      const removeFn = removeTerminal || deleteTerminal;
      if (removeFn) await removeFn(terminalId);
      else throw new Error("Remove terminal is not implemented in store");

      setLiveTerminals((prev) =>
        prev.filter(
          (terminal) =>
            terminal._id !== terminalId &&
            terminal._id?.toString() !== terminalId,
        ),
      );

      await fetchTerminals();

      toast.success(
        `Terminal "${terminalName}" removed. Launcher can regenerate a new ID.`,
      );
    } catch (err) {
      toast.error(err.message || "Remove terminal failed");
    }
  };

  const clearOutletSelection = useCallback(() => {
    localStorage.removeItem("selectedOutlet");
    setSearchParams({});
  }, [setSearchParams]);

  const handleDeleteOutlet = async (outletId, outletName) => {
    if (
      !(await confirmDelete(
        "Delete Outlet?",
        `Delete "${outletName}" and all its terminals?`,
      ))
    ) {
      return;
    }

    try {
      if (deleteOutlet) await deleteOutlet(outletId);
      else throw new Error("Delete not implemented in store");

      toast.success(`Outlet "${outletName}" deleted`);

      if (selectedOutlet === outletId) {
        clearOutletSelection();
      }
    } catch (err) {
      toast.error(err.message || "Delete failed");
    }
  };

  const applyPendingUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.size === 0) return;

    setLiveTerminals((prev) => {
      let changed = false;
      const updated = [...prev];

      pendingUpdatesRef.current.forEach((update, id) => {
        const idx = updated.findIndex(
          (t) => t._id === id || t._id?.toString() === id,
        );

        if (idx >= 0) {
          const nextTerminal = {
            ...updated[idx],
            ...update,
          };
          const nextStatus = calculateStatus(nextTerminal);

          if (
            updated[idx].status !== nextStatus ||
            updated[idx].isOnline !== update.isOnline ||
            updated[idx].isLaunchedGame !== update.isLaunchedGame
          ) {
            updated[idx] = {
              ...nextTerminal,
              isOnline: nextStatus === "online",
              status: nextStatus,
              lastUpdated: nowMs(),
            };
            changed = true;
          }
        }
      });

      if (changed) {
        const newRecent = {};
        pendingUpdatesRef.current.forEach((_, id) => {
          newRecent[id] = nowMs();
        });

        setRecentUpdates(newRecent);
        setTimeout(() => setRecentUpdates({}), 1000);
      }

      return changed ? updated : prev;
    });

    pendingUpdatesRef.current.clear();
  }, []);

  const refreshDataFromWebSocket = useCallback(async () => {
    try {
      await Promise.all([fetchOutlets(), fetchTerminals()]);
    } catch (e) {
      console.error("[WebSocket] refresh failed", e);
    }
  }, [fetchOutlets, fetchTerminals]);

  const connectWebSocket = useCallback(() => {
    isUnmountedRef.current = false;
    wsConnectionIdRef.current += 1;

    const connectionId = wsConnectionIdRef.current;

    clearTimeout(reconnectTimeoutRef.current);
    clearTimeout(updateTimeoutRef.current);
    pendingUpdatesRef.current.clear();

    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;

      if (
        wsRef.current.readyState === WebSocket.CONNECTING ||
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        wsRef.current.close();
      }

      wsRef.current = null;
    }

    setWsStatus("connecting");

    try {
      const ws = new WebSocket(`${WS_URL}?admin=true`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (
          isUnmountedRef.current ||
          wsConnectionIdRef.current !== connectionId
        ) {
          return;
        }

        console.log("[WebSocket] Connected to server as admin");
        setWsStatus("connected");

        ws.send(
          JSON.stringify({
            type: "SUBSCRIBE_TERMINALS",
            timestamp: new Date().toISOString(),
          }),
        );
      };

      ws.onmessage = (event) => {
        if (
          isUnmountedRef.current ||
          wsConnectionIdRef.current !== connectionId
        ) {
          return;
        }

        try {
          const msg = JSON.parse(event.data);

          if (msg.type !== "TERMINAL_HEARTBEAT") {
            setLastWsMessage({
              type: msg.type,
              timestamp: nowMs(),
              data: msg.data || msg,
            });
          }

          if (
            msg.type === "TERMINAL_STATUS_UPDATE" ||
            msg.type === "TERMINAL_HEARTBEAT" ||
            msg.type === "DEVICE_WS"
          ) {
            const {
              terminalId,
              deviceKey,
              isOnline,
              isLaunchedGame,
              isLauncherRunning,
              launcherRunning,
              lastSeenAt,
            } = msg.data || {};

            let id = terminalId;

            if (!id && deviceKey) {
              const term = liveTerminalsRef.current.find(
                (t) => t.deviceKey === deviceKey,
              );

              if (term) id = term._id;
            }

            if (id) {
              const nextLauncherRunning =
                isLaunchedGame ??
                isLauncherRunning ??
                launcherRunning ??
                isOnline ??
                (msg.type !== "DEVICE_WS"
                  ? true
                  : msg.data?.action === "connected");

              pendingUpdatesRef.current.set(id, {
                isLaunchedGame: Boolean(nextLauncherRunning),
                isOnline: Boolean(nextLauncherRunning),
                lastSeenAt: lastSeenAt || new Date().toISOString(),
              });

              clearTimeout(updateTimeoutRef.current);

              updateTimeoutRef.current = setTimeout(
                applyPendingUpdates,
                WS_DEBOUNCE_MS,
              );
            }
          } else if (msg.type === "TERMINAL_GAME_DISABLED_UPDATE") {
            const { terminalId, isGameDisabled } = msg.data || {};

            setLiveTerminals((prev) =>
              prev.map((t) =>
                t._id === terminalId || t._id?.toString() === terminalId
                  ? { ...t, isGameDisabled }
                  : t,
              ),
            );
          } else if (msg.type === "TERMINAL_GAME_LAUNCHED_UPDATE") {
            const { terminalId, isLaunchedGame } = msg.data || {};
            const launcherRunning = Boolean(isLaunchedGame);

            setLiveTerminals((prev) =>
              prev.map((t) =>
                t._id === terminalId || t._id?.toString() === terminalId
                  ? {
                      ...t,
                      isLaunchedGame: launcherRunning,
                      isOnline: launcherRunning,
                      status: launcherRunning ? "online" : "offline",
                      lastUpdated: nowMs(),
                    }
                  : t,
              ),
            );

            if (terminalId) {
              setRecentUpdates((prev) => ({ ...prev, [terminalId]: nowMs() }));
              setTimeout(
                () =>
                  setRecentUpdates((prev) => {
                    const next = { ...prev };
                    delete next[terminalId];
                    return next;
                  }),
                1000,
              );
            }
          } else if (
            msg.type === "TERMINAL_REMOVED" ||
            msg.type === "TERMINAL_DELETED" ||
            msg.type === "ADMIN_TERMINAL_DELETED"
          ) {
            const { terminalId } = msg.data || {};

            if (terminalId) {
              setLiveTerminals((prev) =>
                prev.filter(
                  (t) =>
                    t._id !== terminalId && t._id?.toString() !== terminalId,
                ),
              );
            }
          } else if (
            msg.type === "TERMINAL_CREATED" ||
            msg.type === "TERMINAL_ADDED" ||
            msg.type === "TERMINAL_REGISTERED" ||
            msg.type === "TERMINAL_UPDATED" ||
            msg.type === "OUTLET_CREATED" ||
            msg.type === "OUTLET_UPDATED" ||
            msg.type === "OUTLET_DELETED" ||
            msg.type === "ADMIN_REFRESH_TERMINALS"
          ) {
            void refreshDataFromWebSocket();
          }
        } catch (e) {
          console.error("[WS] parse error", e);
        }
      };

      ws.onerror = () => {
        if (
          isUnmountedRef.current ||
          wsConnectionIdRef.current !== connectionId
        ) {
          return;
        }

        console.error("[WebSocket] Error");
        setWsStatus("error");
      };

      ws.onclose = () => {
        if (
          isUnmountedRef.current ||
          wsConnectionIdRef.current !== connectionId
        ) {
          return;
        }

        console.log("[WebSocket] Disconnected");
        setWsStatus("disconnected");

        clearTimeout(updateTimeoutRef.current);
        pendingUpdatesRef.current.clear();

        reconnectTimeoutRef.current = setTimeout(() => {
          if (
            !isUnmountedRef.current &&
            wsConnectionIdRef.current === connectionId
          ) {
            connectWebSocket();
          }
        }, WS_RECONNECT_DELAY);
      };
    } catch (e) {
      if (
        isUnmountedRef.current ||
        wsConnectionIdRef.current !== connectionId
      ) {
        return;
      }

      console.error("[WebSocket] Failed to connect:", e);
      setWsStatus("error");
    }
  }, [applyPendingUpdates, refreshDataFromWebSocket]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connectWebSocket();

    return () => {
      isUnmountedRef.current = true;
      wsConnectionIdRef.current += 1;

      clearTimeout(reconnectTimeoutRef.current);
      clearTimeout(updateTimeoutRef.current);
      pendingUpdatesRef.current.clear();

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([fetchOutlets(), fetchTerminals()]);
      } catch (e) {
        console.error(e);
      }
    };

    load();
  }, [fetchOutlets, fetchTerminals]);

  useEffect(() => {
    setLiveTerminals(
      (terminals || []).map((t) => {
        const launcherRunning = getLauncherRunningState(t) ?? false;
        const normalizedTerminal = {
          ...t,
          isLaunchedGame: launcherRunning,
          isOnline: launcherRunning,
        };

        return {
          ...normalizedTerminal,
          status: calculateStatus(normalizedTerminal),
          lastUpdated: nowMs(),
        };
      }),
    );
  }, [terminals]);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);

    try {
      await Promise.all([fetchOutlets(), fetchTerminals()]);
      toast.success("Data refreshed");
    } catch {
      toast.error("Refresh failed");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const { outletGroups, outletStats } = useMemo(() => {
    const map = {};

    filteredOutletsByUser.forEach((o) => {
      map[o._id] = {
        id: o._id,
        name: `${o.code} - ${o.name}`,
        outletData: o,
        terminals: [],
        online: 0,
        offline: 0,
        total: 0,
      };
    });

    liveTerminals.forEach((t) => {
      if (!map[t.outletId]) {
        const o = filteredOutletsByUser.find((x) => x._id === t.outletId);

        if (o) {
          map[t.outletId] = {
            id: t.outletId,
            name: o ? `${o.code} - ${o.name}` : "Unknown Outlet",
            outletData: o,
            terminals: [],
            online: 0,
            offline: 0,
            total: 0,
          };
        } else {
          return;
        }
      }

      if (map[t.outletId]) {
        map[t.outletId].terminals.push(t);
        map[t.outletId].total++;

        if (isOnline(t.status)) map[t.outletId].online++;
        else map[t.outletId].offline++;
      }
    });

    const arr = Object.values(map).sort((a, b) =>
      (a.outletData?.code || "").localeCompare(b.outletData?.code || ""),
    );

    const onlineOutlets = arr.filter((g) => g.online > 0).length;
    const offlineOutlets = arr.filter(
      (g) => g.total === 0 || g.offline === g.terminals.length,
    ).length;

    return {
      outletGroups: arr,
      outletStats: {
        total: arr.length,
        online: onlineOutlets,
        offline: offlineOutlets,
      },
    };
  }, [liveTerminals, filteredOutletsByUser]);

  useEffect(() => {
    if (outletsLoading || terminalsLoading) return;

    if (!selectedOutlet) {
      setSelectedOutletDetails(null);
      return;
    }

    const group = outletGroups.find((g) => g.id === selectedOutlet);

    if (!group) {
      localStorage.removeItem("selectedOutlet");
      setSearchParams({});
      return;
    }

    localStorage.setItem("selectedOutlet", selectedOutlet);
    setSelectedOutletDetails(group);
  }, [
    selectedOutlet,
    outletGroups,
    outletsLoading,
    terminalsLoading,
    setSearchParams,
  ]);

  const dashboardStats = useMemo(() => {
    const allowedOutletIds = new Set(
      filteredOutletsByUser.map((outlet) => String(outlet._id)),
    );

    const scopedTerminals = liveTerminals.filter((terminal) =>
      allowedOutletIds.has(String(terminal.outletId)),
    );

    const total = scopedTerminals.length;
    const online = scopedTerminals.filter((terminal) =>
      isOnline(terminal.status),
    ).length;
    const offline = total - online;
    const secured = scopedTerminals.filter(
      (terminal) => terminal.isLocked,
    ).length;
    const videoOnly = scopedTerminals.filter(
      (terminal) => terminal.isGameDisabled,
    ).length;
    const launched = scopedTerminals.filter(
      (terminal) => terminal.isLaunchedGame,
    ).length;

    return {
      total,
      online,
      offline,
      secured,
      videoOnly,
      launched,
    };
  }, [liveTerminals, filteredOutletsByUser]);

  const visibleOutletGroups = useMemo(() => {
    const source =
      selectedOutlet && selectedOutletDetails
        ? [selectedOutletDetails]
        : outletGroups;

    const q = search.trim().toLowerCase();

    return source
      .map((group) => {
        const outletText = [
          group.name,
          group.outletData?.code,
          group.outletData?.name,
          group.outletData?.location,
          group.outletData?.siteValue,
        ]
          .join(" ")
          .toLowerCase();

        const outletMatch = q ? outletText.includes(q) : false;

        let terminalList = [...(group.terminals || [])];

        if (q) {
          terminalList = terminalList.filter(
            (terminal) =>
              outletMatch || getTerminalSearchText(terminal).includes(q),
          );
        }

        if (filter === "online") {
          terminalList = terminalList.filter((terminal) =>
            isOnline(terminal.status),
          );
        } else if (filter === "offline") {
          terminalList = terminalList.filter(
            (terminal) => !isOnline(terminal.status),
          );
        }

        terminalList.sort((a, b) => (a.code || "").localeCompare(b.code || ""));

        return {
          ...group,
          outletMatch,
          visibleTerminals: terminalList,
        };
      })
      .filter((group) => {
        if (selectedOutlet) return true;
        if (!q && filter === "all") return true;
        if (group.visibleTerminals.length > 0) return true;
        if (group.outletMatch && filter === "all") return true;
        if (!q && filter === "offline" && group.total === 0) return true;

        return false;
      });
  }, [selectedOutlet, selectedOutletDetails, outletGroups, search, filter]);

  const handleSaveOutlet = async (form) => {
    setAddError("");

    if (!form.code) return setAddError("Outlet Code is required.");
    if (!form.name) return setAddError("Outlet Name is required.");
    if (!form.siteValue) return setAddError("Site Value is required.");

    if (outlets.some((o) => o.code.toLowerCase() === form.code.toLowerCase())) {
      return setAddError("Outlet code already exists.");
    }

    setSaving(true);

    try {
      await createOutlet({
        ...form,
        code: form.code.trim(),
        name: form.name.trim(),
        siteValue: form.siteValue.trim(),
        location: form.location.trim(),
        active: true,
      });

      setShowAddOutletModal(false);
      toast.success("Outlet created");
    } catch (err) {
      toast.error(err.message || "Failed to create outlet");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTerminal = async (form) => {
    setAddError("");

    if (!form.code) return setAddError("Terminal Code is required.");
    if (!selectedOutlet) return setAddError("No outlet selected.");

    if (
      terminals.some((t) => t.code.toLowerCase() === form.code.toLowerCase())
    ) {
      return setAddError("Terminal code already exists.");
    }

    setSaving(true);

    try {
      await createTerminal(selectedOutlet, {
        ...form,
        code: form.code.trim(),
        description: form.description.trim(),
        active: true,
      });

      setShowAddTerminalModal(false);
      toast.success("Terminal added");
    } catch (err) {
      toast.error(err.message || "Failed to create terminal");
    } finally {
      setSaving(false);
    }
  };

  const getOutletName = (id) => {
    const outlet = filteredOutletsByUser.find(
      (o) => String(o._id) === String(id),
    );
    return outlet?.name || "Unknown Outlet";
  };

  const isRecentlyUpdated = (id) =>
    recentUpdates[id] && nowMs() - recentUpdates[id] < 1000;

  const toggleOutletExpanded = (id) => {
    setExpandedOutlets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const loading = outletsLoading || terminalsLoading;

  const filterOptions = [
    { label: "All", value: "all", icon: <IoFilter size={14} /> },
    {
      label: "Online",
      value: "online",
      icon: <MdWifi size={14} className="text-green-600" />,
    },
    {
      label: "Offline",
      value: "offline",
      icon: <MdWifiOff size={14} className="text-red-500" />,
    },
  ];

  const currentFilter =
    filterOptions.find((o) => o.value === filter) || filterOptions[0];

  const canAddOutlet = isSuperAdmin && !hasAssignedOutlet;
  const canAddTerminal = false;
  const canDeleteOutlet = isSuperAdmin && !hasAssignedOutlet;

  const canRemoveTerminal = (terminal) => {
    if (!terminal?._id) return false;
    if (isSuperAdmin && !hasAssignedOutlet) return true;
    if (hasAssignedOutlet) {
      return String(terminal.outletId) === String(userOutletId);
    }

    return isSuperAdmin;
  };

  const wsTone =
    wsStatus === "connected"
      ? "bg-green-100 text-green-700"
      : wsStatus === "connecting"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  const renderTerminalCard = (terminal) => {
    const online = isOnline(terminal.status);
    const recentlyUpdated = isRecentlyUpdated(terminal._id);
    const isVideoOnlyMode = terminal.isGameDisabled || false;
    const isLaunchedGame = terminal.isLaunchedGame || false;
    const terminalName =
      terminal.name ||
      terminal.terminalName ||
      terminal.displayName ||
      terminal.title ||
      terminal.label ||
      terminal.code ||
      "Terminal";

    return (
      <motion.div
        key={terminal._id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cx(
          "bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group relative",
          recentlyUpdated && "ring-2 ring-[#d81318]/20",
        )}
      >
        <div className="p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cx(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-xl border",
                  online
                    ? "border-blue-100 bg-blue-50 text-blue-600"
                    : "border-gray-200 bg-gray-100 text-gray-400",
                )}
              >
                <MdComputer size={28} />
              </div>

              <div className="min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-lg font-semibold text-gray-900">
                    {terminalName}
                  </h3>
                  {recentlyUpdated && (
                    <span className="h-2 w-2 rounded-full bg-[#d81318]" />
                  )}
                </div>

                <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
                  {terminal.description || "No description"}
                </p>

                {terminal.code && terminal.code !== terminalName && (
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    Code: {terminal.code}
                  </p>
                )}

                <p className="mt-0.5 truncate text-xs text-gray-400">
                  Outlet: {getOutletName(terminal.outletId)}
                </p>
              </div>
            </div>

            <StatusBadge online={online} />
          </div>

          <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Device Key:{" "}
            <span className="font-semibold text-gray-700">
              {terminal.deviceKey}
            </span>
          </div>

          <div className="mb-3 flex gap-2">
            <TerminalActionButton
              onClick={(e) => {
                e.stopPropagation();
                handleGameLaunch(terminal._id, false);
              }}
              disabled={isLaunchedGame}
              icon={<RocketIcon />}
            >
              {isLaunchedGame ? "Launcher Active" : "Launch SG8 Launcher"}
            </TerminalActionButton>

            <TerminalActionButton
              variant="neutral"
              onClick={(e) => {
                e.stopPropagation();
                handleGameLaunch(terminal._id, true);
              }}
              disabled={!isLaunchedGame}
              icon={<PowerIcon />}
            >
              Close
            </TerminalActionButton>
          </div>

          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <ToggleControl
              label="Video Only Mode"
              active={isVideoOnlyMode}
              activeText="On"
              inactiveText="Off"
              icon={<VideoIcon />}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleGameDisabled(terminal._id, isVideoOnlyMode);
              }}
            />

            <ToggleControl
              label="Secure PC"
              active={terminal.isLocked}
              activeText="Secured"
              inactiveText="Open"
              icon={<ShieldIcon />}
              onClick={(e) => {
                e.stopPropagation();
                handleLockTerminal(terminal._id, terminal.isLocked);
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {terminal.isLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                <ShieldIcon className="h-3.5 w-3.5" />
                Secured
              </span>
            )}

            {isVideoOnlyMode && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                <VideoIcon className="h-3.5 w-3.5" />
                Video Only
              </span>
            )}

            {isLaunchedGame && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                <PowerIcon className="h-3.5 w-3.5" />
                Running
              </span>
            )}
          </div>

          {canRemoveTerminal(terminal) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTerminal(terminal._id, terminalName || "Unnamed");
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              title="Remove terminal and regenerate launcher ID"
            >
              <MdDelete size={16} />
              Remove Terminal
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <Toaster position="top-right" />

      <AddOutletModal
        isOpen={showAddOutletModal}
        onClose={() => {
          setShowAddOutletModal(false);
          setAddError("");
        }}
        onSave={handleSaveOutlet}
        saving={saving}
        error={addError}
      />

      <AddTerminalModal
        isOpen={showAddTerminalModal && !!selectedOutlet}
        onClose={() => {
          setShowAddTerminalModal(false);
          setAddError("");
        }}
        onSave={handleSaveTerminal}
        saving={saving}
        error={addError}
        outletName={getOutletName(selectedOutlet)}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="grid h-12 w-12 place-items-center rounded-xl text-white shadow-sm"
            style={{ background: PRIMARY_COLOR }}
          >
            <MdComputer className="text-2xl" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              PC / Terminal Observation Mode
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Monitor, observe and control all gaming terminals in real time
              {wsStatus === "connected" && (
                <span className="ml-2 text-xs text-green-600">● Live</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cx(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold",
              wsTone,
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            WS {wsStatus}
          </span>

          {lastWsMessage && (
            <span className="hidden rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600 md:inline-flex">
              Last event:{" "}
              <span className="ml-1 font-semibold">{lastWsMessage.type}</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:opacity-60"
          >
            <MdRefresh className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          {selectedOutlet && isSuperAdmin && !hasAssignedOutlet && (
            <button
              type="button"
              onClick={clearOutletSelection}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              <IoArrowBack />
              All Outlets
            </button>
          )}

          {selectedOutlet && canAddTerminal && (
            <button
              type="button"
              onClick={() => setShowAddTerminalModal(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:shadow-lg"
              style={{ background: PRIMARY_COLOR }}
            >
              <MdAdd className="text-lg" />
              Add Terminal
            </button>
          )}

          {!selectedOutlet && canAddOutlet && (
            <button
              type="button"
              onClick={() => setShowAddOutletModal(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:shadow-lg"
              style={{ background: PRIMARY_COLOR }}
            >
              <IoStorefrontOutline size={18} />
              Add Outlet
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Terminals"
          value={dashboardStats.total}
          subtitle={`${outletStats.total} outlet${outletStats.total === 1 ? "" : "s"}`}
          icon={<MdComputer />}
          tone="blue"
        />

        <StatCard
          title="Online Terminals"
          value={dashboardStats.online}
          subtitle={
            dashboardStats.total
              ? `${Math.round((dashboardStats.online / dashboardStats.total) * 100)}% of total`
              : "No terminals"
          }
          icon={<MdWifi />}
          tone="green"
        />

        <StatCard
          title="Offline Terminals"
          value={dashboardStats.offline}
          subtitle={
            dashboardStats.total
              ? `${Math.round((dashboardStats.offline / dashboardStats.total) * 100)}% of total`
              : "No terminals"
          }
          icon={<MdWifiOff />}
          tone="red"
        />

        <StatCard
          title="Secured PCs"
          value={dashboardStats.secured}
          subtitle={`${dashboardStats.videoOnly} video only`}
          icon={<ShieldIcon className="h-6 w-6" />}
          tone="cyan"
        />

        <StatCard
          title="Launcher Active"
          value={dashboardStats.launched}
          subtitle="Currently running"
          icon={<PowerIcon className="h-6 w-6" />}
          tone="orange"
        />
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedOutlet={selectedOutlet}
        filterDropdownRef={filterDropdownRef}
        showFilterDropdown={showFilterDropdown}
        setShowFilterDropdown={setShowFilterDropdown}
        currentFilter={currentFilter}
        filterOptions={filterOptions}
        filter={filter}
        setFilter={setFilter}
      />

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            style={{
              borderColor: PRIMARY_COLOR,
              borderTopColor: "transparent",
            }}
          />
          <p className="text-gray-500">Loading terminal observation data...</p>
        </div>
      ) : visibleOutletGroups.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <MdComputer className="mx-auto mb-4 text-5xl text-gray-300" />
          <p className="text-gray-500">No terminals found</p>
          <p className="mt-1 text-sm text-gray-400">
            Try changing the search or status filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleOutletGroups.map((group) => {
            const isExpanded =
              Boolean(expandedOutlets[group.id]) ||
              Boolean(search.trim()) ||
              filter !== "all";

            return (
              <motion.section
                key={group.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => toggleOutletExpanded(group.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white shadow-sm"
                      style={{ background: PRIMARY_COLOR }}
                    >
                      <MdStore size={21} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-gray-900">
                        {group.name}
                      </h2>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {group.total} terminal{group.total === 1 ? "" : "s"},{" "}
                        {group.online} online, {group.offline} offline
                      </p>
                    </div>

                    <IoChevronDown
                      className={cx(
                        "ml-auto shrink-0 text-gray-400 transition-transform",
                        isExpanded && "rotate-180",
                      )}
                      size={20}
                    />
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {group.visibleTerminals.length} shown
                    </span>

                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      {group.online} online
                    </span>

                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                      {group.offline} offline
                    </span>

                    {canDeleteOutlet && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOutlet(
                            group.id,
                            group.outletData?.code || "Outlet",
                          );
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100"
                      >
                        <MdDelete size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4">
                    {group.visibleTerminals.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
                        <MdComputer className="mx-auto mb-3 text-4xl text-gray-300" />
                        <p className="font-medium text-gray-700">
                          No paired launchers found
                        </p>
                        <p className="mx-auto mt-1 max-w-xl text-sm text-gray-500">
                          Install SG8 Launcher on a PC, select this outlet
                          during setup, and it will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3 min-[1900px]:grid-cols-4">
                        {group.visibleTerminals.map(renderTerminalCard)}
                      </div>
                    )}
                  </div>
                )}
              </motion.section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OutletTerminalManagement;
