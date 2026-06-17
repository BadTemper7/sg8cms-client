// components/modals/ModalDocument.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  IoClose,
  IoSave,
  IoDocumentText,
  IoPrint,
  IoCalendarOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoFlameOutline,
} from "react-icons/io5";
import { MdUpload, MdSort, MdNumbers } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import DocumentEditor from "../editor/DocumentEditor";

const ModalDocument = ({
  isOpen,
  onClose,
  mode,
  documentData,
  onSave,
  onSuccess,
}) => {
  const [customId, setCustomId] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isShow, setIsShow] = useState(false);
  const [isHot, setIsHot] = useState(false);
  const [isTncShow, setIsTncShow] = useState(true);
  const [slug, setSlug] = useState("");
  const [order, setOrder] = useState(0);
  const [altText, setAltText] = useState("");
  const [mobileLabel, setMobileLabel] = useState("");
  const [desktopLabel, setDesktopLabel] = useState("");
  const [buttonText, setButtonText] = useState("Learn More");
  const [mobileBannerUrl, setMobileBannerUrl] = useState("");
  const [desktopBannerUrl, setDesktopBannerUrl] = useState("");
  const [mobileBannerFile, setMobileBannerFile] = useState(null);
  const [desktopBannerFile, setDesktopBannerFile] = useState(null);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState({});

  const mobileBannerInputRef = useRef(null);
  const desktopBannerInputRef = useRef(null);
  const editorContentRef = useRef("");

  const formatSlug = (value) => {
    let formatted = value.toLowerCase().trim();
    formatted = formatted.replace(/[^a-z0-9-]/g, "-");
    formatted = formatted.replace(/-+/g, "-");
    return formatted;
  };

  const handleContentChange = (newContent) => {
    editorContentRef.current = newContent;
    setContent(newContent);
  };

  // Convert UTC ISO string from backend to datetime-local format (UTC+8)
  const utcToLocalForDisplay = (utcDateString) => {
    if (!utcDateString) return "";

    // Since backend stores in UTC but server timezone is Asia/Manila,
    // we need to add 8 hours to display correctly
    const utcDate = new Date(utcDateString);
    const localDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);

    const year = localDate.getUTCFullYear();
    const month = String(localDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(localDate.getUTCDate()).padStart(2, "0");
    const hours = String(localDate.getUTCHours()).padStart(2, "0");
    const minutes = String(localDate.getUTCMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Format date for backend - send as UTC+8 string (no conversion needed)
  const formatDateForBackend = (datetimeLocalValue) => {
    if (!datetimeLocalValue) return "";

    // The datetime-local value is already in UTC+8 format
    // Just convert to the format backend expects (YYYY-MM-DD HH:mm:ss)
    return datetimeLocalValue.replace("T", " ") + ":00";
  };

  const handleSaveDocument = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      const savedContent = editorContentRef.current || content;
      const formData = new FormData();

      if (customId) formData.append("id", customId);
      formData.append("title", documentTitle.trim());
      formData.append("subtitle", subtitle.trim());
      formData.append("content", savedContent);
      formData.append("slug", slug.trim());
      formData.append("isShow", isShow);
      formData.append("isHot", isHot);
      formData.append("isTncShow", isTncShow);
      formData.append("order", order.toString());
      formData.append("altText", altText.trim());
      formData.append("mobileLabel", mobileLabel.trim());
      formData.append("desktopLabel", desktopLabel.trim());
      formData.append("buttonText", buttonText.trim());

      // Send dates directly without conversion (backend expects UTC+8)
      const formattedStartDate = formatDateForBackend(startDate);
      const formattedEndDate = formatDateForBackend(endDate);

      formData.append("startDate", formattedStartDate);
      formData.append("endDate", formattedEndDate);

      if (mobileBannerFile) formData.append("mobileBanner", mobileBannerFile);
      else if (mobileBannerUrl && !mobileBannerUrl.startsWith("blob:"))
        formData.append("mobileBannerUrl", mobileBannerUrl);
      if (desktopBannerFile)
        formData.append("desktopBanner", desktopBannerFile);
      else if (desktopBannerUrl && !desktopBannerUrl.startsWith("blob:"))
        formData.append("desktopBannerUrl", desktopBannerUrl);

      await onSave(formData);
      onSuccess?.("Document saved successfully!");
      handleClose();
    } catch (err) {
      console.error("Save error:", err);
      setErrors({ general: "Failed to save document. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!documentTitle.trim()) e.documentTitle = "Title is required.";
    if (!subtitle.trim()) e.subtitle = "Subtitle is required.";
    if (!slug.trim()) e.slug = "Slug is required.";
    if (!startDate) e.startDate = "Start date is required.";
    if (!endDate) e.endDate = "End date is required.";
    if (startDate && endDate && startDate > endDate)
      e.endDate = "End date must be after start date.";
    if (slug && !/^[a-z0-9-]+$/.test(slug)) {
      e.slug = "Slug can only contain lowercase letters, numbers, and hyphens.";
    }
    if (customId && isNaN(parseInt(customId))) {
      e.customId = "ID must be a number.";
    }
    return e;
  };

  const handleMobileBannerChange = (file) => {
    if (!file) return;
    setUploadingMobile(true);
    setErrors((p) => ({ ...p, mobile: "" }));
    setMobileBannerUrl(URL.createObjectURL(file));
    setMobileBannerFile(file);
    setUploadingMobile(false);
    if (mobileBannerInputRef.current) mobileBannerInputRef.current.value = "";
  };

  const handleDesktopBannerChange = (file) => {
    if (!file) return;
    setUploadingDesktop(true);
    setErrors((p) => ({ ...p, desktop: "" }));
    setDesktopBannerUrl(URL.createObjectURL(file));
    setDesktopBannerFile(file);
    setUploadingDesktop(false);
    if (desktopBannerInputRef.current) desktopBannerInputRef.current.value = "";
  };

  const handleClose = () => {
    setCustomId("");
    setDocumentTitle("");
    setSubtitle("");
    setContent("");
    editorContentRef.current = "";
    setIsShow(false);
    setIsHot(false);
    setIsTncShow(true);
    setSlug("");
    setOrder(0);
    setAltText("");
    setMobileLabel("");
    setDesktopLabel("");
    setButtonText("Learn More");
    setMobileBannerUrl("");
    setDesktopBannerUrl("");
    setMobileBannerFile(null);
    setDesktopBannerFile(null);
    setStartDate("");
    setEndDate("");
    setErrors({});
    onClose();
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${documentTitle}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #ddd; padding: 8px; }
            ul, ol { padding-left: 1.5rem; margin: .5rem 0; }
          </style>
        </head>
        <body>${editorContentRef.current}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  useEffect(() => {
    if (!isOpen) return;
    if (mode === "edit" && documentData) {
      setCustomId(documentData.id?.toString() || "");
      setDocumentTitle(documentData.title || "");
      setSubtitle(documentData.subtitle || "");
      setContent(documentData.content || "");
      editorContentRef.current = documentData.content || "";
      setIsShow(documentData.isShow || false);
      setIsHot(documentData.isHot || false);
      setIsTncShow(
        documentData.isTncShow !== undefined ? documentData.isTncShow : true,
      );
      setSlug(documentData.slug || "");
      setOrder(documentData.order || 0);
      setAltText(documentData.altText || "");
      setMobileLabel(documentData.mobileLabel || "");
      setDesktopLabel(documentData.desktopLabel || "");
      setButtonText(documentData.buttonText || "Learn More");
      setMobileBannerUrl(documentData.banner?.mobile?.url || "");
      setDesktopBannerUrl(documentData.banner?.desktop?.url || "");
      setMobileBannerFile(null);
      setDesktopBannerFile(null);

      // Convert UTC from backend to UTC+8 for display
      setStartDate(
        documentData.promoPeriod?.startDate
          ? utcToLocalForDisplay(documentData.promoPeriod.startDate)
          : "",
      );
      setEndDate(
        documentData.promoPeriod?.endDate
          ? utcToLocalForDisplay(documentData.promoPeriod.endDate)
          : "",
      );
    } else {
      setCustomId("");
      setDocumentTitle("");
      setSubtitle("");
      setContent("");
      editorContentRef.current = "";
      setIsShow(false);
      setIsHot(false);
      setIsTncShow(true);
      setSlug("");
      setOrder(0);
      setAltText("");
      setMobileLabel("");
      setDesktopLabel("");
      setButtonText("Learn More");
      setMobileBannerUrl("");
      setDesktopBannerUrl("");
      setMobileBannerFile(null);
      setDesktopBannerFile(null);
      setStartDate("");
      setEndDate("");
    }
    setErrors({});
  }, [isOpen, mode, documentData]);

  const FieldError = ({ field }) =>
    errors[field] ? (
      <p className="text-xs text-red-500 mt-1">{errors[field]}</p>
    ) : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-5 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <IoDocumentText className="text-xl opacity-80" />
                <h2 className="text-base font-semibold tracking-tight">
                  {mode === "edit"
                    ? "Edit Promotion Document"
                    : "Create New Promotion"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {errors.general && (
                  <span className="text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded">
                    {errors.general}
                  </span>
                )}
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm transition font-medium"
                >
                  <IoPrint className="text-sm" /> Print
                </button>
                <button
                  onClick={handleSaveDocument}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-400 rounded text-sm transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IoSave className="text-sm" />{" "}
                  {isLoading ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-white/20 rounded transition"
                >
                  <IoClose className="text-lg" />
                </button>
              </div>
            </div>

            {/* Document Properties */}
            <div className="border-b border-gray-200 bg-gray-50 px-5 py-4 overflow-y-auto shrink-0 max-h-[40%]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isShow}
                      onChange={(e) => setIsShow(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Show on website
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isHot}
                      onChange={(e) => setIsHot(e.target.checked)}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <IoFlameOutline
                      className={`text-sm ${isHot ? "text-orange-500" : "text-gray-400"}`}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Mark as Hot
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  {isShow ? (
                    <IoEyeOutline className="text-green-600" />
                  ) : (
                    <IoEyeOffOutline className="text-gray-400" />
                  )}
                  <span
                    className={
                      isShow ? "text-green-600 font-medium" : "text-gray-400"
                    }
                  >
                    {isShow ? "Visible to users" : "Draft — hidden from users"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Custom ID{" "}
                    <span className="text-gray-400 text-xs font-normal">
                      (optional, numeric)
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <MdNumbers className="text-gray-400" />
                    <input
                      type="number"
                      value={customId}
                      onChange={(e) => {
                        setCustomId(e.target.value);
                        setErrors((p) => ({ ...p, customId: "" }));
                      }}
                      placeholder="e.g., 1001"
                      className={`w-full bg-white border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono ${
                        errors.customId ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Unique numeric identifier for this promotion
                  </p>
                  <FieldError field="customId" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => {
                      setDocumentTitle(e.target.value);
                      setErrors((p) => ({ ...p, documentTitle: "" }));
                    }}
                    placeholder="Enter promotion title…"
                    className={`w-full text-base font-semibold bg-white border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                      errors.documentTitle
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />
                  <FieldError field="documentTitle" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Subtitle <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => {
                      setSubtitle(e.target.value);
                      setErrors((p) => ({ ...p, subtitle: "" }));
                    }}
                    placeholder="Enter promotion subtitle…"
                    className={`w-full bg-white border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                      errors.subtitle ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  <FieldError field="subtitle" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setErrors((p) => ({ ...p, startDate: "" }));
                      }}
                      className={`w-full bg-white border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                        errors.startDate ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                    <IoCalendarOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <FieldError field="startDate" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setErrors((p) => ({ ...p, endDate: "" }));
                      }}
                      className={`w-full bg-white border rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                        errors.endDate ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                    <IoCalendarOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <FieldError field="endDate" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Priority Order
                  </label>
                  <div className="flex items-center gap-2">
                    <MdSort className="text-gray-400" />
                    <input
                      type="number"
                      value={order}
                      onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Lower number = higher priority
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Alt Text (SEO)
                  </label>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe the banner images..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Mobile Label
                  </label>
                  <input
                    type="text"
                    value={mobileLabel}
                    onChange={(e) => setMobileLabel(e.target.value)}
                    placeholder="e.g., Summer Camp!"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Desktop Label
                  </label>
                  <input
                    type="text"
                    value={desktopLabel}
                    onChange={(e) => setDesktopLabel(e.target.value)}
                    placeholder="e.g., Summer Camp Adventure!"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Learn More"
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Mobile Banner
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mobileBannerUrl}
                      onChange={(e) => setMobileBannerUrl(e.target.value)}
                      placeholder="Image URL"
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      ref={mobileBannerInputRef}
                      type="file"
                      accept="image/jpeg,image/webp,image/png"
                      onChange={(e) =>
                        handleMobileBannerChange(e.target.files[0])
                      }
                      className="hidden"
                    />
                    <button
                      onClick={() => mobileBannerInputRef.current?.click()}
                      disabled={uploadingMobile}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {uploadingMobile ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <MdUpload className="text-sm" />
                      )}
                    </button>
                  </div>
                  <FieldError field="mobile" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Desktop Banner
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={desktopBannerUrl}
                      onChange={(e) => setDesktopBannerUrl(e.target.value)}
                      placeholder="Image URL"
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      ref={desktopBannerInputRef}
                      type="file"
                      accept="image/jpeg,image/webp,image/png"
                      onChange={(e) =>
                        handleDesktopBannerChange(e.target.files[0])
                      }
                      className="hidden"
                    />
                    <button
                      onClick={() => desktopBannerInputRef.current?.click()}
                      disabled={uploadingDesktop}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {uploadingDesktop ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <MdUpload className="text-sm" />
                      )}
                    </button>
                  </div>
                  <FieldError field="desktop" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Slug / URL <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                      /promotion/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        const formatted = formatSlug(e.target.value);
                        setSlug(formatted);
                        setErrors((p) => ({ ...p, slug: "" }));
                      }}
                      placeholder="e.g., summer-camp-2025"
                      className={`flex-1 bg-white border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-mono text-sm ${
                        errors.slug ? "border-red-400" : "border-gray-300"
                      }`}
                    />
                  </div>
                  <FieldError field="slug" />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isTncShow}
                      onChange={(e) => setIsTncShow(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Show Terms &amp; Conditions Section
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Document Editor */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <DocumentEditor
                initialContent={content}
                onChange={handleContentChange}
                onSave={handleSaveDocument}
                readOnly={false}
                className="h-full"
              />
            </div>

            {/* Loading Overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50"
                >
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 font-medium">
                      Saving promotion document…
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ModalDocument;
