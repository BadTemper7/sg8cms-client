  import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
  } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import {
    IoClose,
    IoChevronForward,
    IoStorefrontOutline,
  } from "react-icons/io5";
  import {
    MdAdd,
    MdVisibility,
    MdVisibilityOff,
    MdContentCopy,
    MdCheckCircle,
    MdComputer,
    MdLocationOn,
    MdBusiness,
    MdRefresh,
    MdWifi,
    MdWifiOff,
    MdDelete,
  } from "react-icons/md";
  import { useOutletStore } from "../../stores/outletStore";
  import { useTerminalStore } from "../../stores/terminalStore";

  /* ---------------- config ---------------- */
  const OFFLINE_THRESHOLD_SECONDS = 15;
  const STATUS_REFRESH_INTERVAL = 5000;
  const DATA_REFRESH_INTERVAL = 30000;
  const WS_RECONNECT_DELAY = 3000;
  const WS_DEBOUNCE_MS = 100;

  const getWebSocketUrl = () => {
    const envUrl = String(process.env.REACT_APP_WS_URL || "")
      .trim()
      .replace(/\/+$/, "");

    if (envUrl) {
      return envUrl.endsWith("/ws") ? envUrl : `${envUrl}/ws`;
    }

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      return "ws://localhost:5000/ws";
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.host}/ws`;
  };

  const WS_URL = getWebSocketUrl();

  /* ---------------- helpers ---------------- */
  const nowMs = () => Date.now();
  const parseMs = (iso) => {
    const t = iso ? new Date(iso).getTime() : 0;
    return Number.isNaN(t) ? 0 : t;
  };

  const calculateStatus = (terminal) => {
    if (terminal.isOnline !== undefined) {
      return terminal.isOnline ? "online" : "offline";
    }

    const lastSeenAt = terminal?.lastSeenAt;
    const last = parseMs(lastSeenAt);
    if (!last) return "offline";

    const isOnline = nowMs() - last <= OFFLINE_THRESHOLD_SECONDS * 1000;
    return isOnline ? "online" : "offline";
  };

  const isOnline = (status) => String(status || "").toLowerCase() === "online";

  const pcImageSrc = (online) =>
    `/images/terminals/${online ? "on-pc.png" : "off-pc.png"}`;

  const ModalDevices = ({ isOpen, onClose }) => {
    const {
      outlets,
      loading: outletsLoading,
      fetchOutlets,
      createOutlet,
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
    } = useTerminalStore();

    const [liveTerminals, setLiveTerminals] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [reveal, setReveal] = useState({});
    const [copiedId, setCopiedId] = useState(null);
    const [selectedOutlet, setSelectedOutlet] = useState(null);
    const [selectedOutletDetails, setSelectedOutletDetails] = useState(null);

    const [showAddOutlet, setShowAddOutlet] = useState(false);
    const [showAddTerminal, setShowAddTerminal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [outletForm, setOutletForm] = useState({
      code: "",
      name: "",
      location: "",
      siteValue: "",
      active: true,
    });
    const [terminalForm, setTerminalForm] = useState({
      code: "",
      description: "",
      active: true,
      isGameDisabled: false,
    });
    const [addError, setAddError] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [wsStatus, setWsStatus] = useState("disconnected");
    const [lastWsMessage, setLastWsMessage] = useState(null);
    const [recentUpdates, setRecentUpdates] = useState({});
    const [deletingTerminalId, setDeletingTerminalId] = useState(null);

    const statusIntervalRef = useRef(null);
    const dataRefreshIntervalRef = useRef(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const updateTimeoutRef = useRef(null);
    const pendingUpdatesRef = useRef(new Map());

    const handleLockTerminal = async (terminalId, currentLockState) => {
      try {
        await lockTerminal(terminalId, !currentLockState);
        console.log(
          `Terminal ${terminalId} ${!currentLockState ? "locked" : "unlocked"} successfully`,
        );
      } catch (error) {
        console.error("Failed to lock/unlock terminal:", error);
      }
    };

    const handleToggleGameDisabled = async (
      terminalId,
      currentGameDisabledState,
    ) => {
      try {
        await toggleGameDisabled(terminalId, !currentGameDisabledState);
        console.log(
          `Terminal ${terminalId} games ${!currentGameDisabledState ? "disabled" : "enabled"} successfully`,
        );
      } catch (error) {
        console.error("Failed to toggle game disabled status:", error);
      }
    };

    const handleGameLaunch = async (terminalId, currentLaunchedState) => {
      try {
        await updateGameLaunched(terminalId, !currentLaunchedState);
        console.log(
          `Terminal ${terminalId} game ${!currentLaunchedState ? "launched" : "closed"} successfully`,
        );
      } catch (error) {
        console.error("Failed to toggle game launch:", error);
      }
    };

    const handleDeleteTerminal = async (terminal) => {
      const terminalId = terminal?._id;
      if (!terminalId || deletingTerminalId) return;

      const terminalName = terminal?.code || "this terminal";
      const confirmed = window.confirm(
        `Remove ${terminalName}? This will delete the terminal from CMS and allow the SG8 Launcher on that PC to generate and pair a new ID.`,
      );

      if (!confirmed) return;

      setDeletingTerminalId(terminalId);

      try {
        await deleteTerminal(terminalId);

        setLiveTerminals((prev) =>
          prev.filter((item) => String(item._id) !== String(terminalId)),
        );

        await fetchTerminals();
        console.log(`Terminal ${terminalId} removed successfully`);
      } catch (error) {
        console.error("Failed to remove terminal:", error);
        window.alert(error?.message || "Failed to remove terminal");
      } finally {
        setDeletingTerminalId(null);
      }
    };

    // Batch updates to prevent blinking
    const applyPendingUpdates = useCallback(() => {
      if (pendingUpdatesRef.current.size === 0) return;

      console.log(
        `[WebSocket] Applying ${pendingUpdatesRef.current.size} batched updates`,
      );

      setLiveTerminals((prev) => {
        const updated = [...prev];
        let hasChanges = false;

        pendingUpdatesRef.current.forEach((update, terminalId) => {
          const index = updated.findIndex(
            (t) => t._id === terminalId || t._id?.toString() === terminalId,
          );

          if (index !== -1) {
            const currentTerminal = updated[index];
            const newStatus = update.isOnline ? "online" : "offline";

            if (currentTerminal.status !== newStatus) {
              console.log(
                `[WebSocket] 🔄 Updating terminal ${currentTerminal.code} from ${currentTerminal.status} to ${newStatus}`,
              );
              updated[index] = {
                ...currentTerminal,
                ...update,
                status: newStatus,
                lastUpdated: nowMs(),
              };
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          const newRecentUpdates = {};
          pendingUpdatesRef.current.forEach((update, terminalId) => {
            newRecentUpdates[terminalId] = nowMs();
          });
          setRecentUpdates(newRecentUpdates);

          setTimeout(() => {
            setRecentUpdates({});
          }, 1000);
        }

        return hasChanges ? updated : prev;
      });

      pendingUpdatesRef.current.clear();
    }, []);

    // Connect to WebSocket for real-time updates
    const connectWebSocket = useCallback(() => {
      if (!isOpen) return;

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      clearTimeout(reconnectTimeoutRef.current);
      clearTimeout(updateTimeoutRef.current);
      pendingUpdatesRef.current.clear();

      console.log("[WebSocket] Connecting to:", WS_URL);
      setWsStatus("connecting");

      try {
        const ws = new WebSocket(`${WS_URL}?admin=true`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("[WebSocket] ✅ Connected to server as admin");
          setWsStatus("connected");

          ws.send(
            JSON.stringify({
              type: "SUBSCRIBE_TERMINALS",
              timestamp: new Date().toISOString(),
            }),
          );
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            setLastWsMessage({
              type: message.type,
              timestamp: nowMs(),
              data: message.data || message,
            });

            console.log("[WebSocket] 📨 Received:", message.type);

            if (message.type === "TERMINAL_STATUS_UPDATE") {
              const { terminalId, isOnline, lastSeenAt } = message.data || {};

              if (terminalId) {
                pendingUpdatesRef.current.set(terminalId, {
                  isOnline,
                  lastSeenAt: lastSeenAt || new Date().toISOString(),
                });

                clearTimeout(updateTimeoutRef.current);
                updateTimeoutRef.current = setTimeout(() => {
                  applyPendingUpdates();
                }, WS_DEBOUNCE_MS);
              }
            }

            if (message.type === "TERMINAL_HEARTBEAT") {
              const { terminalId, deviceKey, lastSeenAt } = message.data || {};

              if (terminalId || deviceKey) {
                let targetTerminalId = terminalId;
                if (!targetTerminalId && deviceKey) {
                  const terminal = liveTerminals.find(
                    (t) => t.deviceKey === deviceKey,
                  );
                  if (terminal) {
                    targetTerminalId = terminal._id;
                  }
                }

                if (targetTerminalId) {
                  pendingUpdatesRef.current.set(targetTerminalId, {
                    isOnline: true,
                    lastSeenAt: lastSeenAt || new Date().toISOString(),
                  });

                  clearTimeout(updateTimeoutRef.current);
                  updateTimeoutRef.current = setTimeout(() => {
                    applyPendingUpdates();
                  }, WS_DEBOUNCE_MS);
                }
              }
            }

            if (message.type === "DEVICE_WS") {
              const { deviceKey, action } = message;
              const wasConnected = action === "connected";

              console.log(
                `[WebSocket] 🔌 Device ${deviceKey} ${wasConnected ? "connected" : "disconnected"}`,
              );

              const terminal = liveTerminals.find(
                (t) => t.deviceKey === deviceKey,
              );
              if (terminal) {
                pendingUpdatesRef.current.set(terminal._id, {
                  isOnline: wasConnected,
                  lastSeenAt: new Date().toISOString(),
                });

                clearTimeout(updateTimeoutRef.current);
                updateTimeoutRef.current = setTimeout(() => {
                  applyPendingUpdates();
                }, WS_DEBOUNCE_MS);
              }
            }

            if (message.type === "TERMINAL_GAME_DISABLED_UPDATE") {
              const { terminalId, isGameDisabled, updatedAt } =
                message.data || {};

              if (terminalId) {
                setLiveTerminals((prev) => {
                  const updated = [...prev];
                  const index = updated.findIndex(
                    (t) =>
                      t._id === terminalId || t._id?.toString() === terminalId,
                  );

                  if (index !== -1) {
                    console.log(
                      `[WebSocket] 🎮 Updating terminal ${updated[index].code} isGameDisabled=${isGameDisabled}`,
                    );
                    updated[index] = {
                      ...updated[index],
                      isGameDisabled: isGameDisabled,
                      lastUpdated: nowMs(),
                    };

                    setRecentUpdates((prev) => ({
                      ...prev,
                      [terminalId]: nowMs(),
                    }));
                    setTimeout(() => {
                      setRecentUpdates((prev) => {
                        const newUpdates = { ...prev };
                        delete newUpdates[terminalId];
                        return newUpdates;
                      });
                    }, 1000);
                  }

                  return updated;
                });
              }
            }

            if (message.type === "TERMINAL_GAME_LAUNCHED_UPDATE") {
              const { terminalId, isLaunchedGame, updatedAt } =
                message.data || {};

              if (terminalId) {
                setLiveTerminals((prev) => {
                  const updated = [...prev];
                  const index = updated.findIndex(
                    (t) =>
                      t._id === terminalId || t._id?.toString() === terminalId,
                  );

                  if (index !== -1) {
                    console.log(
                      `[WebSocket] 🎮 Game launched update for terminal ${updated[index].code}: ${isLaunchedGame}`,
                    );
                    updated[index] = {
                      ...updated[index],
                      isLaunchedGame: isLaunchedGame,
                      lastUpdated: nowMs(),
                    };

                    setRecentUpdates((prev) => ({
                      ...prev,
                      [terminalId]: nowMs(),
                    }));
                    setTimeout(() => {
                      setRecentUpdates((prev) => {
                        const newUpdates = { ...prev };
                        delete newUpdates[terminalId];
                        return newUpdates;
                      });
                    }, 1000);
                  }

                  return updated;
                });
              }
            }
          } catch (error) {
            console.error("[WebSocket] ❌ Error parsing message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("[WebSocket] ❌ Error:", error);
          setWsStatus("error");
        };

        ws.onclose = (event) => {
          console.log(
            `[WebSocket] 🔌 Disconnected, code: ${event.code}, reason: ${event.reason}`,
          );
          setWsStatus("disconnected");

          clearTimeout(updateTimeoutRef.current);
          pendingUpdatesRef.current.clear();

          if (isOpen) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log("[WebSocket] 🔄 Attempting to reconnect...");
              connectWebSocket();
            }, WS_RECONNECT_DELAY);
          }
        };
      } catch (error) {
        console.error("[WebSocket] ❌ Failed to create WebSocket:", error);
        setWsStatus("error");
      }
    }, [isOpen, applyPendingUpdates, liveTerminals]);

    // WebSocket connection management
    useEffect(() => {
      if (!isOpen) {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        clearTimeout(reconnectTimeoutRef.current);
        clearTimeout(updateTimeoutRef.current);
        pendingUpdatesRef.current.clear();
        return;
      }

      connectWebSocket();

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        clearTimeout(reconnectTimeoutRef.current);
        clearTimeout(updateTimeoutRef.current);
        pendingUpdatesRef.current.clear();
      };
    }, [isOpen, connectWebSocket]);

    // initial fetch when modal opens
    useEffect(() => {
      if (!isOpen) return;

      console.log("[ModalDevices] Opening modal, fetching data...");
      const loadData = async () => {
        try {
          await Promise.all([fetchOutlets(), fetchTerminals()]);
          console.log("[ModalDevices] Data loaded successfully");
        } catch (error) {
          console.error("[ModalDevices] Error loading data:", error);
        }
      };

      loadData();

      dataRefreshIntervalRef.current = setInterval(() => {
        if (isOpen) {
          console.log("[ModalDevices] Periodic data refresh");
          fetchTerminals().catch(console.error);
        }
      }, DATA_REFRESH_INTERVAL);

      return () => {
        if (dataRefreshIntervalRef.current) {
          clearInterval(dataRefreshIntervalRef.current);
        }
      };
    }, [isOpen, fetchOutlets, fetchTerminals]);

    // whenever store terminals updates, sync into local liveTerminals with calculated status
    useEffect(() => {
      if (!isOpen) return;

      console.log(
        `[ModalDevices] Processing ${terminals?.length || 0} terminals`,
      );
      const updatedTerminals = (terminals || []).map((t) => ({
        ...t,
        status: calculateStatus(t),
        lastUpdated: nowMs(),
        isLaunchedGame: t.isLaunchedGame || false,
      }));

      setLiveTerminals(updatedTerminals);
    }, [terminals, isOpen]);

    // Start status refresh interval (fallback if WebSocket fails)
    useEffect(() => {
      if (!isOpen) {
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current);
          statusIntervalRef.current = null;
        }
        return;
      }

      console.log("[ModalDevices] Starting status refresh interval (fallback)");

      statusIntervalRef.current = setInterval(() => {
        if (wsStatus !== "connected") {
          setLiveTerminals((prev) => {
            const updated = prev.map((terminal) => {
              const newStatus = calculateStatus(terminal);
              if (newStatus === terminal.status) return terminal;

              console.log(
                `[ModalDevices] Fallback status change: ${terminal.code} from ${terminal.status} to ${newStatus}`,
              );
              return {
                ...terminal,
                status: newStatus,
                lastUpdated: nowMs(),
              };
            });

            return updated;
          });
        }
      }, STATUS_REFRESH_INTERVAL);

      return () => {
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current);
          statusIntervalRef.current = null;
        }
      };
    }, [isOpen, wsStatus]);

    // Manual refresh function
    const handleRefresh = async () => {
      if (isRefreshing) return;

      setIsRefreshing(true);
      console.log("[ModalDevices] Manual refresh triggered");

      try {
        await Promise.all([fetchOutlets(), fetchTerminals()]);
        console.log("[ModalDevices] Manual refresh completed");
      } catch (error) {
        console.error("[ModalDevices] Manual refresh failed:", error);
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    };

    // reset UI state when closed
    useEffect(() => {
      if (isOpen) return;

      console.log("[ModalDevices] Cleaning up on close");

      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }

      if (dataRefreshIntervalRef.current) {
        clearInterval(dataRefreshIntervalRef.current);
        dataRefreshIntervalRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      clearTimeout(reconnectTimeoutRef.current);
      clearTimeout(updateTimeoutRef.current);
      pendingUpdatesRef.current.clear();

      setShowAddOutlet(false);
      setShowAddTerminal(false);
      setSaving(false);
      setOutletForm({
        code: "",
        name: "",
        location: "",
        siteValue: "",
        active: true,
      });
      setTerminalForm({
        code: "",
        description: "",
        active: true,
        isGameDisabled: false,
      });
      setAddError("");
      setCopiedId(null);
      setReveal({});
      setSearch("");
      setFilter("all");
      setLiveTerminals([]);
      setSelectedOutlet(null);
      setSelectedOutletDetails(null);
      setWsStatus("disconnected");
      setLastWsMessage(null);
      setRecentUpdates({});
      setDeletingTerminalId(null);
    }, [isOpen]);

    /* -------- grouping terminals by outlet -------- */
    const { outletGroups, outletStats } = useMemo(() => {
      const outletsMap = {};

      outlets.forEach((outlet) => {
        outletsMap[outlet._id] = {
          id: outlet._id,
          name: `${outlet.code} - ${outlet.name}`,
          outletData: outlet,
          terminals: [],
          online: 0,
          offline: 0,
          total: 0,
          lastUpdated: nowMs(),
        };
      });

      liveTerminals.forEach((terminal) => {
        const outletId = terminal.outletId;

        if (!outletsMap[outletId]) {
          const outlet = outlets.find((o) => o._id === outletId);
          outletsMap[outletId] = {
            id: outletId,
            name: outlet ? `${outlet.code} - ${outlet.name}` : "Unknown Outlet",
            outletData: outlet,
            terminals: [],
            online: 0,
            offline: 0,
            total: 0,
            lastUpdated: nowMs(),
          };
        }

        outletsMap[outletId].terminals.push(terminal);
        outletsMap[outletId].total++;
        if (isOnline(terminal.status)) {
          outletsMap[outletId].online++;
        } else {
          outletsMap[outletId].offline++;
        }

        outletsMap[outletId].lastUpdated = Math.max(
          outletsMap[outletId].lastUpdated,
          terminal.lastUpdated || 0,
        );
      });

      const outletsArray = Object.values(outletsMap).sort((a, b) => {
        const aCode = a.outletData?.code || "";
        const bCode = b.outletData?.code || "";
        return aCode.localeCompare(bCode);
      });

      const total = outletsArray.length;
      const online = outletsArray.filter((o) => o.online > 0).length;
      const offline = outletsArray.filter(
        (o) => o.offline === o.terminals.length,
      ).length;

      return {
        outletGroups: outletsArray,
        outletStats: { total, online, offline },
      };
    }, [liveTerminals, outlets]);

    /* -------- filtered terminals for outlet details view -------- */
    const filteredTerminals = useMemo(() => {
      if (!selectedOutlet) return [];

      const outletTerminals = liveTerminals.filter(
        (terminal) => terminal.outletId === selectedOutlet,
      );

      const q = search.trim().toLowerCase();
      if (q) {
        return outletTerminals.filter((t) =>
          [t.code, t.deviceKey, t.description, t.status]
            .join(" ")
            .toLowerCase()
            .includes(q),
        );
      }

      if (filter !== "all") {
        return outletTerminals.filter((t) =>
          filter === "online" ? isOnline(t.status) : !isOnline(t.status),
        );
      }

      return [...outletTerminals].sort((a, b) =>
        String(a.code || "").localeCompare(String(b.code || "")),
      );
    }, [liveTerminals, selectedOutlet, search, filter]);

    /* -------- filtered outlets for main view -------- */
    const filteredOutlets = useMemo(() => {
      let outletsToShow = outletGroups;

      const q = search.trim().toLowerCase();
      if (q) {
        outletsToShow = outletsToShow.filter((outlet) =>
          [
            outlet.outletData?.code || "",
            outlet.outletData?.name || "",
            outlet.outletData?.location || "",
            outlet.outletData?.siteValue || "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(q),
        );
      }

      if (filter !== "all") {
        if (filter === "online") {
          outletsToShow = outletsToShow.filter((outlet) => outlet.online > 0);
        } else if (filter === "offline") {
          outletsToShow = outletsToShow.filter(
            (outlet) => outlet.offline === outlet.total,
          );
        }
      }

      return outletsToShow;
    }, [outletGroups, search, filter]);

    /* -------- stats -------- */
    const stats = useMemo(() => {
      const total = liveTerminals.length;
      const online = liveTerminals.filter((t) => isOnline(t.status)).length;
      const offline = total - online;

      return {
        total,
        online,
        offline,
        lastUpdated:
          liveTerminals.length > 0
            ? Math.max(...liveTerminals.map((t) => t.lastUpdated || 0))
            : nowMs(),
      };
    }, [liveTerminals]);

    /* -------- actions -------- */
    const handleAddOutlet = async (e) => {
      e.preventDefault();
      setAddError("");

      const { code, name, location, siteValue, active } = outletForm;

      if (!code) return setAddError("Outlet Code is required.");
      if (!name) return setAddError("Outlet Name is required.");
      if (!siteValue) return setAddError("Site Value is required.");

      const outletExists = outlets.some(
        (o) => o.code.toLowerCase() === code.toLowerCase(),
      );
      if (outletExists) return setAddError("Outlet code already exists.");

      setSaving(true);
      try {
        await createOutlet({
          code: code.trim(),
          name: name.trim(),
          location: location.trim(),
          siteValue: siteValue.trim(),
          active,
        });

        setOutletForm({
          code: "",
          name: "",
          location: "",
          siteValue: "",
          active: true,
        });
        setShowAddOutlet(false);
      } catch (err) {
        setAddError(err.message || "Failed to create outlet");
      } finally {
        setSaving(false);
      }
    };

    const handleAddTerminal = async (e) => {
      e.preventDefault();
      setAddError("");

      const { code, description, active, isGameDisabled } = terminalForm;

      if (!code) return setAddError("Terminal Code is required.");
      if (!selectedOutlet) return setAddError("Please select an outlet first.");

      const terminalExists = terminals.some(
        (t) => t.code.toLowerCase() === code.toLowerCase(),
      );
      if (terminalExists) return setAddError("Terminal code already exists.");

      setSaving(true);
      try {
        await createTerminal(selectedOutlet, {
          code: code.trim(),
          description: description.trim(),
          active,
          isGameDisabled,
        });

        setTerminalForm({
          code: "",
          description: "",
          active: true,
          isGameDisabled: false,
        });
        setShowAddTerminal(false);
        setAddError("");
      } catch (err) {
        setAddError(err.message || "Failed to create terminal");
      } finally {
        setSaving(false);
      }
    };

    const handleCopy = async (textToCopy) => {
      if (!textToCopy) return;
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(textToCopy);
      setTimeout(() => setCopiedId(null), 2000);
    };

    const selectOutlet = (outletId) => {
      const outlet = outlets.find((o) => o._id === outletId);
      if (!outlet) return;

      const outletGroup = outletGroups.find((og) => og.id === outletId);
      setSelectedOutlet(outletId);
      setSelectedOutletDetails(
        outletGroup || {
          id: outletId,
          name: `${outlet.code} - ${outlet.name}`,
          outletData: outlet,
          total: 0,
          online: 0,
          offline: 0,
          terminals: [],
        },
      );
    };

    const clearOutletSelection = () => {
      setSelectedOutlet(null);
      setSelectedOutletDetails(null);
    };

    const getOutletName = (outletId) => {
      const outlet = outlets.find((o) => o._id === outletId);
      return outlet ? `${outlet.name}` : "Unknown Outlet";
    };

    // Check if terminal was recently updated
    const isRecentlyUpdated = (terminalId) => {
      return (
        recentUpdates[terminalId] && nowMs() - recentUpdates[terminalId] < 1000
      );
    };

    const loading = outletsLoading || terminalsLoading;

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-lg"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* modal */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="
                relative w-full max-w-[1400px] max-h-[85vh]
                bg-white/85 backdrop-blur-xl
                border border-white/50
                rounded-3xl shadow-2xl overflow-hidden
              "
              onClick={(e) => e.stopPropagation()}
            >
              {/* header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/60">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedOutlet ? getOutletName(selectedOutlet) : "Outlets"}
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500">
                    {selectedOutlet
                      ? `${selectedOutletDetails?.total || 0} terminals · ${selectedOutletDetails?.online || 0} online · ${selectedOutletDetails?.offline || 0} offline`
                      : `${outlets.length} outlets · ${outletStats.online} online · ${outletStats.offline} offline`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isRefreshing
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    <MdRefresh className={isRefreshing ? "animate-spin" : ""} />
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </button>

                  {selectedOutlet ? (
                    <>
                      <button
                        onClick={clearOutletSelection}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 transition-all"
                      >
                        <IoChevronForward className="rotate-180" />
                        Back to Outlets
                      </button>
                      <button
                        onClick={() => setShowAddTerminal((v) => !v)}
                        className={`
                          flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                          ${
                            showAddTerminal
                              ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                              : "bg-black text-white hover:bg-gray-800"
                          }
                        `}
                      >
                        <MdAdd /> {showAddTerminal ? "Close" : "Add Terminal"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowAddOutlet((v) => !v)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                        ${
                          showAddOutlet
                            ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                            : "text-white hover:bg-gray-800"
                        }
                      `}
                      style={!showAddOutlet ? { background: "#d81318" } : {}}
                    >
                      <IoStorefrontOutline size={18} />{" "}
                      {showAddOutlet ? "Close" : "Add Outlet"}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-200/60 transition-all"
                    aria-label="Close"
                  >
                    <IoClose size={18} className="text-gray-700" />
                  </button>
                </div>
              </div>

              {/* body */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                {/* Add Outlet Panel */}
                <AnimatePresence>
                  {!selectedOutlet && showAddOutlet && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 rounded-2xl border border-gray-200 from-indigo-50/50 to-white p-4 shadow-sm"
                    >
                      <form
                        onSubmit={handleAddOutlet}
                        className="grid grid-cols-1 md:grid-cols-3 gap-3"
                      >
                        <div>
                          <label className="text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                            <MdBusiness size={12} /> Outlet Code *
                          </label>
                          <input
                            value={outletForm.code}
                            onChange={(e) =>
                              setOutletForm((p) => ({
                                ...p,
                                code: e.target.value,
                              }))
                            }
                            placeholder="OUT001"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-600 mb-1">
                            Outlet Name *
                          </label>
                          <input
                            value={outletForm.name}
                            onChange={(e) =>
                              setOutletForm((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Main Outlet"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-600 mb-1">
                            Site Value *
                          </label>
                          <input
                            value={outletForm.siteValue}
                            onChange={(e) =>
                              setOutletForm((p) => ({
                                ...p,
                                siteValue: e.target.value,
                              }))
                            }
                            placeholder="SG8ECC3"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
                            <MdLocationOn size={12} /> Location
                          </label>
                          <input
                            value={outletForm.location}
                            onChange={(e) =>
                              setOutletForm((p) => ({
                                ...p,
                                location: e.target.value,
                              }))
                            }
                            placeholder="City, State"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318]"
                          />
                        </div>
                        <div className="md:col-span-3 flex items-center justify-between mt-1">
                          <div className="min-h-[18px]">
                            {addError ? (
                              <p className="text-xs text-red-600">{addError}</p>
                            ) : (
                              <p className="text-[11px] text-gray-500">
                                New outlet will be created. You can add terminals
                                to it later.
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddOutlet(false)}
                              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={saving}
                              className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all ${
                                saving
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "hover:opacity-90"
                              }`}
                              style={!saving ? { background: "#d81318" } : {}}
                            >
                              {saving ? "Adding…" : "Add Outlet"}
                            </button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Add Terminal Panel */}
                <AnimatePresence>
                  {selectedOutlet && showAddTerminal && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-6 rounded-2xl border border-gray-200 from-blue-50/50 to-white p-4 shadow-sm"
                    >
                      <form
                        onSubmit={handleAddTerminal}
                        className="grid grid-cols-1 md:grid-cols-2 gap-3"
                      >
                        <div>
                          <label className="text-[11px] font-semibold text-gray-600 mb-1">
                            Terminal Code *
                          </label>
                          <input
                            value={terminalForm.code}
                            onChange={(e) =>
                              setTerminalForm((p) => ({
                                ...p,
                                code: e.target.value,
                              }))
                            }
                            placeholder="T001"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-gray-600 mb-1">
                            Description
                          </label>
                          <input
                            value={terminalForm.description}
                            onChange={(e) =>
                              setTerminalForm((p) => ({
                                ...p,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Terminal description"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318]"
                          />
                        </div>

                        {/* Game Disabled Toggle */}
                        <div className="md:col-span-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={terminalForm.isGameDisabled}
                              onChange={(e) =>
                                setTerminalForm((p) => ({
                                  ...p,
                                  isGameDisabled: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 rounded border-gray-300 text-[#d81318] focus:ring-[#d81318]/20"
                            />
                            <span className="text-sm text-gray-700">
                              Disable games on this terminal
                            </span>
                            <span className="text-xs text-gray-500">
                              (Games will be blocked on this terminal)
                            </span>
                          </label>
                        </div>

                        <div className="md:col-span-2 flex items-center justify-between mt-1">
                          <div className="min-h-[18px]">
                            {addError ? (
                              <p className="text-xs text-red-600">{addError}</p>
                            ) : (
                              <p className="text-[11px] text-gray-500">
                                Terminal will be added to{" "}
                                <b>{getOutletName(selectedOutlet)}</b>. A unique
                                device key will be auto-generated and can be
                                copied after creation.
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddTerminal(false)}
                              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={saving}
                              className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all ${
                                saving
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "hover:opacity-90"
                              }`}
                              style={!saving ? { background: "#d81318" } : {}}
                            >
                              {saving ? "Adding…" : "Add Terminal"}
                            </button>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* toolbar */}
                <div className="mb-6 flex justify-end">
                  <div className="w-full rounded-2xl border border-gray-200 bg-white/90 backdrop-blur px-4 py-3 shadow-sm">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                      <div className="min-w-[260px]">
                        <label className="text-[11px] font-semibold text-gray-600 mb-1">
                          Search {selectedOutlet ? "terminals" : "outlets"}
                        </label>
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder={
                            selectedOutlet
                              ? "Terminal Code, Device Key"
                              : "Outlet Code, Name, Location, Site Value"
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 mb-1">
                          Status
                        </label>
                        <div className="flex gap-2">
                          {["all", "online", "offline"].map((f) => (
                            <button
                              key={f}
                              onClick={() => setFilter(f)}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                                filter === f
                                  ? "text-white"
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              }`}
                              style={
                                filter === f ? { background: "#d81318" } : {}
                              }
                            >
                              {f.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Overview */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MdWifi className="text-green-600" />
                          <p className="text-sm font-semibold text-gray-700">
                            Online Terminals
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-green-800">
                          {stats.online}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MdWifiOff className="text-gray-500" />
                          <p className="text-sm font-semibold text-gray-700">
                            Offline Terminals
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">
                          {stats.offline}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Inactive</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MdComputer className="text-blue-600" />
                          <p className="text-sm font-semibold text-gray-700">
                            Total Terminals
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-blue-800">
                          {stats.total}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">All Devices</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MAIN CONTENT */}
                {loading ? (
                  <div className="text-center py-10">
                    <div
                      className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-4"
                      style={{ borderColor: "#d81318" }}
                    ></div>
                    <p className="text-gray-500">Loading terminals data...</p>
                  </div>
                ) : selectedOutlet ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {filteredTerminals.length === 0 ? (
                      <p className="col-span-full text-center text-gray-500 py-10">
                        No terminals found in {getOutletName(selectedOutlet)}.
                        Install and pair an SG8 Launcher to create one.
                      </p>
                    ) : (
                      filteredTerminals.map((t) => {
                        const online = isOnline(t.status);
                        const show = !!reveal[t._id];
                        const copied = copiedId === t._id;
                        const recentlyUpdated = isRecentlyUpdated(t._id);
                        const isGameDisabled = t.isGameDisabled || false;
                        const isLaunchedGame = t.isLaunchedGame || false;
                        const isDeletingTerminal = deletingTerminalId === t._id;

                        return (
                          <motion.div
                            key={t._id}
                            className={`relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-300 ${
                              recentlyUpdated ? "ring-2 ring-[#d81318]/30" : ""
                            }`}
                            whileHover={{
                              scale: 1.03,
                              y: -8,
                              transition: { duration: 0.2 },
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            {/* status chip */}
                            <div className="absolute top-4 right-4 z-10">
                              <div
                                className={`flex items-center gap-2 text-sm text-gray-500 backdrop-blur-sm px-3 py-1.5 rounded-full border ${online ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                              >
                                <span
                                  className={`w-2.5 h-2.5 rounded-full ${online ? "bg-green-500" : "bg-gray-400"}`}
                                />
                                <span className="font-medium">
                                  {online ? "Online" : "Offline"}
                                </span>
                              </div>
                            </div>

                            {/* Real-time indicator */}
                            {recentlyUpdated && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute top-4 left-4 z-10"
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ background: "#d81318" }}
                                />
                              </motion.div>
                            )}

                            {/* pc image */}
                            <div className="aspect-square p-6 flex items-center justify-center from-gray-50 to-white">
                              <img
                                src={pcImageSrc(online)}
                                alt={online ? "Online PC" : "Offline PC"}
                                className="w-3/4 h-auto max-h-48 select-none transition-all duration-500"
                                draggable={false}
                              />
                            </div>

                            {/* terminal info */}
                            <div className="p-6 border-t border-gray-100">
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xl font-extrabold tracking-wide uppercase truncate">
                                    {t.code || "Terminal"}
                                  </p>
                                  <div className="flex gap-2">
                                    {/* Lock/Unlock Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLockTerminal(t._id, t.isLocked);
                                      }}
                                      className={`p-2 rounded-xl transition-all duration-200 ${
                                        t.isLocked
                                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                      }`}
                                      title={
                                        t.isLocked
                                          ? "Unlock Terminal"
                                          : "Lock Terminal"
                                      }
                                      type="button"
                                    >
                                      {t.isLocked ? (
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
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                          />
                                        </svg>
                                      ) : (
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
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                          />
                                        </svg>
                                      )}
                                    </button>

                                    {/* Game Disable/Enable Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleGameDisabled(
                                          t._id,
                                          isGameDisabled,
                                        );
                                      }}
                                      className={`p-2 rounded-xl transition-all duration-200 ${
                                        isGameDisabled
                                          ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
                                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                      }`}
                                      title={
                                        isGameDisabled
                                          ? "Enable Games"
                                          : "Disable Games"
                                      }
                                      type="button"
                                    >
                                      {isGameDisabled ? (
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
                                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                        </svg>
                                      ) : (
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
                                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                </div>
                                <p className="text-sm font-semibold text-gray-400 mt-1 truncate">
                                  {t.description || "No description"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Outlet: {getOutletName(t.outletId)}
                                </p>

                                {/* Lock Status Badge */}
                                {t.isLocked && (
                                  <div className="mt-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                        />
                                      </svg>
                                      Locked
                                    </span>
                                  </div>
                                )}

                                {/* Game Launched Status Badge */}
                                {isLaunchedGame && (
                                  <div className="mt-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      Game Launched
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Terminal ID Box */}
                              <div className="bg-gray-50 border rounded-xl px-3 py-3 flex items-center gap-2 transition-colors duration-300">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] font-semibold text-gray-400 leading-none">
                                    Terminal ID
                                  </p>
                                  <p className="mt-1 text-[11px] font-mono text-gray-700 truncate leading-tight">
                                    {show ? t._id || "—" : "••••••••••••••••••"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReveal((p) => ({
                                        ...p,
                                        [t._id]: !p[t._id],
                                      }));
                                    }}
                                    className="w-8 h-8 rounded-lg border bg-white hover:bg-gray-100 grid place-items-center transition-all"
                                    title={show ? "Hide" : "Show"}
                                  >
                                    {show ? (
                                      <MdVisibilityOff size={16} />
                                    ) : (
                                      <MdVisibility size={16} />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(t._id);
                                    }}
                                    className="h-8 px-2.5 rounded-lg border bg-white hover:bg-gray-100 flex items-center gap-1.5 text-[11px] font-semibold transition-all"
                                    title="Copy Terminal ID"
                                  >
                                    {copied ? (
                                      <>
                                        <MdCheckCircle
                                          className="text-green-600"
                                          size={16}
                                        />
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <MdContentCopy size={16} />
                                        Copy
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Launch/Close Game Button */}
                              <div className="mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGameLaunch(t._id, isLaunchedGame);
                                  }}
                                  disabled={isGameDisabled}
                                  className={`w-full py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                                    isLaunchedGame
                                      ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                                      : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                  } ${isGameDisabled ? "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200" : ""}`}
                                  title={
                                    isGameDisabled
                                      ? "Games are disabled on this terminal"
                                      : isLaunchedGame
                                        ? "Close Game"
                                        : "Launch Game"
                                  }
                                  type="button"
                                >
                                  {isLaunchedGame ? (
                                    <>
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
                                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                                        />
                                      </svg>
                                      <span className="text-sm font-medium">
                                        Close Game
                                      </span>
                                    </>
                                  ) : (
                                    <>
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
                                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      <span className="text-sm font-medium">
                                        Launch Game
                                      </span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Remove Terminal Button */}
                              <div className="mt-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTerminal(t);
                                  }}
                                  disabled={isDeletingTerminal}
                                  className={`w-full py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border ${
                                    isDeletingTerminal
                                      ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                                      : "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                  }`}
                                  title="Remove terminal and allow launcher to regenerate a new ID"
                                  type="button"
                                >
                                  <MdDelete size={16} />
                                  <span className="text-sm font-medium">
                                    {isDeletingTerminal
                                      ? "Removing..."
                                      : "Remove Terminal"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {filteredOutlets.length === 0 ? (
                      <p className="col-span-full text-center text-gray-500 py-10">
                        No outlets found. Click "Add Outlet" to create one.
                      </p>
                    ) : (
                      filteredOutlets.map((outletGroup) => {
                        const allOffline =
                          outletGroup.total === 0 ||
                          outletGroup.offline === outletGroup.total;
                        const outlet = outletGroup.outletData;

                        return (
                          <motion.div
                            key={outletGroup.id}
                            className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden cursor-pointer group"
                            whileHover={{
                              scale: 1.05,
                              y: -8,
                              transition: { duration: 0.2 },
                            }}
                            onClick={() => selectOutlet(outletGroup.id)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="absolute top-4 right-4 z-10">
                              <div
                                className={`w-3 h-3 rounded-full ${allOffline ? "bg-gray-400" : "bg-green-500"}`}
                              />
                            </div>

                            <div className="aspect-square p-6 flex flex-col items-center justify-center from-gray-50 to-white">
                              <div className="mb-4">
                                <div
                                  className={`w-16 h-16 rounded-full flex items-center justify-center border ${allOffline ? "border-gray-200 bg-gray-50" : "border-[#d81318]/30 bg-[#d81318]/10"}`}
                                >
                                  <MdComputer
                                    size={32}
                                    className={
                                      allOffline
                                        ? "text-gray-400"
                                        : "text-[#d81318]"
                                    }
                                  />
                                </div>
                              </div>

                              <h3 className="text-center font-bold text-gray-900 text-lg mb-2 line-clamp-2">
                                {outlet?.code || "Unknown"}
                              </h3>

                              <p className="text-xs text-gray-500 text-center mb-1">
                                {outlet?.name || ""}
                              </p>
                              {outlet?.location && (
                                <p className="text-xs text-gray-400 text-center mb-3">
                                  {outlet.location}
                                </p>
                              )}

                              {outlet?.siteValue && (
                                <p
                                  className="text-xs font-medium text-center mb-3 px-3 py-1 rounded-full"
                                  style={{
                                    color: "#d81318",
                                    background: "#d81318/10",
                                  }}
                                >
                                  Site: {outlet.siteValue}
                                </p>
                              )}

                              <p className="text-sm text-gray-500 text-center mb-3">
                                {outletGroup.total} terminal
                                {outletGroup.total !== 1 ? "s" : ""}
                              </p>

                              <div className="flex flex-col gap-2 w-full max-w-[200px]">
                                <div
                                  className={`flex items-center justify-between px-3 py-2 rounded-xl border ${outletGroup.online > 0 ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-2 h-2 rounded-full ${outletGroup.online > 0 ? "bg-green-500" : "bg-gray-400"}`}
                                    />
                                    <span className="text-xs font-medium text-green-700">
                                      Online
                                    </span>
                                  </div>
                                  <span className="text-sm font-bold text-green-800">
                                    {outletGroup.online}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                                    <span className="text-xs font-medium text-gray-700">
                                      Offline
                                    </span>
                                  </div>
                                  <span className="text-sm font-bold text-gray-800">
                                    {outletGroup.offline}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
                              <span className="text-xs text-gray-500 font-medium">
                                Click to view {outletGroup.total} terminal
                                {outletGroup.total !== 1 ? "s" : ""}
                              </span>
                              <IoChevronForward
                                className="text-gray-400 group-hover:text-[#d81318] group-hover:translate-x-1 transition-all"
                                size={18}
                              />
                            </div>

                            <div className="absolute inset-0 from-[#d81318]/0 to-[#d81318]/0 group-hover:from-[#d81318]/5 group-hover:to-[#d81318]/5 transition-all duration-300 pointer-events-none rounded-2xl" />
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  export default ModalDevices;
