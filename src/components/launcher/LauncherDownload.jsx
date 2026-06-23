import React, { useMemo, useState } from "react";

const downloadItems = [
  {
    fileName: "SG8-Launcher-Setup-1.0.0.exe",
    type: "launcher",
    label: "SG8 Launcher",
    badge: "EXE",
  },
  {
    fileName: "RestrictPC.zip",
    type: "restrict-pc",
    label: "Restrict PC",
    badge: "ZIP",
  },
];

const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1", "::1"]);

const FILTERS = [
  { key: "all", label: "All" },
  { key: "launcher", label: "Launcher" },
  { key: "restrict-pc", label: "Restrict PC" },
];

const getBaseUrlByType = (type) => {
  const { hostname } = window.location;
  const isLocalhost = LOCALHOST_NAMES.has(hostname);

  if (type === "restrict-pc") {
    return isLocalhost
      ? "http://localhost:5000/restrict-pc"
      : "https://ws2.sg8.casino/restrict-pc";
  }

  return isLocalhost
    ? "http://localhost:5000/launcher-updates"
    : "https://ws2.sg8.casino/launcher-updates";
};

const extractVersion = (fileName) => {
  const match = String(fileName).match(/Setup-([0-9]+(?:\.[0-9]+)*)\.exe$/i);
  return match?.[1] || "";
};

const sortByLatestVersion = (items) => {
  return [...items].sort((a, b) => {
    if (a.type !== b.type) {
      if (a.type === "launcher") return -1;
      if (b.type === "launcher") return 1;
    }

    const aParts = extractVersion(a.fileName).split(".").map(Number);
    const bParts = extractVersion(b.fileName).split(".").map(Number);
    const maxLength = Math.max(aParts.length, bParts.length);

    for (let index = 0; index < maxLength; index += 1) {
      const aValue = aParts[index] || 0;
      const bValue = bParts[index] || 0;

      if (aValue !== bValue) {
        return bValue - aValue;
      }
    }

    return String(b.fileName).localeCompare(String(a.fileName));
  });
};

const getFileSizeLabel = (fileName) => {
  const fileSizes = {
    "SG8-Launcher-Setup-1.0.0.exe": "Installer",
    "RestrictPC.zip": "ZIP Package",
  };

  return fileSizes[fileName] || "Download File";
};

const getDownloadUrl = (item) => {
  const baseUrl = getBaseUrlByType(item.type);
  return `${baseUrl}/${encodeURIComponent(item.fileName)}`;
};

const getLatestLauncher = (items) => {
  const launchers = items.filter((item) => item.type === "launcher");
  return sortByLatestVersion(launchers)[0] || null;
};

const LauncherDownload = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const sortedItems = useMemo(() => sortByLatestVersion(downloadItems), []);
  const latestLauncher = useMemo(() => getLatestLauncher(downloadItems), []);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return sortedItems;
    return sortedItems.filter((item) => item.type === activeFilter);
  }, [activeFilter, sortedItems]);

  const latestUrl = latestLauncher ? getDownloadUrl(latestLauncher) : "#";
  const latestFile = latestLauncher?.fileName || "";
  const latestVersion = extractVersion(latestFile);

  return (
    <section className="mx-auto mt-8 max-w-5xl pb-16 sm:mt-10">
      <div className="rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-8">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#ffd84d]">
              Latest Version
            </p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              {latestVersion || "SG8 Launcher"}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              {latestFile || "No launcher available"}
            </p>
          </div>

          {latestLauncher && (
            <a
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#ff9d04] to-[#fcff1e] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#120476] shadow-lg shadow-yellow-500/20 transition hover:scale-[1.01] hover:brightness-105 active:scale-[0.99]"
              href={latestUrl}
              download={latestFile}
            >
              Download Latest
            </a>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-white">All Downloads</h3>
            <p className="mt-1 text-sm text-white/60">
              Filter between SG8 Launcher and Restrict PC files.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide transition ${
                    isActive
                      ? "bg-[#ffd84d] text-[#120476]"
                      : "border border-white/15 bg-white/10 text-white hover:border-[#ffd84d]/60 hover:bg-white/15"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const { fileName, type, label, badge } = item;
              const version = extractVersion(fileName);
              const url = getDownloadUrl(item);
              const isLatestLauncher =
                latestLauncher?.fileName === fileName && type === "launcher";

              return (
                <article
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-[#ffd84d]/50 hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
                  key={`${type}-${fileName}`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ffd84d] text-xs font-black text-[#120476]">
                      {badge}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-white sm:text-base">
                        <span className="break-all">{fileName}</span>

                        {isLatestLauncher && (
                          <span className="rounded-full bg-[#ffd84d]/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#ffd84d] ring-1 ring-[#ffd84d]/35">
                            Latest
                          </span>
                        )}

                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-white/70 ring-1 ring-white/10">
                          {label}
                        </span>
                      </div>

                      <div className="mt-1 text-sm text-white/55">
                        {version ? `Version ${version}` : label} |{" "}
                        {getFileSizeLabel(fileName)}
                      </div>
                    </div>
                  </div>

                  <a
                    className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:border-[#ffd84d]/60 hover:bg-[#ffd84d] hover:text-[#120476]"
                    href={url}
                    download={fileName}
                  >
                    Download
                  </a>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-white/60">
              No files found for this filter.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LauncherDownload;
