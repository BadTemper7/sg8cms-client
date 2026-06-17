// src/components/modals/ModalDepartmentManagement.jsx
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

const ModalDepartmentManagement = ({
  isOpen,
  onClose,
  mode,
  departmentData,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && mode === "edit" && departmentData) {
      setName(departmentData.name || "");
      setDescription(departmentData.description || "");
      setErrorMessage("");
    }

    if (isOpen && mode === "add") {
      setName("");
      setDescription("");
      setErrorMessage("");
    }
  }, [isOpen, mode, departmentData]);

  const handleClose = () => {
    setErrorMessage("");
    setLoading(false);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      if (!name.trim()) return setErrorMessage("Department name is required.");

      setLoading(true);

      const payload = {
        name: name.trim(),
        description: description.trim(),
      };

      await onSave?.(payload);
      handleClose();
    } catch (err) {
      setErrorMessage(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(""), 3000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative bg-white rounded-2xl shadow-xl w-[500px] max-w-full p-6 z-10"
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-800">
                {mode === "edit" ? "Edit Department" : "Add Department"}
              </h2>
              <button
                className="text-gray-500 hover:text-[#d81318] transition p-1 rounded-lg hover:bg-red-50"
                onClick={handleClose}
              >
                <IoClose size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition"
                  placeholder="Enter department name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d81318]/20 focus:border-[#d81318] transition resize-none"
                  placeholder="Enter department description"
                />
              </div>
            </div>

            {errorMessage && (
              <p className="text-red-500 text-sm mt-4">{errorMessage}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`mt-6 w-full py-2.5 rounded-xl text-white font-semibold transition-all ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "hover:shadow-lg hover:-translate-y-0.5"
              }`}
              style={!loading ? { background: "#d81318" } : {}}
            >
              {loading
                ? "Saving..."
                : mode === "edit"
                  ? "Update Department"
                  : "Add Department"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalDepartmentManagement;
