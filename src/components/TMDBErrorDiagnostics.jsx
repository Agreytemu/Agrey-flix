import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaWifi, FaSyncAlt, FaTools, FaCheckCircle } from 'react-icons/fa';

export default function TMDBErrorDiagnostics({ error, onRetry }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#060913] text-white font-sans" id="error-diagnostics-bg">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#111625] to-[#0b0e1a] rounded-3xl border border-white/5 p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glows */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Animated Big System Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
            <div className="w-20 h-20 bg-amber-500/15 border-2 border-amber-500/50 rounded-full flex items-center justify-center text-amber-500 text-3xl shadow-lg relative z-10 animate-bounce">
              {isOnline ? <FaTools /> : <FaWifi />}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight" id="error-diagnostics-title">
              {isOnline ? "Oops! The System is in Maintenance" : "Internet Connection Lost"}
            </h1>
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-black" id="error-diagnostics-sub">
              {isOnline ? "Server Synchronization Active" : "Network Disconnected"}
            </p>
          </div>

          {/* Details Card */}
          <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-6 text-left space-y-4">
            {isOnline ? (
              <>
                <p className="text-sm font-semibold text-zinc-300 leading-relaxed">
                  We are currently performing scheduled maintenance and optimizations on our central servers. All systems are being fine-tuned to ensure high-fidelity video playback, fast downloads, and real-time database indexing.
                </p>
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <FaCheckCircle className="text-emerald-500" /> Current Upgrades:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-400 font-medium">
                    <li>Migrating to low-latency edge servers.</li>
                    <li>Synchronizing live regional stream archives.</li>
                    <li>Upgrading video pipeline decoders.</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-zinc-300 leading-relaxed">
                  It feels like your device is currently disconnected from the internet. Please verify your active Wi-Fi network, cellular data configuration, or ISP routing status.
                </p>
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <FaWifi className="text-cyan-400" /> Troubleshooting Tips:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-400 font-medium">
                    <li>Toggle your Wi-Fi connection off and back on.</li>
                    <li>Verify other websites load successfully.</li>
                    <li>Check your internet gateway/router connectivity lamps.</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 w-full justify-center">
            {onRetry && (
              <button 
                onClick={onRetry}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-extrabold px-8 py-3.5 rounded-full transition-all active:scale-95 text-sm uppercase tracking-widest shadow-lg"
                id="error-diagnostics-retry-btn"
              >
                <FaSyncAlt className="text-xs" />
                Retry Connecting
              </button>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto text-center border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300 font-extrabold px-8 py-3.5 rounded-full text-sm uppercase tracking-widest transition-all"
              id="error-diagnostics-reload-btn"
            >
              Refresh App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
