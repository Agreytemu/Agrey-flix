import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  FaAndroid, FaDownload, FaArrowLeft, FaShieldAlt, 
  FaInfoCircle, FaCheckCircle, FaExclamationTriangle, 
  FaArrowRight, FaClock, FaHdd, FaHashtag, FaExternalLinkAlt 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function AppDownloadPage() {
  const navigate = useNavigate();
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [apkList, setApkList] = useState([]);
  const [selectedApk, setSelectedApk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/apps/apk-list')
      .then(res => {
        if (!res.ok) throw new Error("Server responded with error status");
        return res.json();
      })
      .then(data => {
        if (data.success && data.apks && data.apks.length > 0) {
          setApkList(data.apks);
          setSelectedApk(data.apks[0]); // Default to latest version
        }
      })
      .catch(err => {
        console.error("Error loading dynamic APK list:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // App Metadata Details resolved from the detected APK list (No mockup hardcoded default fallbacks)
  const appVersion = selectedApk ? selectedApk.version : null;
  const appSize = selectedApk ? selectedApk.size : null;
  const appUpdated = selectedApk ? selectedApk.updated : null;
  const appSHA = selectedApk ? selectedApk.sha : null;
  const appUrl = selectedApk ? selectedApk.url : null;
  const appFilename = selectedApk ? selectedApk.filename : null;

  const installationSteps = [
    {
      title: "1. Download the APK file",
      desc: "Click the secure button below to fetch the verified AgreyFlix APK package directly to your Android device storage.",
      icon: FaDownload,
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      title: "2. Allow 'Unknown Sources'",
      desc: "For security, Android blocks third-party APKs by default. Go to Settings > Apps > Chrome (or your browser) > Install Unknown Apps and toggle 'Allow from this source' to ON.",
      icon: FaShieldAlt,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      title: "3. Complete Installation",
      desc: "Open your Downloads directory using any file manager, select the downloaded 'agreyflix.apk' file, and tap 'Install' when prompted.",
      icon: FaCheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      title: "4. Launch & Stream",
      desc: "Open the newly added AgreyFlix app from your home screen or application list, accept runtime permissions, and start streaming unlimited movies instantly!",
      icon: FaArrowRight,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    }
  ];

  const appFeatures = [
    { title: "No Browser Clutter", desc: "Launches in true immersive fullscreen without browser search bars, tabs, or address bars." },
    { title: "Sleek Load Progress", desc: "Thin crimson high-fidelity top progress bars guide your layout transitions flawlessly." },
    { title: "Media & Audio Integration", desc: "Stream directly with fully optimized external media pipes (like recommended downloader 1DM)." },
    { title: "Local Cache Pipeline", desc: "Maintains active session profiles and local cache configurations securely." },
    { title: "Double-Tap Back Lock", desc: "Prevents accidental application closing with intuitive prompt verification before exit." }
  ];

  const handleApkDownload = () => {
    setDownloadStarted(true);

    // Point to the selected dynamic APK path inside the public folder
    const link = document.createElement('a');
    link.href = appUrl;
    link.download = appFilename;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup DOM reference
    document.body.removeChild(link);

    // Reset indicator after 5 seconds
    setTimeout(() => {
      setDownloadStarted(false);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 px-6 py-20 md:px-12 lg:px-24">
      <Helmet>
        <title>Download AgreyFlix Android App | Official Stable APK</title>
        <meta name="description" content="Download the official AgreyFlix Android App. Experience buffer-free streaming, fullscreen immersive display, Swahili translations, and secure downloads." />
        <meta name="keywords" content="download agreyflix, agreyflix apk, android streaming app, free movie apk" />
        <link rel="canonical" href="https://agrey-flix.vercel.app/download-app" />
      </Helmet>

      {/* Navigation Link to Home */}
      <button 
        onClick={() => navigate('/home')} 
        className="mb-8 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex outline-none"
      >
        <FaArrowLeft /> Back to Home
      </button>

      {/* Main Content Wrap */}
      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12"
        >
          {/* Left Column: Hero Callout & Download Controller */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <span className="text-red-500 text-xs font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <FaAndroid /> Native Android App
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">
                Agrey<span className="text-red-500 font-black">Flix</span> on Your Phone
              </h1>
              <p className="text-zinc-400 font-medium text-sm leading-relaxed">
                Unlock the complete, immersive cinematic experience on your Android smartphone. Get the native wrapper featuring secure file uploads, media player hooks, customizable permission controllers, and lighting-fast interface processing.
              </p>
            </div>

            {/* Premium App Presentation Card */}
            <div className="bg-zinc-950 border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/25 transition-all duration-500" />
              
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest animate-pulse">Calculating physical binary details...</p>
                </div>
              ) : apkList.length === 0 ? (
                <div className="relative z-10 text-center py-6 flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500">
                    <FaExclamationTriangle size={24} />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">No APK Packages Found</h3>
                    <p className="text-zinc-500 text-xs leading-relaxed font-semibold">
                      Currently, there are no actual <code>.apk</code> packages inside the server's <code>/public</code> directory. To populate this list, please upload your production-compiled APK files directly to the public folder.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                    {/* Custom Vector Launcher Art */}
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-red-600 to-red-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/30 shrink-0 transform group-hover:scale-105 transition-transform">
                      <FaAndroid className="text-white text-5xl animate-pulse" />
                    </div>

                    <div className="space-y-1.5 text-center sm:text-left flex-1">
                      <h3 className="text-lg font-black text-white uppercase tracking-wider">AgreyFlix Mobile Companion</h3>
                      <p className="text-zinc-500 text-xs font-semibold">Official Google AI Studio Secure Distribution</p>
                      
                      {/* File Metadata Tags */}
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                        <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                          <FaHashtag className="text-red-500" /> {appVersion}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                          <FaHdd className="text-amber-500" /> {appSize}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                          <FaClock className="text-emerald-500" /> {appUpdated}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic APK Version Selection Panel (If multiple stubs detected in public directory) */}
                  {apkList.length > 1 && (
                    <div className="mt-6 pt-5 border-t border-white/5 relative z-10">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-red-500 mb-2.5">
                        Multiple Live Packages Detected:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {apkList.map((apk) => {
                          const isSelected = selectedApk && selectedApk.filename === apk.filename;
                          return (
                            <button
                              key={apk.filename}
                              onClick={() => setSelectedApk(apk)}
                              className={`px-4 py-3 rounded-2xl border text-left transition-all relative flex flex-col justify-center cursor-pointer overflow-hidden outline-none ${
                                isSelected
                                  ? 'bg-gradient-to-r from-red-950/40 to-[#0c0c0d] border-red-500/40 text-white shadow-lg shadow-red-500/5'
                                  : 'bg-[#080809] border-white/5 text-zinc-400 hover:bg-white/5 hover:border-white/10 hover:text-white'
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute top-2.5 right-3 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              )}
                              <span className="text-xs font-black tracking-wide truncate">
                                {apk.version}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500 mt-1">
                                {apk.size} • {apk.updated}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Main Download Call To Action */}
                  <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      onClick={handleApkDownload}
                      disabled={downloadStarted}
                      className={`w-full sm:w-auto px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-extrabold uppercase tracking-widest text-xs transition-all shadow-xl cursor-pointer ${
                        downloadStarted 
                          ? 'bg-emerald-600 text-white shadow-emerald-600/10' 
                          : 'bg-red-600 hover:bg-red-500 hover:shadow-red-600/20 text-white shadow-red-600/10'
                      }`}
                    >
                      <FaDownload className={downloadStarted ? "animate-bounce" : ""} />
                      {downloadStarted ? "Downloading App..." : "Download Official APK"}
                    </button>

                    <div className="flex flex-col items-center sm:items-end text-[10px] font-mono text-zinc-500">
                      <span className="flex items-center gap-1 text-emerald-500 font-semibold uppercase tracking-wider mb-0.5">
                        <FaShieldAlt /> 100% Secure File
                      </span>
                      <span className="truncate max-w-[200px]">{appSHA}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Warning / Requirements Box */}
            <div className="bg-amber-500/5 border border-amber-500/15 p-5 rounded-2xl flex items-start gap-4">
              <FaExclamationTriangle className="text-amber-500 text-xl shrink-0 mt-1" />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Install Warning Notice</h4>
                <p className="text-zinc-500 text-xs leading-relaxed font-semibold">
                  Because this application is distributed directly as an APK outside Google Play Store, Android requires manual installation permission. We guarantee the APK is completely safe, signed, and contains zero malicious scripts or analytics trackers.
                </p>
              </div>
            </div>

            {/* List of features */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest border-l-2 border-red-500 pl-3">App Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appFeatures.map((feat, i) => (
                  <div key={i} className="bg-zinc-950 border border-white/5 p-4 rounded-xl space-y-1">
                    <h4 className="text-xs font-bold text-white tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" /> {feat.title}
                    </h4>
                    <p className="text-zinc-500 text-xs leading-relaxed font-semibold">{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Installation Tutorial Checklist */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-l-2 border-red-500 pl-3">How To Install APK</h3>
            
            <div className="space-y-4">
              {installationSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div 
                    key={idx} 
                    className="bg-zinc-950 border border-white/5 p-5 rounded-2xl flex gap-4 hover:border-white/10 transition-colors"
                  >
                    <div className={`w-10 h-10 ${step.bgColor} ${step.color} rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon className="text-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">{step.title}</h4>
                      <p className="text-zinc-500 text-xs leading-relaxed font-semibold">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Helpful Quick Tip Footer */}
            <div className="bg-zinc-950 border border-white/5 p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <FaInfoCircle className="text-red-500" /> Need Help?
              </h4>
              <p className="text-zinc-500 text-xs leading-relaxed font-semibold">
                If the application throws an installation error, verify that you have downloaded the complete file size. If the download completes but fails to install, try deleting any legacy versions of AgreyFlix from your device first.
              </p>
              <button 
                onClick={() => navigate('/contact')}
                className="text-red-500 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1 hover:text-red-400 outline-none mt-2"
              >
                Contact Support <FaExternalLinkAlt className="text-[10px]" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
