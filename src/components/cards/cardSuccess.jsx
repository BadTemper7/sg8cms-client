import React, { useEffect } from "react";
import { MdCheckCircle } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";

const CardSuccess = ({ title, description, onClose }) => {
  // Auto-close after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center z-[9999]">
        {/* BACKDROP */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* SUCCESS CARD */}
        <motion.div
          className="relative bg-white rounded-2xl shadow-xl w-[320px] sm:w-[380px] px-6 py-10 z-10 border border-green-300"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <MdCheckCircle className="text-[#d81318]" size={56} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
          </div>

          {description && (
            <p className="text-center mt-3 text-gray-600">{description}</p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CardSuccess;
