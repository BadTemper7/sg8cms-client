// Date only (for expiry)
export const formatDate = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (isNaN(date)) return "-";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Date + Time with AM/PM (for createdAt)
export const formatDateTime = (dateString) => {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (isNaN(date)) return "-";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const getMinDate = () => {
  const today = new Date();
  today.setDate(today.getDate() + 1); // tomorrow
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
