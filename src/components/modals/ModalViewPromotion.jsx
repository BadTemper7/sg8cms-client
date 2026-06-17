// components/modals/ModalViewPromotion.jsx
import React, { useState } from "react";
import {
  IoClose,
  IoCalendarOutline,
  IoDocumentText,
  IoEye,
  IoEyeOff,
} from "react-icons/io5";
import { MdPerson, MdAccessTime, MdLabel, MdDateRange } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const ModalViewPromotion = ({ isOpen, onClose, promotion }) => {
  const [activeTab, setActiveTab] = useState("content");

  if (!promotion) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWordCount = (text) => {
    if (!text) return 0;
    // Strip HTML tags before counting words
    const strippedText = text.replace(/<[^>]*>/g, "");
    return strippedText.split(/\s+/).filter((w) => w.length > 0).length || 0;
  };

  const getReadTime = (text) => {
    const words = getWordCount(text);
    return Math.max(1, Math.ceil(words / 200));
  };

  const stripHtml = (html) => {
    if (!html) return "";
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <IoDocumentText className="text-2xl" />
                <div>
                  <h2 className="text-xl font-semibold">{promotion.title}</h2>
                  <p className="text-sm text-blue-200 mt-0.5">
                    {promotion.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
              >
                <IoClose className="text-xl" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50 px-6 flex gap-2 shrink-0">
              <button
                onClick={() => setActiveTab("content")}
                className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                  activeTab === "content"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Content
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                  activeTab === "details"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("images")}
                className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                  activeTab === "images"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Images
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">
              {activeTab === "content" && (
                <div className="space-y-6">
                  {/* Content Preview */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <IoDocumentText className="text-blue-500" />
                      Promotion Content
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: promotion.content }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm text-gray-500 border-t pt-4">
                    <span>📄 {getWordCount(promotion.content)} words</span>
                    <span>⏱️ {getReadTime(promotion.content)} min read</span>
                    <span>
                      📝 {stripHtml(promotion.content)?.length || 0} characters
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "details" && (
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Status
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        {promotion.isShow ? (
                          <>
                            <IoEye className="text-green-600" />
                            <span className="text-green-700 font-medium">
                              Published
                            </span>
                          </>
                        ) : (
                          <>
                            <IoEyeOff className="text-gray-500" />
                            <span className="text-gray-600">Draft</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        T&amp;C Section
                      </label>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            promotion.isTncShow
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {promotion.isTncShow ? "Visible" : "Hidden"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Slug */}
                  {promotion.slug && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Slug / URL
                      </label>
                      <div className="mt-1 font-mono text-sm text-gray-700">
                        /promotion/{promotion.slug}
                      </div>
                    </div>
                  )}

                  {/* Promo Period */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <MdDateRange /> Promotion Period
                    </label>
                    <div className="mt-1 space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <IoCalendarOutline className="text-gray-400 text-sm" />
                        <span>
                          Start:{" "}
                          {formatDateTime(promotion.promoPeriod?.startDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IoCalendarOutline className="text-gray-400 text-sm" />
                        <span>
                          End: {formatDateTime(promotion.promoPeriod?.endDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  {(promotion.promotionLink || promotion.mechanicLinks) && (
                    <div className="space-y-3">
                      {promotion.promotionLink && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <label className="text-xs text-gray-500 uppercase tracking-wide">
                            Promotion Link
                          </label>
                          <a
                            href={promotion.promotionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm break-all mt-1 block"
                          >
                            {promotion.promotionLink}
                          </a>
                        </div>
                      )}

                      {promotion.mechanicLinks &&
                        promotion.mechanicLinks !== promotion.promotionLink && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <label className="text-xs text-gray-500 uppercase tracking-wide">
                              Mechanic Links
                            </label>
                            <a
                              href={promotion.mechanicLinks}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm break-all mt-1 block"
                            >
                              {promotion.mechanicLinks}
                            </a>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Tags */}
                  {promotion.tags && promotion.tags.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <MdLabel /> Tags
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {promotion.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white rounded-full text-xs text-gray-600 border border-gray-200"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Created By
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <MdPerson className="text-gray-400" />
                        <span className="text-sm">
                          {promotion.createdBy?.username || "Unknown"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDateTime(promotion.createdAt)}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Last Modified
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <MdAccessTime className="text-gray-400" />
                        <span className="text-sm">
                          {promotion.lastModifiedBy?.username || "Unknown"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDateTime(promotion.updatedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Version */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                      Version
                    </label>
                    <div className="mt-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        v{promotion.version || 1}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "images" && (
                <div className="space-y-6">
                  {/* Mobile Banner */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      📱 Mobile Banner
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {promotion.banner?.mobile?.url ? (
                        <div className="space-y-3">
                          <img
                            src={promotion.banner.mobile.url}
                            alt="Mobile Banner"
                            className="max-w-full max-h-64 rounded-lg object-contain mx-auto border border-gray-200"
                          />
                          <div className="text-xs text-gray-500 break-all">
                            <strong>URL:</strong>{" "}
                            <a
                              href={promotion.banner.mobile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all"
                            >
                              {promotion.banner.mobile.url}
                            </a>
                          </div>
                          {promotion.banner.mobile.publicId && (
                            <div className="text-xs text-gray-500">
                              <strong>Public ID:</strong>{" "}
                              {promotion.banner.mobile.publicId}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          No mobile banner image
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Desktop Banner */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      🖥️ Desktop Banner
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {promotion.banner?.desktop?.url ? (
                        <div className="space-y-3">
                          <img
                            src={promotion.banner.desktop.url}
                            alt="Desktop Banner"
                            className="max-w-full max-h-64 rounded-lg object-contain mx-auto border border-gray-200"
                          />
                          <div className="text-xs text-gray-500 break-all">
                            <strong>URL:</strong>{" "}
                            <a
                              href={promotion.banner.desktop.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline break-all"
                            >
                              {promotion.banner.desktop.url}
                            </a>
                          </div>
                          {promotion.banner.desktop.publicId && (
                            <div className="text-xs text-gray-500">
                              <strong>Public ID:</strong>{" "}
                              {promotion.banner.desktop.publicId}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          No desktop banner image
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalViewPromotion;
