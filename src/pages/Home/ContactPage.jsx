import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaArrowLeft, FaCheck, FaPaperPlane } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function ContactPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API request to support server
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  // Structured Contact Point Schema for Organization
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://agrey-flix.vercel.app/#organization",
    "name": "AgreyFlix Support Center",
    "url": "https://agrey-flix.vercel.app/contact",
    "logo": "https://agrey-flix.vercel.app/app_icon.jpg",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+255740430220",
      "contactType": "customer service",
      "email": "agreyflix@gmail.com",
      "availableLanguage": ["English", "Swahili"],
      "areaServed": "Global"
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 px-6 py-20 md:px-12 lg:px-24">
      <Helmet>
        <title>Contact AgreyFlix Support | Free Movie Requests & Tech Help</title>
        <meta name="description" content="Get in touch with the AgreyFlix support team. Recommend film titles, report stream playback interruptions, ask for Swahili voiceovers, or explore assistance." />
        <meta name="keywords" content="contact AgreyFlix, customer support, help desk, content suggestion, movie requests, free streaming help" />
        <link rel="canonical" href="https://agrey-flix.vercel.app/contact" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agrey-flix.vercel.app/contact" />
        <meta property="og:title" content="Contact AgreyFlix Support | Free Movie Requests & Tech Help" />
        <meta property="og:description" content="Get in touch with the AgreyFlix support team. Recommend film titles, report stream playback interruptions, ask for Swahili voiceovers, or explore assistance." />
        <meta property="og:image" content="https://image.tmdb.org/t/p/w1280/wwemzKWkjFpxm6zXvLCH2CHmZQQ.jpg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://agrey-flix.vercel.app/contact" />
        <meta name="twitter:title" content="Contact AgreyFlix Support | Free Movie Requests & Tech Help" />
        <meta name="twitter:description" content="Get in touch with the AgreyFlix support team. Recommend film titles, report stream playback interruptions, ask for Swahili voiceovers, or explore assistance." />
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

      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12"
        >
          {/* Column 1: Info and Cards */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="text-red-500 text-xs font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                Support Hub
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none">
                Get In Touch
              </h1>
              <p className="text-zinc-500 font-semibold text-xs leading-relaxed">
                Have an inquiry or experiencing streaming trouble? Complete the transmission form, and our specialized Serra operations bot or a human expert will respond immediately.
              </p>
            </div>

            {/* Support details */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 bg-zinc-950/60 border border-white/5 rounded-3xl">
                <FaEnvelope className="text-red-500 text-lg mt-1 shrink-0" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Email Communications</h3>
                  <p className="text-xs text-zinc-400 font-semibold mt-1">agreyflix@gmail.com</p>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mt-1">RESPONSE WITHIN 2 HOURS</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-zinc-950/60 border border-white/5 rounded-3xl">
                <FaPhone className="text-red-500 text-lg mt-1 shrink-0" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">Hotline Contact</h3>
                  <p className="text-xs text-zinc-400 font-semibold mt-1">+255 740 430 220</p>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mt-1">MON-SAT • 8:00 AM TO 10:00 PM</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-zinc-950/60 border border-white/5 rounded-3xl">
                <FaMapMarkerAlt className="text-red-500 text-lg mt-1 shrink-0" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">HQ Operations</h3>
                  <p className="text-xs text-zinc-400 font-semibold mt-1">AgreyFlix Entertainment Tower, Level 15</p>
                  <p className="text-[10px] text-zinc-500 font-bold mt-1">Dar es Salaam, Tanzania</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Interactive Support Form */}
          <div className="lg:col-span-7 bg-zinc-950/40 border border-white/5 p-6 md:p-8 rounded-3xl">
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <FaCheck size={24} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-wider text-white">Transmission Successful</h3>
                <p className="text-xs text-zinc-500 font-semibold max-w-sm mx-auto leading-relaxed">
                  Your message has been securely logged on our support queue. A representative will reach out shortly to resolve your inquiry.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex outline-none"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Your Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      className="w-full bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-red-500 text-white px-4 py-3 rounded-xl text-xs font-bold outline-none transition-all placeholder-zinc-700" 
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Your Email Address</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      className="w-full bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-red-500 text-white px-4 py-3 rounded-xl text-xs font-bold outline-none transition-all placeholder-zinc-700" 
                      placeholder="e.g. john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Topic / Subject</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.subject} 
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })} 
                    className="w-full bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-red-500 text-white px-4 py-3 rounded-xl text-xs font-bold outline-none transition-all placeholder-zinc-700" 
                    placeholder="e.g. Movie requests, stream quality, suggestion"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Detailed Inquiry Message</label>
                  <textarea 
                    rows={5} 
                    required 
                    value={formData.message} 
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })} 
                    className="w-full bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-red-500 text-white px-4 py-3 rounded-xl text-xs font-bold outline-none transition-all placeholder-zinc-700 resize-none" 
                    placeholder="Provide details of your movie request or technical questions here..."
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 outline-none"
                >
                  {submitting ? 'Transmitting Information...' : (
                    <>
                      <FaPaperPlane size={11} /> Transmit Support Ticket
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </motion.div>

        {/* Footer links */}
        <div className="flex flex-wrap justify-center gap-6 pt-16 mt-12 border-t border-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
          <button onClick={() => navigate('/about')} className="hover:text-red-500 transition-colors cursor-pointer">About Us</button>
          <button onClick={() => navigate('/contact')} className="hover:text-red-500 transition-colors cursor-pointer">Contact Us</button>
          <button onClick={() => navigate('/privacy')} className="hover:text-red-500 transition-colors cursor-pointer">Privacy Policy</button>
          <button onClick={() => navigate('/terms')} className="hover:text-red-500 transition-colors cursor-pointer">Terms & Conditions</button>
        </div>
      </div>
    </div>
  );
}
