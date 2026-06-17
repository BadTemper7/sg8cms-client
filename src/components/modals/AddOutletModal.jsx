import React from "react";
import { motion } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { MdBusiness, MdLocationOn } from "react-icons/md";

const AddOutletModal = ({ isOpen, onClose, onSave, saving, error }) => {
  const [outletForm, setOutletForm] = React.useState({
    code: "",
    name: "",
    location: "",
    siteValue: "",
    active: true,
  });

  // Reset form on open
  React.useEffect(() => {
    if (isOpen)
      setOutletForm({
        code: "",
        name: "",
        location: "",
        siteValue: "",
        active: true,
      });
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(outletForm);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
        >
          <IoClose size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4">Add New Outlet</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600">
              <MdBusiness className="inline mr-1" size={12} />
              Outlet Code *
            </label>
            <input
              value={outletForm.code}
              onChange={(e) =>
                setOutletForm((p) => ({ ...p, code: e.target.value }))
              }
              placeholder="OUT001"
              className="w-full rounded-xl border border-gray-200 p-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Outlet Name *
            </label>
            <input
              value={outletForm.name}
              onChange={(e) =>
                setOutletForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Main Outlet"
              className="w-full rounded-xl border border-gray-200 p-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Site Value *
            </label>
            <input
              value={outletForm.siteValue}
              onChange={(e) =>
                setOutletForm((p) => ({ ...p, siteValue: e.target.value }))
              }
              placeholder="SG8ECC3"
              className="w-full rounded-xl border border-gray-200 p-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">
              <MdLocationOn className="inline mr-1" size={12} />
              Location
            </label>
            <input
              value={outletForm.location}
              onChange={(e) =>
                setOutletForm((p) => ({ ...p, location: e.target.value }))
              }
              placeholder="City, State"
              className="w-full rounded-xl border border-gray-200 p-2 text-sm"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${
                saving ? "bg-gray-400" : "bg-[#d81318] hover:opacity-90"
              }`}
            >
              {saving ? "Adding…" : "Add Outlet"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddOutletModal;
