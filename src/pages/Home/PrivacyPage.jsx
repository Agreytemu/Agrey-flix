import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaArrowLeft, FaCookie, FaDatabase, FaLock, FaUserSecret } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 px-6 py-20 md:px-12 lg:px-24">
      <Helmet>
        <title>Privacy Policy | AgreyFlix Secure Streaming Guarantee</title>
        <meta name="description" content="Read the AgreyFlix Privacy Policy. Understand how we collect user telemetry, protect cloud session tokens, store preference databases, and secure your personalized settings." />
        <meta name="keywords" content="privacy policy, data collection, cookie statement, user account protection, streaming logs" />
        <link rel="canonical" href="https://agrey-flix.vercel.app/privacy" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agrey-flix.vercel.app/privacy" />
        <meta property="og:title" content="Privacy Policy | AgreyFlix Secure Streaming Guarantee" />
        <meta property="og:description" content="Read the AgreyFlix Privacy Policy. Understand how we collect user telemetry, protect cloud session tokens, store preference databases, and secure your personalized settings." />
        <meta property="og:image" content="https://image.tmdb.org/t/p/w1280/wwemzKWkjFpxm6zXvLCH2CHmZQQ.jpg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://agrey-flix.vercel.app/privacy" />
        <meta name="twitter:title" content="Privacy Policy | AgreyFlix Secure Streaming Guarantee" />
        <meta name="twitter:description" content="Read the AgreyFlix Privacy Policy. Understand how we collect user telemetry, protect cloud session tokens, store preference databases, and secure your personalized settings." />
        <meta name="twitter:image" content="https://image.tmdb.org/t/p/w1280/wwemzKWkjFpxm6zXvLCH2CHmZQQ.jpg" />
      </Helmet>

      {/* Navigation Link to Home */}
      <button 
        onClick={() => navigate('/home')} 
        className="mb-8 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex outline-none"
      >
        <FaArrowLeft /> Back to Home
      </button>

      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-10"
        >
          {/* Main Headers */}
          <div className="space-y-4">
            <span className="text-red-500 text-xs font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
              Legal Operations
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none">
              Privacy Policy
            </h1>
            <p className="text-zinc-500 font-bold text-xs">
              Last updated: June 28, 2026 • AgreyFlix Network Trust & Safety Team
            </p>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-zinc-950/60 border border-white/5 rounded-3xl">
              <FaLock className="text-red-500 text-lg mb-3" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Full Encryption</h3>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">
                All data, passwords, and sessions are encrypted using secure SSL/TLS.
              </p>
            </div>
            <div className="p-5 bg-zinc-950/60 border border-white/5 rounded-3xl">
              <FaUserSecret className="text-red-500 text-lg mb-3" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">No External Sales</h3>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">
                We never rent, sell, or trade user contact logs or history.
              </p>
            </div>
            <div className="p-5 bg-zinc-950/60 border border-white/5 rounded-3xl">
              <FaCookie className="text-red-500 text-lg mb-3" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Essential Cookies Only</h3>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">
                Cookies are strictly used to maintain player playback positions.
              </p>
            </div>
          </div>

          {/* Policy Text */}
          <div className="bg-zinc-950/40 border border-white/5 p-6 md:p-8 rounded-3xl space-y-8 leading-relaxed text-sm text-zinc-400 font-semibold">
            
            <section className="space-y-3">
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaDatabase className="text-red-500 text-sm shrink-0" /> 1. Data Collection Parameters
              </h2>
              <p>
                To provide a high-fidelity media distribution system, AgreyFlix tracks telemetry data related to your stream configurations. This includes:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-500 text-xs">
                <li>Personal Account Identifiers: Display names, email addresses, and security passwords gathered at authentication.</li>
                <li>Device Parameters: Operating systems, viewport configurations, and network speeds to adjust streaming quality and optimize media delivery.</li>
                <li>Watchlist & History telemetry: Your progress logs (playback time and saved media lists) stored securely inside database collections.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaLock className="text-red-500 text-sm shrink-0" /> 2. Security Safeguards
              </h2>
              <p>
                We implement state-of-the-art administrative protocols to prevent data interception or leaks. Database clusters are managed within secure container ecosystems with continuous rate limit protection. All token signatures utilize secure cryptographic handshakes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaCookie className="text-red-500 text-sm shrink-0" /> 3. Cookie Declarations
              </h2>
              <p>
                AgreyFlix stores local preferences, theme values, user onboarding guides, and active session tokens using standard HTML5 storage or minimal tracking cookies. By browsing the web applet, you consent to utilizing these essential diagnostic scripts.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaShieldAlt className="text-red-500 text-sm shrink-0" /> 4. GDPR & CCPA Compliance
              </h2>
              <p>
                We respect your personal sovereignty over data. Every user can delete, purge, or request a complete backup extraction of their database metrics. Contact our engineering team at <span className="text-white">agreyflix@gmail.com</span> to execute a diagnostic purge.
              </p>
            </section>
          </div>

          {/* Footer links */}
          <div className="flex flex-wrap justify-center gap-6 pt-6 border-t border-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
            <button onClick={() => navigate('/about')} className="hover:text-red-500 transition-colors cursor-pointer">About Us</button>
            <button onClick={() => navigate('/contact')} className="hover:text-red-500 transition-colors cursor-pointer">Contact Us</button>
            <button onClick={() => navigate('/privacy')} className="hover:text-red-500 transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-red-500 transition-colors cursor-pointer">Terms & Conditions</button>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
