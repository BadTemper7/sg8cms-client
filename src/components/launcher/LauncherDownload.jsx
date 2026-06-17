import React, { useMemo } from "react";

const launcherVersions = [
  "SG8-Launcher-Setup-1.0.0.exe",
  "SG8-Launcher-Setup-1.0.1.exe",
  "SG8-Launcher-Setup-1.0.2.exe",
  "SG8-Launcher-Setup-1.0.3.exe",
  "SG8-Launcher-Setup-1.0.4.exe",
];

const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1", "::1"]);

const getLauncherBaseUrl = () => {
  const { hostname } = window.location;
  const isLocalhost = LOCALHOST_NAMES.has(hostname);

  if (isLocalhost) {
    return "http://localhost:5000/launcher-updates";
  }

  return "https://sg8cms-server.onrender.com/launcher-updates";
};

const extractVersion = (fileName) => {
  const match = String(fileName).match(/Setup-([0-9]+(?:\.[0-9]+)*)\.exe$/i);
  return match?.[1] || "";
};

const sortByLatestVersion = (versions) => {
  return [...versions].sort((a, b) => {
    const aParts = extractVersion(a).split(".").map(Number);
    const bParts = extractVersion(b).split(".").map(Number);
    const maxLength = Math.max(aParts.length, bParts.length);

    for (let index = 0; index < maxLength; index += 1) {
      const aValue = aParts[index] || 0;
      const bValue = bParts[index] || 0;

      if (aValue !== bValue) {
        return bValue - aValue;
      }
    }

    return String(b).localeCompare(String(a));
  });
};

const getFileSizeLabel = (fileName) => {
  const fileSizes = {
    "SG8-Launcher-Setup-1.0.0.exe": "Installer",
    "SG8-Launcher-Setup-1.0.1.exe": "Installer",
    "SG8-Launcher-Setup-1.0.2.exe": "Installer",
    "SG8-Launcher-Setup-1.0.3.exe": "Installer",
    "SG8-Launcher-Setup-1.0.4.exe": "Installer",
  };

  return fileSizes[fileName] || "Installer";
};

const LauncherDownload = () => {
  const baseUrl = useMemo(() => getLauncherBaseUrl(), []);
  const sortedVersions = useMemo(
    () => sortByLatestVersion(launcherVersions),
    [],
  );
  const latestFile = sortedVersions[0];
  const latestUrl = `${baseUrl}/${encodeURIComponent(latestFile)}`;

  return (
    <section className="mx-auto mt-8 max-w-5xl pb-16 sm:mt-10">
      <div className="rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-8">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#ffd84d]">
              Latest Version
            </p>
            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              {extractVersion(latestFile) || "SG8 Launcher"}
            </h2>
            <p className="mt-2 text-sm text-white/60">{latestFile}</p>
          </div>

          <a
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#ff9d04] to-[#fcff1e] px-6 py-3 text-sm font-black uppercase tracking-wide text-[#120476] shadow-lg shadow-yellow-500/20 transition hover:scale-[1.01] hover:brightness-105 active:scale-[0.99]"
            href={latestUrl}
            download={latestFile}
          >
            Download Latest
          </a>
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-white">
              All Launcher Versions
            </h3>
            <p className="mt-1 text-sm text-white/60">
              Select a specific installer version below.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {sortedVersions.map((fileName, index) => {
            const version = extractVersion(fileName);
            const url = `${baseUrl}/${encodeURIComponent(fileName)}`;
            const isLatest = index === 0;

            return (
              <article
                className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-[#ffd84d]/50 hover:bg-white/10 sm:flex-row sm:items-center sm:justify-between"
                key={fileName}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ffd84d] text-xs font-black text-[#120476]">
                    EXE
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-white sm:text-base">
                      <span className="break-all">{fileName}</span>
                      {isLatest && (
                        <span className="rounded-full bg-[#ffd84d]/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-[#ffd84d] ring-1 ring-[#ffd84d]/35">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-white/55">
                      Version {version || "Unknown"} |{" "}
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
          })}
        </div>
      </div>
    </section>
  );
};

export default LauncherDownload;
