import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBullhorn,
  FaImage,
  FaBell,
  FaCog,
  FaDatabase,
  FaArrowRight,
  FaUsers,
  FaChartLine,
  FaClock,
  FaCalendarAlt,
  FaChevronRight,
} from "react-icons/fa";
import {
  MdAnnouncement,
  MdNotificationsActive,
  MdDevices,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import CountUp from "react-countup";

import useBannerStore from "../stores/bannerStore";
import useAnnouncementStore from "../stores/announcementStore";
import useNotificationStore from "../stores/notificationStore";
import useProviderStore from "../stores/providerStore";

const Dashboard = () => {
  const navigate = useNavigate();
  const API_URL =
    window.location.hostname === "localhost"
      ? process.env.REACT_APP_BACKEND_API_TEST
      : process.env.REACT_APP_BACKEND_API;

  const { announcements, fetchAnnouncements } = useAnnouncementStore();
  const { notifications, fetchNotifications } = useNotificationStore();
  const { banners, fetchBanners } = useBannerStore();
  const { providers, getSlotsProviderList } = useProviderStore();

  // Fetch initial data
  useEffect(() => {
    fetchAnnouncements(API_URL);
    fetchNotifications(API_URL);
    fetchBanners(API_URL);
    getSlotsProviderList(API_URL);
  }, [
    API_URL,
    fetchAnnouncements,
    fetchNotifications,
    fetchBanners,
    getSlotsProviderList,
  ]);

  // Device detection
  const [device, setDevice] = useState("desktop");
  useEffect(() => {
    const detect = () =>
      setDevice(window.innerWidth < 860 ? "mobile" : "desktop");
    detect();
    window.addEventListener("resize", detect);
    return () => window.removeEventListener("resize", detect);
  }, []);

  // Get current date for expiry check
  const today = new Date();

  // Get active banners (status active and not expired)
  const activeBanners = useMemo(() => {
    return banners.filter((b) => {
      // Check if banner is active
      if (b.status !== "active") return false;

      // Check if banner matches device
      if (b.device !== device) return false;

      // Check if banner is not expired
      if (b.expiry) {
        const expiryDate = new Date(b.expiry);
        if (expiryDate < today) return false;
      }

      return true;
    });
  }, [banners, device, today]);

  // Banner auto-rotation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHoveringBanner, setIsHoveringBanner] = useState(false);

  useEffect(() => {
    if (activeBanners.length > 0 && !isHoveringBanner) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeBanners.length, isHoveringBanner]);

  // Reset current index when banners change
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeBanners.length]);

  // Get status counts
  const getStatusCounts = useCallback((items, getStatusFn) => {
    let active = 0,
      expired = 0,
      hidden = 0;
    items.forEach((item) => {
      const status = getStatusFn(item);
      if (status === "active") active++;
      else if (status === "expired") expired++;
      else if (status === "hidden") hidden++;
    });
    return { active, expired, hidden };
  }, []);

  const bannerStatus = useMemo(() => {
    const getBannerStatus = (item) => {
      if (item.status === "hide") return "hidden";
      if (item.expiry && new Date(item.expiry) < today) return "expired";
      return "active";
    };
    return getStatusCounts(banners, getBannerStatus);
  }, [banners, getStatusCounts, today]);

  const announcementStatus = useMemo(() => {
    const getAnnouncementStatus = (item) => {
      if (item.status === "hide") return "hidden";
      if (item.expiry && new Date(item.expiry) < today) return "expired";
      return "active";
    };
    return getStatusCounts(announcements, getAnnouncementStatus);
  }, [announcements, getStatusCounts, today]);

  const notificationStatus = useMemo(() => {
    const getNotificationStatus = (item) => {
      if (item.status === "hide") return "hidden";
      if (item.expiry && new Date(item.expiry) < today) return "expired";
      return "active";
    };
    return getStatusCounts(notifications, getNotificationStatus);
  }, [notifications, getStatusCounts, today]);

  // Stats with enhanced data
  const stats = useMemo(
    () => [
      {
        id: 1,
        label: "Announcements",
        count: announcements.length,
        active: announcementStatus.active,
        expired: announcementStatus.expired,
        hidden: announcementStatus.hidden,
        icon: <FaBullhorn className="text-xl" />,
        href: "/announcements",
        gradient: "from-emerald-500 to-teal-600",
        bgGradient: "from-emerald-50 to-teal-50",
        iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
        iconColor: "text-white",
        borderColor: "border-emerald-200",
      },
      {
        id: 2,
        label: "Banners",
        count: banners.length,
        active: bannerStatus.active,
        expired: bannerStatus.expired,
        hidden: bannerStatus.hidden,
        icon: <FaImage className="text-xl" />,
        href: "/banners",
        gradient: "from-blue-500 to-indigo-600",
        bgGradient: "from-blue-50 to-indigo-50",
        iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
        iconColor: "text-white",
        borderColor: "border-blue-200",
      },
      {
        id: 3,
        label: "Notifications",
        count: notifications.length,
        active: notificationStatus.active,
        expired: notificationStatus.expired,
        hidden: notificationStatus.hidden,
        icon: <FaBell className="text-xl" />,
        href: "/notifications",
        gradient: "from-amber-500 to-orange-600",
        bgGradient: "from-amber-50 to-orange-50",
        iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
        iconColor: "text-white",
        borderColor: "border-amber-200",
      },
      {
        id: 4,
        label: "Providers",
        count: providers.length,
        active: providers.length,
        expired: 0,
        hidden: 0,
        icon: <FaDatabase className="text-xl" />,
        href: "/providers",
        gradient: "from-rose-500 to-pink-600",
        bgGradient: "from-rose-50 to-pink-50",
        iconBg: "bg-gradient-to-br from-rose-500 to-pink-600",
        iconColor: "text-white",
        borderColor: "border-rose-200",
      },
      {
        id: 5,
        label: "Customization",
        count: 0,
        active: 0,
        expired: 0,
        hidden: 0,
        icon: <FaCog className="text-xl" />,
        href: "/customization",
        gradient: "from-purple-500 to-fuchsia-600",
        bgGradient: "from-purple-50 to-fuchsia-50",
        iconBg: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
        iconColor: "text-white",
        borderColor: "border-purple-200",
      },
    ],
    [
      announcements.length,
      banners.length,
      notifications.length,
      providers.length,
      announcementStatus,
      bannerStatus,
      notificationStatus,
    ],
  );

  // Announcements marquee
  const activeAnnouncements = useMemo(
    () =>
      announcements.filter(
        (a) =>
          a.status === "active" && (!a.expiry || new Date(a.expiry) > today),
      ),
    [announcements, today],
  );

  // Recent activity (mock data - replace with actual API if available)
  const recentActivity = [
    {
      id: 1,
      type: "announcement",
      action: "New announcement created",
      time: "2 minutes ago",
      icon: <FaBullhorn />,
    },
    {
      id: 2,
      type: "banner",
      action: "Banner updated",
      time: "1 hour ago",
      icon: <FaImage />,
    },
    {
      id: 3,
      type: "notification",
      action: "Notification sent to users",
      time: "3 hours ago",
      icon: <FaBell />,
    },
  ];

  const StatCard = ({ item, index }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        className="relative group h-full"
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
        />

        <button
          onClick={() => navigate(item.href)}
          className={`
            relative w-full text-left rounded-2xl p-5 
            bg-white border ${item.borderColor}
            shadow-sm hover:shadow-xl transition-all duration-300
            overflow-hidden h-full min-h-[180px]
          `}
        >
          {/* Animated background gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${item.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          />

          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              {/* Icon with pulse animation */}
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
                >
                  <span className={item.iconColor}>{item.icon}</span>
                </div>
                {item.count > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-xs font-bold">
                      {item.count > 9 ? "9+" : item.count}
                    </span>
                  </div>
                )}
              </div>

              {/* Count */}
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  <CountUp end={item.count} duration={2} />
                </p>
                <p className="mt-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {item.label}
                </p>
              </div>
            </div>

            {/* Status breakdown */}
            {(item.active > 0 || item.expired > 0 || item.hidden > 0) && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                {item.active > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-gray-600">
                      {item.active} Active
                    </span>
                  </div>
                )}
                {item.expired > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs text-gray-600">
                      {item.expired} Expired
                    </span>
                  </div>
                )}
                {item.hidden > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-xs text-gray-600">
                      {item.hidden} Hidden
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* View link - pushed to bottom */}
            <div className="flex items-center justify-between mt-auto pt-3">
              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                Click to manage
              </span>
              <FaChevronRight className="text-xs text-gray-300 group-hover:text-gray-500 transition-all group-hover:translate-x-1" />
            </div>
          </div>
        </button>
      </motion.div>
    );
  };

  const bannerVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <MdDevices className="text-2xl" />
            <span className="text-sm font-medium opacity-90">
              Device: {device}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
          <p className="text-sm opacity-90 mb-4">
            Here's what's happening with your platform today
          </p>
          <div className="flex items-center gap-2 text-xs">
            <FaCalendarAlt />
            <span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid - Fixed height cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {stats.map((item, index) => (
          <StatCard key={item.id} item={item} index={index} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Banner Preview - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden h-full flex flex-col"
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <FaImage className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      Banner Preview
                    </h2>
                    <p className="text-xs text-gray-500">
                      Active {device} banners
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-gray-600">
                      {activeBanners.length} Active
                    </span>
                  </div>
                  <button
                    onClick={() => navigate("/banners")}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    Manage <FaArrowRight className="text-xs" />
                  </button>
                </div>
              </div>
            </div>

            <div
              className="relative w-full overflow-hidden p-6 bg-gray-50 flex-1 flex items-center justify-center min-h-[300px]"
              onMouseEnter={() => setIsHoveringBanner(true)}
              onMouseLeave={() => setIsHoveringBanner(false)}
            >
              {activeBanners.length > 0 ? (
                <div className="relative w-full">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeBanners[currentIndex]?._id || currentIndex}
                      src={activeBanners[currentIndex].url}
                      alt={activeBanners[currentIndex].alt || "Banner"}
                      variants={bannerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="w-full h-auto max-h-[300px] object-contain rounded-xl shadow-lg mx-auto"
                    />
                  </AnimatePresence>

                  {/* Banner Navigation Dots */}
                  {activeBanners.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {activeBanners.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentIndex(idx)}
                          className={`transition-all duration-300 ${
                            idx === currentIndex
                              ? "w-6 h-2 bg-blue-600 rounded-full"
                              : "w-2 h-2 bg-gray-400 rounded-full hover:bg-gray-500"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FaImage className="text-2xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">
                    No active <span className="font-semibold">{device}</span>{" "}
                    banners available
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Make sure banners have status "active" and match device type
                  </p>
                  <button
                    onClick={() => navigate("/banners")}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                  >
                    Upload a banner <FaArrowRight className="text-xs" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-md border border-gray-100 h-full flex flex-col"
        >
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                <FaChartLine className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Recent Activity</h2>
                <p className="text-xs text-gray-500">
                  Latest updates from your platform
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3 flex-1">
            {recentActivity.map((activity, idx) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/${activity.type}s`)}
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-600">{activity.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {activity.action}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <FaClock className="text-xs text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {activity.time}
                    </span>
                  </div>
                </div>
                <FaChevronRight className="text-xs text-gray-300" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <MdNotificationsActive className="text-amber-500 text-lg" />
            <span className="text-xs text-gray-500">Total Notifications</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {notifications.length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <MdAnnouncement className="text-emerald-500 text-lg" />
            <span className="text-xs text-gray-500">Active Announcements</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {activeAnnouncements.length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <FaImage className="text-blue-500 text-lg" />
            <span className="text-xs text-gray-500">Active Banners</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {activeBanners.length}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <FaUsers className="text-purple-500 text-lg" />
            <span className="text-xs text-gray-500">Total Providers</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{providers.length}</p>
        </div>
      </div>

      {/* Announcements Marquee */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                <FaBullhorn className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">
                  Live Announcements
                </h2>
                <p className="text-xs text-gray-500">
                  Currently active announcements
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/announcements")}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View all <FaArrowRight className="text-xs" />
            </button>
          </div>
        </div>

        <div className="relative py-4 px-6 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-emerald-50 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-emerald-50 to-transparent z-10" />

          <div className="overflow-hidden">
            {activeAnnouncements.length > 0 ? (
              <motion.div
                animate={{ x: [0, -1000] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="whitespace-nowrap"
              >
                <span className="text-sm font-medium text-gray-700 inline-flex items-center gap-4">
                  {activeAnnouncements.map((announcement, idx) => (
                    <React.Fragment key={announcement._id}>
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {announcement.desc}
                      </span>
                      {idx < activeAnnouncements.length - 1 && (
                        <span className="text-gray-400">•</span>
                      )}
                    </React.Fragment>
                  ))}
                </span>
              </motion.div>
            ) : (
              <div className="text-center py-2">
                <span className="text-sm text-gray-500">
                  📢 No active announcements available
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
