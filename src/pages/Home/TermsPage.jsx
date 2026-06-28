import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaFileContract, FaArrowLeft, FaGavel, FaExclamationTriangle, FaRegHandshake } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 px-6 py-20 md:px-12 lg:px-24">
      <Helmet>
        <title>Terms & Conditions | AgreyFlix User Agreement</title>
        <meta name="description" content="Review the Terms and Conditions of AgreyFlix. Understand acceptable streaming guidelines, user agreements, and legal definitions of use." />
        <meta name="keywords" content="terms and conditions, user agreement, free streaming, fair use, movie streaming terms" />
        <link rel="canonical" href="https://agrey-flix.vercel.app/terms" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agrey-flix.vercel.app/terms" />
        <meta property="og:title" content="Terms & Conditions | AgreyFlix User Agreement" />
        <meta property="og:description" content="Review the Terms and Conditions of AgreyFlix. Understand acceptable streaming guidelines, user agreements, and legal definitions of use." />
        <meta property="og:image" content="https://image.tmdb.org/t/p/w1280/wwemzKWkjFpxm6zXvLCH2CHmZQQ.jpg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://agrey-flix.vercel.app/terms" />
        <meta name="twitter:title" content="Terms & Conditions | AgreyFlix User Agreement" />
        <meta name="twitter:description" content="Review the Terms and Conditions of AgreyFlix. Understand acceptable streaming guidelines, user agreements, and legal definitions of use." />
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
              Legal Standard
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none">
              Terms & Conditions
            </h1>
            <p className="text-zinc-500 font-bold text-xs">
              Last updated: June 28, 2026 • AgreyFlix Legal Counsel & Compliance
            </p>
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-zinc-950/60 border border-white/5 rounded-3xl">
              <FaRegHandshake className="text-red-500 text-lg mb-3" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Acceptable Use</h3>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">
                Users must stream files legally and avoid commercial redistribution.
              </p>
            </div>
            <div className="p-5 bg-zinc-950/60 border border-white/5 rounded-3xl">
              <FaGavel className="text-red-500 text-lg mb-3" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Governing Law</h3>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">
                Disputes will be processed under standard corporate laws or local regulations.
              </p>
            </div>
            <div className="p-5 bg-zinc-950/60 border border-white/5 rounded-3xl">
              <FaExclamationTriangle className="text-red-500 text-lg mb-3" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Uptime Limits</h3>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">
                Uptime depends on upstream global media nodes and CDNs.
              </p>
            </div>
          </div>

          {/* Legal Text */}
          <div className="bg-zinc-950/40 border border-white/5 p-6 md:p-8 rounded-3xl space-y-8 leading-relaxed text-sm text-zinc-400 font-semibold">
            
            <section className="space-y-3">
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaFileContract className="text-red-500 text-sm shrink-0" /> 1. Agreement of Terms
              </h2>
              <p>
                By creating an account, browsing pages, initiating playback, or fetching digital media download assets from AgreyFlix, you verify that you are at least 18 years of age (or have explicit parental guidance) and fully accept these Terms & Conditions. If you disagree, you must immediately terminate your current web session.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaGavel className="text-red-500 text-sm shrink-0" /> 2. Acceptable Use Policy
              </h2>
              <p>
                AgreyFlix provides content strictly for individual personal usage. Sub-leasing, screen-casting to unauthorized public venues, decompiling download client files, scraping metadata API routes, or utilizing automated crawlers to harvest TMDB aggregations without written authorization represents a breach of this contract and will trigger immediate account suspension and IP blocks.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaExclamationTriangle className="text-red-500 text-sm shrink-0" /> 3. Limitation of Liability
              </h2>
              <p>
                AgreyFlix, its content directors, or tech operators can never be held responsible for server interruptions, streaming packet latency, network outages on third-party CDNs, database synchronization delays, or system notices triggered by standard browser settings. Entertainment options are provided "as-is" without explicit warranties.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaRegHandshake className="text-red-500 text-sm shrink-0" /> 4. Service Accessibility & Support
              </h2>
              <p>
                AgreyFlix is 100% free to access. There are no registration fees, monthly subscription rates, or hidden charges. Direct inquiries, feature recommendations, or technical suggestions can be sent to our support desk at <span className="text-white">agreyflix@gmail.com</span>.
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
