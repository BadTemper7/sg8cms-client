import React from "react";
import LauncherDownload from "../components/launcher/LauncherDownload";

const Download = () => {
  return (
    <main className="min-h-screen bg-[#070c3b] px-4 py-10 text-white sm:px-6 lg:px-8">
      <section className="mx-auto flex max-w-5xl justify-center pt-10 sm:pt-16">
        <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-white/10 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-md sm:p-10">
          <div className="mx-auto mb-6 flex h-24 w-40 items-center justify-center text-6xl font-serif font-semibold tracking-tight text-white sm:text-7xl">
            <img src="/images/icons/sg8-casino-logo.webp" alt="SG8 Casino" />
          </div>

          <p className="mb-3 text-sm font-bold uppercase tracking-[0.28em] text-[#ffd84d]">
            Terminal Setup
          </p>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            Download SG8 Launcher
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
            Install the SG8 Launcher for promo video playback, display sync,
            heartbeat monitoring, and player launch controls.
          </p>
        </div>
      </section>

      <LauncherDownload />
    </main>
  );
};

export default Download;
