import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdDeleteForever } from "react-icons/md";

const CardDelete = ({ message, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center z-[9999]">
        {/* BACKDROP */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* MODAL */}
        <motion.div
          className="relative bg-white rounded-2xl shadow-xl w-[320px] sm:w-[380px] px-6 py-8 z-10 border border-red-300"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <MdDeleteForever size={48} className="text-[#d81318]" />
            </div>

            <h3 className="text-2xl font-bold" style={{ color: "#d81318" }}>
              Delete?
            </h3>

            <p className="text-gray-600 mt-2 text-sm">{message}</p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onCancel}
                className="px-5 py-2 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>

              <button
                onClick={onConfirm}
                className="px-5 py-2 rounded-xl text-white font-medium transition hover:shadow-md"
                style={{ background: "#d81318" }}
              >
                Confirm
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CardDelete;
