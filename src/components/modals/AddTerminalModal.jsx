import React from "react";
import { motion } from "framer-motion";
import { IoClose } from "react-icons/io5";

const AddTerminalModal = ({
  isOpen,
  onClose,
  onSave,
  saving,
  error,
  outletName,
}) => {
  const [terminalForm, setTerminalForm] = React.useState({
    code: "",
    description: "",
    active: true,
    isGameDisabled: false,
  });

  React.useEffect(() => {
    if (isOpen)
      setTerminalForm({
        code: "",
        description: "",
        active: true,
        isGameDisabled: false,
      });
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(terminalForm);
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
        <h2 className="text-xl font-bold mb-4">Add Terminal to {outletName}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Terminal Code *
            </label>
            <input
              value={terminalForm.code}
              onChange={(e) =>
                setTerminalForm((p) => ({ ...p, code: e.target.value }))
              }
              placeholder="T001"
              className="w-full rounded-xl border border-gray-200 p-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Description
            </label>
            <input
              value={terminalForm.description}
              onChange={(e) =>
                setTerminalForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Terminal description"
              className="w-full rounded-xl border border-gray-200 p-2 text-sm"
            />
          </div>
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
              className="w-4 h-4 rounded border-gray-300 text-[#d81318]"
            />
            <span className="text-sm text-gray-700">
              Disable games on this terminal
            </span>
          </label>
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
              {saving ? "Adding…" : "Add Terminal"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddTerminalModal;
