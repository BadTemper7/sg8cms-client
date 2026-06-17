import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { getMinDate } from "../utils/formatDate";

const ModalAnnouncements = ({
  isOpen,
  onClose,
  mode,
  announceArray,
  onSubmit,
}) => {
  const [announcement, setAnnouncement] = useState("");
  const [expiry, setExpiry] = useState("");
  const [status, setStatus] = useState("active");

  const maxChars = 120;

  // Prefill fields in edit mode
  useEffect(() => {
    if (isOpen && mode === "edit" && announceArray) {
      setAnnouncement(announceArray.desc || "");

      // Format expiry => yyyy-mm-dd
      if (announceArray.expiry) {
        const d = new Date(announceArray.expiry);
        setExpiry(d.toISOString().split("T")[0]);
      } else {
        setExpiry(""); // allow null
      }

      setStatus(announceArray.status || "active");
    }

    if (isOpen && mode === "add") {
      setAnnouncement("");
      setExpiry("");
      setStatus("active");
    }
  }, [isOpen, mode, announceArray]);

  // Submit handler
  const handleSubmit = async () => {
    if (!announcement.trim()) return alert("Announcement is required!");

    // Validate only for ADD
    if (mode === "add" && expiry && expiry < getMinDate()) {
      return alert("Expiry date must be later than today.");
    }

    // Always send expiry (date or null)
    const payload = {
      desc: announcement,
      status,
      expiry: expiry || null,
    };

    await onSubmit(payload);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative bg-white rounded-xl shadow-2xl w-[320px] sm:w-[450px] p-6 z-10"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
              <h2
                className="text-xl font-bold"
                style={{ color: mode === "edit" ? "#d81318" : "#120476" }}
              >
                {mode === "edit" ? "Edit Announcement" : "Upload Announcement"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-[#d81318] transition-colors duration-200"
              >
                <IoClose size={24} />
              </button>
            </div>

            {/* Expiry */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date{" "}
              <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="date"
              value={expiry}
              min={mode === "add" ? getMinDate() : undefined}
              onChange={(e) => setExpiry(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 mb-5 focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition-all duration-200"
            />

            {/* Status */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 mb-5 focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition-all duration-200"
            >
              <option value="active">Active</option>
              <option value="hide">Hidden</option>
            </select>

            {/* Announcement */}
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Announcement <span className="text-red-500 text-xs">*</span>
            </label>
            <textarea
              rows="4"
              maxLength={maxChars}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition-all duration-200"
              placeholder="Enter your announcement here..."
            />
            <p
              className={`text-xs text-right mt-1 ${announcement.length === maxChars ? "text-red-500" : "text-gray-400"}`}
            >
              {announcement.length} / {maxChars} characters
            </p>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!announcement.trim()}
              className="mt-6 w-full font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={
                announcement.trim()
                  ? {
                      background: "linear-gradient(45deg, #ff9d03, #fcff1e)",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    }
                  : {
                      background: "#e5e7eb",
                      color: "#9ca3af",
                    }
              }
            >
              {mode === "edit" ? "Update Announcement" : "Post Announcement"}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalAnnouncements;
