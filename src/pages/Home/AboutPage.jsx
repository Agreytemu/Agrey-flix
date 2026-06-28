import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaFilm, FaTv, FaGlobe, FaArrowLeft, FaAward, FaUsers, FaDownload, FaBolt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function AboutPage() {
  const navigate = useNavigate();

  // Structured Data Schema for Organization and WebApplication
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://agrey-flix.vercel.app/#organization",
        "name": "AgreyFlix",
        "url": "https://agrey-flix.vercel.app",
        "logo": "https://agrey-flix.vercel.app/app_icon.jpg",
        "sameAs": [
          "https://twitter.com/AgreyFlix",
          "https://github.com/AgreyFlix"
        ],
        "description": "Premium cinematic entertainment streaming hub and TMDB aggregation server offering global films and local Swahili translations."
      },
      {
        "@type": "WebApplication",
        "@id": "https://agrey-flix.vercel.app/about/#webapp",
        "name": "AgreyFlix Web App",
        "url": "https://agrey-flix.vercel.app/about",
        "applicationCategory": "EntertainmentApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires JavaScript. Requires HTML5.",
        "author": {
          "@id": "https://agrey-flix.vercel.app/#organization"
        },
        "description": "Stream high-speed cloud content, multi-track translations, and enjoy lightning-fast downloads on AgreyFlix."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 px-6 py-20 md:px-12 lg:px-24">
      <Helmet>
        <title>About AgreyFlix | Unlimited Free Streaming Platform</title>
        <meta name="description" content="Discover the story behind AgreyFlix, the ultimate destination for free global streaming, Swahili translations, and lightning-fast content delivery." />
        <meta name="keywords" content="about AgreyFlix, free movies, Swahili series, stream movies online, offline downloads, high quality streaming" />
        <link rel="canonical" href="https://agrey-flix.vercel.app/about" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agrey-flix.vercel.app/about" />
        <meta property="og:title" content="About AgreyFlix | Unlimited Free Streaming Platform" />
        <meta property="og:description" content="Discover the story behind AgreyFlix, the ultimate destination for free global streaming, Swahili translations, and lightning-fast content delivery." />
        <meta property="og:image" content="https://image.tmdb.org/t/p/w1280/wwemzKWkjFpxm6zXvLCH2CHmZQQ.jpg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://agrey-flix.vercel.app/about" />
        <meta name="twitter:title" content="About AgreyFlix | Unlimited Free Streaming Platform" />
        <meta name="twitter:description" content="Discover the story behind AgreyFlix, the ultimate destination for free global streaming, Swahili translations, and lightning-fast content delivery." />
        <meta name="twitter:image" content="https://image.tmdb.org/t/p/w1280/wwemzKWkjFpxm6zXvLCH2CHmZQQ.jpg" />

        {/* Schema Markup */}
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </Helmet>

      {/* Navigation Link to Home */}
      <button 
        onClick={() => navigate('/home')} 
        className="mb-8 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex outline-none"
      >
        <FaArrowLeft /> Back to Home
      </button>

      {/* Main Content Wrap */}
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-12"
        >
          {/* Main H1 Title */}
          <div className="space-y-4 text-center md:text-left">
            <span className="text-red-500 text-xs font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
              Cinematic Revolution
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none">
              About Agrey<span className="text-red-500">Flix</span>
            </h1>
            <p className="text-zinc-500 font-semibold text-sm max-w-2xl leading-relaxed">
              AgreyFlix is an ultra-modern free web platform dedicated to cinematic excellence. By bridging global entertainment with powerful localization options, we provide a lightning-fast, high-definition, and buffer-free streaming environment.
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: FaFilm, count: '10,000+', label: 'Global Movies' },
              { icon: FaTv, count: '3,500+', label: 'TV Series' },
              { icon: FaGlobe, count: '20+', label: 'Languages' },
              { icon: FaUsers, count: '100K+', label: 'Active Users' }
            ].map((stat, i) => (
              <div key={i} className="bg-zinc-950/60 border border-white/5 p-5 rounded-3xl text-center">
                <stat.icon className="text-red-500 text-xl mx-auto mb-3" />
                <h3 className="text-xl font-black text-white">{stat.count}</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Detailed Narrative Section */}
          <div className="space-y-8 bg-zinc-950/40 border border-white/5 p-8 rounded-3xl leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaAward className="text-red-500 shrink-0" /> Our Core Mission
              </h2>
              <p className="text-sm text-zinc-400 font-semibold">
                At AgreyFlix, our mission is to break cultural and linguistic barriers in cinema. We strive to provide movie enthusiasts with a seamless entertainment system equipped with lightning-fast streaming speeds, custom playlists, robust device synchronization, and dedicated localized subtitles—including professional Swahili voice-overs and translation files.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaBolt className="text-red-500 shrink-0" /> Ultra-Optimized Streaming Engine
              </h2>
              <p className="text-sm text-zinc-400 font-semibold">
                Our architecture relies on highly efficient content-delivery networks (CDNs) and state-of-the-art server-side caching. Our players integrate dynamically with adaptive video bitrate rendering algorithms (HLS), guaranteeing bufferless playback whether you are streaming from a desktop workstation or a mobile browser on low bandwidth.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FaDownload className="text-red-500 shrink-0" /> Multi-Threaded Offline Downloader
              </h2>
              <p className="text-sm text-zinc-400 font-semibold">
                For individuals traveling or operating in areas with unstable internet connectivity, AgreyFlix implements an intelligent offline video acquisition protocol. Users can trigger multi-threaded parallel fragment requests to download high-speed content files ready for offline viewing on iOS, Android, and personal computer architectures.
              </p>
            </section>
          </div>

          {/* Internal Linking Trust CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-red-600/5 border border-red-500/10 rounded-3xl">
            <div className="text-center sm:text-left">
              <h3 className="text-sm font-black text-white uppercase tracking-wide">Have any questions or suggestions?</h3>
              <p className="text-[11px] text-zinc-500 font-semibold mt-1">Our support staff is operating 24/7 to guarantee pristine service uptime.</p>
            </div>
            <button 
              onClick={() => navigate('/contact')}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest cursor-pointer shadow-md shadow-red-600/10 shrink-0 transition-all outline-none"
            >
              Contact Support
            </button>
          </div>

          {/* Footer of trust pages */}
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
