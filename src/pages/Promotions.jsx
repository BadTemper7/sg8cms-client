// pages/Promotions.jsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdDownload,
  MdVisibility,
  MdCategory,
  MdLabel,
  MdAccessTime,
  MdLocalOffer,
} from "react-icons/md";
import { FiFileText, FiCalendar } from "react-icons/fi";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

import ModalDocument from "../components/modals/ModalDocument";
import ModalViewPromotion from "../components/modals/ModalViewPromotion";
import CardDelete from "../components/cards/cardDelete";
import CardSuccess from "../components/cards/cardSuccess";
import usePromotionDocumentStore from "../stores/promotionDocumentStore";
import useAuthStore from "../stores/authStore";
import { GlobalContext } from "../context/GlobalContextProvider";

const Promotions = () => {
  const { apiUrl } = useContext(GlobalContext);
  const { token, isAuthenticated } = useAuthStore(); // Get token from auth store

  // Zustand store
  const {
    documents: promotions,
    loading,
    pagination,
    fetchAllDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    bulkDeleteDocuments,
    updateVisibility,
    initWebSocket,
    closeWebSocket,
    isWebSocketConnected,
    clearError,
  } = usePromotionDocumentStore();

  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState({
    title: "",
    description: "",
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPromotion, setViewingPromotion] = useState(null);
  // Load promotions from API
  const loadPromotions = useCallback(async () => {
    if (!token) {
      console.log("No token available, skipping load");
      return;
    }
    try {
      await fetchAllDocuments(apiUrl, token, {
        page: currentPage,
        limit: pageSize,
      });
    } catch (error) {
      console.error("Error loading promotions:", error);
      if (error.message === "Not authorized. Please login again.") {
        // Handle session expiration - maybe redirect to login
        setSuccessData({
          title: "Session Expired",
          description: "Please login again to continue.",
        });
        setShowSuccess(true);
      } else {
        setSuccessData({
          title: "Error!",
          description: error.message || "Failed to load promotions",
        });
        setShowSuccess(true);
      }
    }
  }, [fetchAllDocuments, apiUrl, token, currentPage, pageSize]);
  const handleViewPromotion = (promotion) => {
    setViewingPromotion(promotion);
    setShowViewModal(true);
  };

  // Check authentication and load data
  useEffect(() => {
    if (token && isAuthenticated) {
      loadPromotions();
      // Initialize WebSocket for real-time updates
      const wsUrl = apiUrl.replace("http", "ws");
      initWebSocket(wsUrl, token);
    }

    return () => {
      closeWebSocket();
    };
  }, [
    token,
    isAuthenticated,
    apiUrl,
    loadPromotions,
    initWebSocket,
    closeWebSocket,
  ]);

  // Filter promotions
  useEffect(() => {
    let filtered = [...promotions];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
          p.promotionLink?.toLowerCase().includes(q) ||
          p.mechanicLinks?.toLowerCase().includes(q),
      );
    }

    setFilteredPromotions(filtered);
    setCurrentPage(1);
  }, [search, promotions]);

  // Pagination
  const totalPages = Math.ceil(filteredPromotions.length / pageSize);
  const paginatedPromotions = filteredPromotions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleSavePromotion = async (formData) => {
    try {
      let result;
      if (modalMode === "add") {
        result = await createDocument(apiUrl, formData, token);
      } else {
        result = await updateDocument(
          apiUrl,
          selectedPromotion._id,
          formData,
          token,
        );
      }

      // Refresh the list
      await loadPromotions();
      return result;
    } catch (error) {
      console.error("Save error:", error);
      if (error.message === "Not authorized. Please login again.") {
        setSuccessData({
          title: "Session Expired",
          description: "Please login again to continue.",
        });
        setShowSuccess(true);
      }
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDocument(apiUrl, deleteId, token);
      await loadPromotions();
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(deleteId);
        return newSet;
      });
      setSuccessData({
        title: "Deleted!",
        description: "Promotion deleted successfully.",
      });
      setShowSuccess(true);
    } catch (error) {
      setSuccessData({
        title: "Error!",
        description: error.message || "Failed to delete promotion",
      });
      setShowSuccess(true);
    } finally {
      setShowDelete(false);
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    try {
      await bulkDeleteDocuments(apiUrl, idsToDelete, token);
      await loadPromotions();
      setSelectedIds(new Set());
      setSuccessData({
        title: "Deleted!",
        description: `${idsToDelete.length} promotion(s) deleted.`,
      });
      setShowSuccess(true);
    } catch (error) {
      setSuccessData({
        title: "Error!",
        description: error.message || "Failed to delete promotions",
      });
      setShowSuccess(true);
    } finally {
      setShowDelete(false);
      setIsBulkDelete(false);
    }
  };

  const handleToggleVisibility = async (id, currentStatus) => {
    try {
      await updateVisibility(apiUrl, id, !currentStatus, token);
      await loadPromotions();
      setSuccessData({
        title: "Updated!",
        description: `Promotion ${!currentStatus ? "published" : "hidden"} successfully.`,
      });
      setShowSuccess(true);
    } catch (error) {
      setSuccessData({
        title: "Error!",
        description: error.message || "Failed to update visibility",
      });
      setShowSuccess(true);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedPromotions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedPromotions.map((p) => p._id)));
    }
  };

  const toggleSelectOne = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(promotions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promotions-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getWordCount = (text) => {
    return text?.split(/\s+/).filter((w) => w.length > 0).length || 0;
  };

  const getReadTime = (text) => {
    const words = getWordCount(text);
    return Math.max(1, Math.ceil(words / 200));
  };

  // Don't render if not authenticated
  if (!token || !isAuthenticated) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500">Please login to access promotions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl shadow-sm"
            style={{ background: "#d81318" }}
          >
            <FiFileText className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Promotion Manager
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Create and manage promotional documents
              {isWebSocketConnected && (
                <span className="ml-2 text-green-600 text-xs">● Live</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadPromotions}
            className="p-2 text-gray-600 hover:text-[#d81318] hover:bg-red-50 rounded-lg transition"
          >
            <MdRefresh className={`text-xl ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
          >
            <MdDownload />
            Export
          </button>
          <button
            onClick={() => {
              setModalMode("add");
              setSelectedPromotion(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all hover:shadow-lg"
            style={{ background: "#d81318" }}
          >
            <MdAdd className="text-lg" />
            New Promotion
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">
                Total Promotions
              </p>
              <p className="text-2xl font-bold text-blue-800">
                {promotions.length}
              </p>
            </div>
            <FiFileText className="text-3xl text-blue-400" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Published</p>
              <p className="text-2xl font-bold text-green-800">
                {promotions.filter((p) => p.isShow).length}
              </p>
            </div>
            <MdVisibility className="text-3xl text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Total Tags</p>
              <p className="text-2xl font-bold text-purple-800">
                {new Set(promotions.flatMap((p) => p.tags || [])).size}
              </p>
            </div>
            <MdLabel className="text-3xl text-purple-400" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Total Words</p>
              <p className="text-2xl font-bold text-orange-800">
                {promotions
                  .reduce((sum, p) => sum + getWordCount(p.content), 0)
                  .toLocaleString()}
              </p>
            </div>
            <MdAccessTime className="text-3xl text-orange-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search promotions by title, content, or tags..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-yellow-800">
            {selectedIds.size} promotion(s) selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
            <button
              onClick={() => {
                setIsBulkDelete(true);
                setShowDelete(true);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Promotions Grid View */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d81318]" />
        </div>
      ) : paginatedPromotions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FiFileText className="text-5xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No promotions found</p>
          <button
            onClick={() => {
              setModalMode("add");
              setSelectedPromotion(null);
              setShowModal(true);
            }}
            className="mt-4 text-[#d81318] hover:underline"
          >
            Create your first promotion
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedPromotions.map((promo) => (
            <motion.div
              key={promo._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group relative"
            >
              {/* Checkbox */}
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={selectedIds.has(promo._id)}
                  onChange={() => toggleSelectOne(promo._id)}
                  className="rounded border-gray-300 focus:ring-[#d81318]"
                  style={{ accentColor: "#d81318" }}
                />
              </div>

              {/* Visibility Badge */}
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() =>
                    handleToggleVisibility(promo._id, promo.isShow)
                  }
                  className={`p-1.5 rounded-full transition ${
                    promo.isShow
                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  title={promo.isShow ? "Published" : "Draft"}
                >
                  {promo.isShow ? (
                    <IoEyeOutline className="text-sm" />
                  ) : (
                    <IoEyeOffOutline className="text-sm" />
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="p-5 pt-12">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {promo.title}
                </h3>

                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {promo.subtitle}
                </p>

                <div
                  className="text-sm text-gray-600 mb-3 line-clamp-3"
                  dangerouslySetInnerHTML={{
                    __html: promo.content?.substring(0, 150) + "...",
                  }}
                />

                {/* Tags */}
                {promo.tags && promo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {promo.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                    {promo.tags.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{promo.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Date Range */}
                {promo.promoPeriod && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                    <FiCalendar className="text-sm" />
                    <span>
                      {formatDate(promo.promoPeriod.startDate)} -{" "}
                      {formatDate(promo.promoPeriod.endDate)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span>📄 {getWordCount(promo.content)} words</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MdAccessTime className="text-sm" />
                    <span>{getReadTime(promo.content)} min read</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleViewPromotion(promo)}
                    className="flex-1 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm transition"
                  >
                    <IoEyeOutline className="inline mr-1" /> View
                  </button>
                  <button
                    onClick={() => {
                      setModalMode("edit");
                      setSelectedPromotion(promo);
                      setShowModal(true);
                    }}
                    className="flex-1 py-1.5 text-blue-600 hover:bg-blue-50 rounded text-sm transition"
                  >
                    <MdEdit className="inline mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setDeleteId(promo._id);
                      setIsBulkDelete(false);
                      setShowDelete(true);
                    }}
                    className="flex-1 py-1.5 text-red-600 hover:bg-red-50 rounded text-sm transition"
                  >
                    <MdDelete className="inline mr-1" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals */}
      <ModalDocument
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        mode={modalMode}
        documentData={selectedPromotion}
        onSave={handleSavePromotion}
        onSuccess={(msg) => {
          setSuccessData({ title: "Success!", description: msg });
          setShowSuccess(true);
          loadPromotions();
        }}
      />
      <ModalViewPromotion
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        promotion={viewingPromotion}
      />
      {showDelete && (
        <CardDelete
          message={
            isBulkDelete
              ? `Delete ${selectedIds.size} promotions? This action cannot be undone.`
              : `Delete this promotion? This action cannot be undone.`
          }
          onCancel={() => {
            setShowDelete(false);
            setDeleteId(null);
            setIsBulkDelete(false);
          }}
          onConfirm={isBulkDelete ? handleBulkDelete : handleDelete}
        />
      )}

      {showSuccess && (
        <CardSuccess
          title={successData.title}
          description={successData.description}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  );
};

export default Promotions;
