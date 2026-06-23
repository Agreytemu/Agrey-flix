import React, { useState, useEffect } from 'react';
import { FaWifi, FaTools, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

export default function StreamingErrorDiagnostics({ error, mediaId, type, season, episode }) {
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

  if (!isOnline) {
    return (
      <div className="mt-4 p-6 bg-[#111420]/90 border border-white/5 rounded-3xl text-left space-y-4 shadow-xl font-sans" id="streaming-error-offline-card">
        <div className="flex items-center gap-3 text-red-500 font-bold border-b border-white/5 pb-3">
          <FaWifi className="text-xl animate-pulse shrink-0" />
          <span className="text-base tracking-tight text-white">Connection Interrupted</span>
        </div>
        <p className="text-sm text-zinc-400 font-medium leading-relaxed">
          Your internet connection appears to be offline. Please verify your network settings, active subscription, or router configuration and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-6 bg-[#111420]/90 border border-white/5 rounded-3xl text-left space-y-5 shadow-xl font-sans" id="streaming-error-maintenance-card">
      <div className="flex items-center gap-3 text-amber-500 font-bold border-b border-white/5 pb-3">
        <FaTools className="text-xl shrink-0" />
        <span className="text-base tracking-tight text-white">Oops! The System is in Maintenance</span>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-zinc-300 font-medium leading-relaxed">
          The video server or selected streaming network is currently undergoing scheduled system maintenance to enhance our playback infrastructure and delivery speeds.
        </p>
        <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
          Our engineering team is actively performing technical upgrades to bring back high-fidelity server feeds. Thank you for your patience and support as we optimize your streaming quality.
        </p>
      </div>

      <div className="space-y-2 pt-1">
        <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
          <FaCheckCircle className="text-emerald-500" /> Maintenance Scope details:
        </h4>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-zinc-400 font-medium leading-relaxed">
          <li>Calibrating network routing tables for low-latency playback.</li>
          <li>Optimizing active server streams to support high simultaneous connections.</li>
          <li>Securing robust connection proxies across server regions.</li>
        </ul>
      </div>
    </div>
  );
}
