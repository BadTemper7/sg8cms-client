import React from "react";
import { MdHome, MdChevronRight, MdAnnouncement } from "react-icons/md";

const BreadCrumbs = () => {
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split("/").filter((segment) => segment);

  const getIcon = (name) => {
    if (name === "Home" || name === "") return <MdHome className="w-4 h-4" />;
    if (name === "Announcements") return <MdAnnouncement className="w-4 h-4" />;
    return null;
  };

  const breadcrumbs = [
    { name: "Home", href: "/" },
    ...pathSegments.map((segment, index) => ({
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: "/" + pathSegments.slice(0, index + 1).join("/"),
    })),
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <MdChevronRight className="w-4 h-4 text-gray-400" />}
            <a
              href={crumb.href}
              className={`flex items-center gap-1 transition-all duration-300 ${
                index === breadcrumbs.length - 1
                  ? "text-[#d81318] font-medium"
                  : "text-gray-400 hover:text-[#d81318]"
              }`}
            >
              {getIcon(crumb.name)}
              <span>{crumb.name}</span>
            </a>
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default BreadCrumbs;
