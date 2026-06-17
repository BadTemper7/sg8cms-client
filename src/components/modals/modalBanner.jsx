import React, { useRef, useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FiUploadCloud } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import useBannerStore from "../../stores/bannerStore";
import useAuthStore from "../../stores/authStore";
import { getMinDate } from "../utils/formatDate";
import { IoDesktop, IoPhonePortrait } from "react-icons/io5"; // Device mode icons
import { MdLightMode, MdDarkMode } from "react-icons/md"; // Theme mode icons

const API_URL =
  window.location.hostname === "localhost"
    ? process.env.REACT_APP_BACKEND_API_TEST
    : process.env.REACT_APP_BACKEND_API;

const ModalBanner = ({
  isOpen,
  onClose,
  refresh,
  mode,
  bannerData,
  onSuccess,
}) => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);

  // Device mode and theme state
  const [device, setDevice] = useState("desktop"); // "desktop" or "mobile"
  const [theme, setTheme] = useState("light"); // "light" or "dark"

  const { createBanner, updateBanner } = useBannerStore();
  const user = useAuthStore((state) => state.user);

  // PREFILL FIELDS FOR EDIT
  useEffect(() => {
    if (isOpen && mode === "edit" && bannerData) {
      const formattedExpiry = bannerData.expiry
        ? new Date(bannerData.expiry).toISOString().split("T")[0]
        : "";

      setExpiryDate(formattedExpiry);
      setStatus(bannerData.status || "active");
      setFileName(bannerData.url);
      setPreviewUrl(bannerData.url);

      // Prefill the device mode and theme if they exist in bannerData
      setDevice(bannerData.device || "desktop");
      setTheme(bannerData.theme || "light");
    }

    if (isOpen && mode === "add") {
      setExpiryDate("");
      setStatus("active");
      setPreviewUrl(null);
      setFile(null);
      setFileName("");
      setDevice("desktop");
      setTheme("light");
    }
  }, [isOpen, mode, bannerData]);

  const handleClose = () => {
    setFile(null);
    setFileName("");
    setPreviewUrl(null);
    setErrorMessage("");
    setExpiryDate("");
    setStatus("active");
    setDevice("desktop");
    setTheme("light");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const handleFile = (file) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Only JPEG and WEBP formats are allowed.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setErrorMessage("Image must be less than 1MB.");
      return;
    }

    setFile(file);
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMessage("");
  };

  const handleFileChange = (e) => handleFile(e.target.files[0]);

  const handleRemoveImage = () => {
    setFile(null);
    setFileName("");
    setPreviewUrl(null);
    fileInputRef.current.value = "";
  };

  const uploadToCloudinary = async () => {
    if (!file) throw new Error("Select an image first");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_PRESET);

    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await res.json();
    if (!data.secure_url) throw new Error("Cloudinary upload failed");
    return data.secure_url; // This is the real image URL returned by Cloudinary
  };

  const handleUpload = async () => {
    try {
      if (!status) return setErrorMessage("Status is required.");
      if (!file && mode === "add") {
        return setErrorMessage("Upload an image first.");
      }
      if (!user?.id) {
        return setErrorMessage("User not loaded yet. Please try again.");
      }

      setLoading(true);

      let imageUrl = previewUrl;

      if (mode === "add") {
        imageUrl = await uploadToCloudinary();
      } else if (mode === "edit" && file) {
        imageUrl = await uploadToCloudinary();
      }

      const payload = {
        url: imageUrl,
        status,
        expiry: expiryDate || null,
        device,
        theme,
        uploadedBy: user.id,
      };

      let res;
      if (mode === "edit") {
        res = await updateBanner(API_URL, bannerData._id, payload);
      } else {
        res = await createBanner(API_URL, payload);
      }

      if (!res || res.message?.includes("Failed")) {
        throw new Error(res?.message || "Failed to save banner.");
      }

      handleClose();
      await refresh();

      setTimeout(() => {
        onSuccess?.(res.message || "Banner saved successfully.");
      }, 10);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(""), 3000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          ></motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative bg-white rounded-lg shadow-lg w-[340px] sm:w-[400px] p-5 z-10"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[16px] font-semibold text-gray-800">
                {mode === "edit" ? "Edit Banner" : "Upload Banner"}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700 transition"
                onClick={handleClose}
              >
                <IoClose size={20} />
              </button>
            </div>

            {/* Expiry Date */}
            <label className="block text-sm text-gray-700 mb-1">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              min={mode === "add" ? getMinDate() : getMinDate() || expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3"
            />

            {/* Status */}
            <label className="block text-sm text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
            >
              <option value="active">Active</option>
              <option value="hide">Hide</option>
            </select>

            <div className="flex gap-5">
              {/* Device Mode Selection with Icons */}
              <div className="mb-3">
                <label className="block text-sm text-gray-700 mb-2">
                  Device Mode
                </label>
                <div className="flex items-center">
                  <label className="mr-4 cursor-pointer">
                    <IoDesktop
                      size={24}
                      color={device === "desktop" ? "#4CAF50" : "#9E9E9E"}
                      onClick={() => setDevice("desktop")}
                    />
                  </label>
                  <label className="cursor-pointer">
                    <IoPhonePortrait
                      size={24}
                      color={device === "mobile" ? "#4CAF50" : "#9E9E9E"}
                      onClick={() => setDevice("mobile")}
                    />
                  </label>
                </div>
              </div>

              {/* Theme Mode Selection with Icons */}
              <div className="mb-3">
                <label className="block text-sm text-gray-700 mb-2">
                  Theme Mode
                </label>
                <div className="flex items-center">
                  <label className="mr-4 cursor-pointer">
                    <MdLightMode
                      size={24}
                      color={theme === "light" ? "#4CAF50" : "#9E9E9E"}
                      onClick={() => setTheme("light")}
                    />
                  </label>
                  <label className="cursor-pointer">
                    <MdDarkMode
                      size={24}
                      color={theme === "dark" ? "#4CAF50" : "#9E9E9E"}
                      onClick={() => setTheme("dark")}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div
              onClick={() => !previewUrl && fileInputRef.current.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFile(e.dataTransfer.files[0]);
              }}
              className={`border-2 border-dashed rounded-md py-6 px-4 flex flex-col items-center justify-center text-center cursor-pointer ${
                previewUrl
                  ? "border-gray-200"
                  : isDragging
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
              }`}
            >
              {previewUrl ? (
                <div className="relative w-full">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-40 rounded-md object-contain w-full"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="absolute top-2 right-2 bg-white/80 p-1 rounded-full shadow"
                  >
                    <IoClose size={16} />
                  </button>
                  <p className="text-sm mt-2 text-gray-600 truncate">
                    {fileName}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <FiUploadCloud className="text-4xl text-gray-400 mb-2" />
                  <p className="text-gray-600 text-sm">
                    Choose a file or drag & drop it here
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Only JPEG & WEBP — Max 1MB
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpeg,.jpg,.webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {errorMessage && (
              <p className="text-red-500 text-sm mt-3">{errorMessage}</p>
            )}

            {/* Submit */}
            <button
              onClick={handleUpload}
              disabled={loading}
              className={`mt-4 w-full py-2 rounded-md text-white font-medium ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Uploading..." : mode === "edit" ? "Update" : "Upload"}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalBanner;
