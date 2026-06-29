import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, TrendingUp, ShieldAlert, ShieldCheck, 
  BellRing, Activity, Database, UserCheck, RefreshCw, Play, 
  ArrowRight, Cpu, Layers, Globe, Search, FileText, AlertTriangle, Check, Copy, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseService } from '../utils/supabaseService';

export default function SerraPanel({ 
  users = [], 
  reports = [], 
  servers = [], 
  tiktokVideos = [], 
  notifications = [], 
  adminLogs = [],
  initialTab = 'chat'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [messages, setMessages] = useState([
    { 
      role: 'model', 
      content: "Hello Administrator. I am SERRA, your advanced operational intelligence assistant. I have synthesized current analytics, server status, security audits, and subscriber registries. How can I assist you in managing AgreyFlix today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  // Content Assistant Tool States
  const [contentTitle, setContentTitle] = useState('');
  const [contentPromptType, setContentPromptType] = useState('description');
  const [contentResult, setContentResult] = useState('');
  const [contentLoading, setContentLoading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Notification Generator Tool States
  const [notifMovie, setNotifMovie] = useState('');
  const [notifAudience, setNotifAudience] = useState('all');
  const [notifResult, setNotifResult] = useState({ title: '', body: '' });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifStatus, setNotifStatus] = useState('');

  // Security Audit Scan State
  const [securityScanResult, setSecurityScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  // Smart Commands AI Tool States
  const [commandResult, setCommandResult] = useState('');
  const [commandLoading, setCommandLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState('');

  const commandRecipes = [
    {
      id: 'competitor',
      title: 'Competitive Synthesis',
      description: 'Run deep synthesis comparing AgreyFlix user streaming patterns against Netflix & Prime Video strategies.',
      prompt: 'Execute a thorough high-level comparative synthesis. Compare AgreyFlix streaming performance, user demographics, and content delivery against global standards like Netflix and Amazon Prime Video. Outline exact action items to gain user engagement and market share.'
    },
    {
      id: 'newsletter',
      title: 'Weekly Feature Newsletter',
      description: 'Draft a highly engaging, professional promotional weekly newsletter featuring newly added blockbuster series.',
      prompt: 'Draft an eloquent, user-engagement promotional weekly newsletter. Highlight our top series, use highly engaging descriptive prose to increase active watch time, and encourage users to invite their friends to join AgreyFlix.'
    },
    {
      id: 'dispute',
      title: 'Movie Request Responder',
      description: 'Draft a support response replying to user movie requests or Swahili translation feedback.',
      prompt: 'Compose an empathetic, high-quality, professional customer support email template replying to a user requesting a new movie or Swahili translation. Be respectful, outline our release schedules, and invite further feedback.'
    },
    {
      id: 'scaling',
      title: 'Edge Network Scaling Audit',
      description: 'Analyze potential CDN latency spikes and outline edge caching configuration recipes.',
      prompt: 'Analyze simulated video streaming cache hit ratios and CDN edge latency spikes. Generate a detailed, clean optimization checklist recommending next-generation video streaming scaling protocols.'
    },
    {
      id: 'pentest',
      title: 'Security Penetration Plan',
      description: 'Generate an offensive cyber security pen-testing assessment based on modern cloud architectures.',
      prompt: 'Generate an offensive cybersecurity penetration testing strategy. Simulate vulnerabilities related to JWT authorization bypasses, SQL injection attempts, and API route rate limiters, providing detailed secure resolution recipes.'
    }
  ];

  const handleRunCommandRecipe = async (recipe) => {
    setSelectedRecipe(recipe.id);
    setCommandLoading(true);
    setCommandResult('');
    try {
      const response = await fetch('/api/admin/serra/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: recipe.prompt }],
          context: compileSystemContext()
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCommandResult(data.text);
    } catch (err) {
      setCommandResult(`Command Execution Failed: ${err.message}`);
    } finally {
      setCommandLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Retrieve security log telemetry from localStorage
  const getSecurityLogs = () => {
    try {
      const saved = localStorage.getItem('agreyflix_security_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  // Compile unified system context payload for Gemini
  const compileSystemContext = () => {
    const secLogs = getSecurityLogs();
    return {
      totalUsersCount: users.length,
      activeSubscribersCount: users.filter(u => u.preferences_set || u.watchlist?.length > 0).length,
      newRegistrationsSample: users.slice(0, 10).map(u => ({ email: u.email, created_at: u.created_at })),
      serversStatus: servers.map(s => ({ name: s.name, status: s.status, latency: s.latency })),
      pendingReportsCount: reports.filter(r => r.status === 'pending').length,
      reportsSample: reports.slice(0, 10).map(r => ({ title: r.title, type: r.type, status: r.status, details: r.details })),
      trendingVideosCount: tiktokVideos.length,
      notificationsBroadcasted: notifications.slice(0, 5).map(n => ({ title: n.title, message: n.message })),
      localSecurityLogsCount: secLogs.length,
      securityLogsSample: secLogs.slice(0, 20),
      recentAdminActions: adminLogs.slice(0, 10)
    };
  };

  // Plain Text Sanitizer and Link Parser to follow user's strict formatting constraints
  const renderCleanMessageText = (text) => {
    if (!text) return '';
    
    // Strip out all markdown symbols like #, *, -, and typical bullet lists
    let cleanText = text
      .replace(/^#+\s+/gm, '') // remove hash titles
      .replace(/\*\*/g, '') // remove bolding **
      .replace(/^\s*[-*•]\s+/gm, '   ') // replace bullet marks with gentle indents
      .replace(/`/g, ''); // remove code blocks
      
    // Detect URLs and internal paths (like /reset-password or /) and make them clean clickable visual badges
    const parts = cleanText.split(/(\bhttps?:\/\/\S+|\/reset-password\b)/gi);
    
    return parts.map((part, i) => {
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-red-500 hover:text-red-400 hover:underline font-bold transition-all mx-1 inline-flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20"
          >
            {part}
          </a>
        );
      }
      if (part === '/reset-password') {
        return (
          <a 
            key={i} 
            href={part} 
            className="bg-red-600/20 hover:bg-red-600/35 text-red-400 border border-red-500/25 px-2.5 py-1 rounded-xl font-black transition-all mx-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider"
          >
            Password Reset Portal
          </a>
        );
      }
      return part;
    });
  };

  // Handle Chat Submissions
  const handleSendChat = async (textToSend) => {
    const prompt = textToSend || input;
    if (!prompt.trim() || loading) return;

    setError('');
    const newMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/serra/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newMsg],
          context: compileSystemContext()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to communicate with Serra AI.");
      }

      setMessages(prev => [...prev, { role: 'model', content: data.text }]);
    } catch (err) {
      setError(err.message || 'Connecting with Serra brain timed out.');
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: `⚠️ [System Exception] I was unable to process this request. Ensure that your GEMINI_API_KEY is configured correctly in the Secrets panel.\n\nError: ${err.message}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Content AI tool trigger
  const handleContentToolAction = async () => {
    if (!contentTitle.trim() || contentLoading) return;
    setContentLoading(true);
    setContentResult('');
    setCopiedText(false);

    const promptsMap = {
      description: `Generate a premium cinematic description for a movie titled "${contentTitle}". Focus on making it engaging, mysterious, and perfect for a high-fidelity streaming interface.`,
      seo: `Generate 3 distinct SEO Titles and 3 Meta Descriptions optimized for Google search keywords regarding the streaming release of "${contentTitle}".`,
      tags: `Suggest a comprehensive set of categories, genre tags, and thematic descriptors for the movie "${contentTitle}" to optimize AgreyFlix recommenders.`,
      similar: `Analyze the thematic elements of "${contentTitle}" and suggest 5 similar movies or shows that we should cross-promote on our home banner.`
    };

    try {
      const response = await fetch('/api/admin/serra/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: promptsMap[contentPromptType] }],
          context: { targetMovie: contentTitle }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setContentResult(data.text);
    } catch (err) {
      setContentResult(`Failed to generate content: ${err.message}`);
    } finally {
      setContentLoading(false);
    }
  };

  // Notification Generator trigger
  const handleGenerateNotification = async () => {
    if (!notifMovie.trim() || notifLoading) return;
    setNotifLoading(true);
    setNotifStatus('');
    setNotifResult({ title: '', body: '' });

    const prompt = `Create a professional push notification text celebrating the release of "${notifMovie}".
Output your result strictly as a valid JSON object matching this schema so that I can parse it programmatically:
{
  "title": "Short Hype Title with Emojis",
  "body": "Exciting, high-CTR notification text describing the movie and inviting them to watch."
}`;

    try {
      const response = await fetch('/api/admin/serra/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context: { targetMovie: notifMovie }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Attempt parsing JSON from markdown response safely
      let parsed = { title: `New Movie Release! 🎬`, body: `Watch "${notifMovie}" now streaming in Full HD on AgreyFlix!` };
      try {
        const text = data.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn("Failed parsing exact notification JSON, using raw text fallback", e);
        parsed.body = data.text;
      }

      setNotifResult(parsed);
    } catch (err) {
      setNotifResult({ title: 'Generation Failed', body: err.message });
    } finally {
      setNotifLoading(false);
    }
  };

  // Broadcast generated notification to Supabase / subscribers
  const handlePublishNotification = async () => {
    if (!notifResult.title || !notifResult.body) return;
    setNotifLoading(true);
    setNotifStatus('');

    try {
      // Direct integration into our verified Supabase notifications system
      await supabaseService.sendNotification(
        notifResult.title,
        notifResult.body,
        'update',
        notifAudience
      );
      
      // Dispatch a local custom event to update list states
      window.dispatchEvent(new Event('newNotification'));
      setNotifStatus('success');
    } catch (err) {
      console.error(err);
      setNotifStatus('error');
    } finally {
      setNotifLoading(false);
    }
  };

  // Run security scanner simulation
  const runSecurityAudit = async () => {
    if (scanning) return;
    setScanning(true);
    setSecurityScanResult(null);

    const prompt = `Scan today's security metrics and local audit logs. Generate a highly specific report identifying warnings, potential risks, and recommended administrative action items. Keep the response compact and beautifully formatted.`;

    try {
      const response = await fetch('/api/admin/serra/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context: compileSystemContext()
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSecurityScanResult(data.text);
    } catch (err) {
      setSecurityScanResult(`Threat assessment failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  // Copy text helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // suggested actions handler
  const suggestedActions = [
    { text: "Analyze today's performance", icon: TrendingUp },
    { text: "Show user growth", icon: UserCheck },
    { text: "Analyze trending content", icon: Play },
    { text: "Check security issues", icon: ShieldAlert },
    { text: "Generate notification", icon: BellRing }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* HEADER TABS */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0D0D0D]/80 backdrop-blur-md gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-600/20">
              <Bot className="text-white w-5.5 h-5.5" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0A0A0A] rounded-full animate-ping" />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0A0A0A] rounded-full" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              {activeTab === 'chat' && 'AI Chat Ops'}
              {activeTab === 'analytics' && 'Analytics Intel'}
              {activeTab === 'content' && 'Content Studio'}
              {activeTab === 'security' && 'Security Shield'}
              {activeTab === 'notifications' && 'Notification Gen'}
              {activeTab === 'commands' && 'Smart Commands AI'}
              <span className="text-[9px] bg-red-600/15 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-normal uppercase">SERRA AI</span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-semibold">AgreyFlix Admin Standalone Operations Page</p>
          </div>
        </div>
      </div>

      {/* CORE WRAPPER */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* MODULE 1: AI CHAT DIRECT OPERATIONS */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full bg-[#080808]">
            {/* MESSAGES CONTAINER */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 hide-scrollbar">
              {messages.map((m, idx) => {
                const isModel = m.role === 'model';
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx}
                    className={`flex gap-3.5 max-w-[85%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      isModel 
                        ? 'bg-[#121212] border-white/10 text-red-500' 
                        : 'bg-red-600/10 border-red-500/20 text-red-500'
                    }`}>
                      {isModel ? <Bot size={14} /> : <span className="text-xs font-black">AD</span>}
                    </div>
                    <div className={`p-4 rounded-3xl text-xs leading-relaxed font-semibold ${
                      isModel 
                        ? 'bg-[#0E0E0E] text-zinc-300 border border-white/5 rounded-tl-none' 
                        : 'bg-red-600 text-white rounded-tr-none shadow-md shadow-red-600/10'
                    }`}>
                      <div className="whitespace-pre-wrap select-text">{renderCleanMessageText(m.content)}</div>
                    </div>
                  </motion.div>
                );
              })}

              {loading && (
                <div className="flex gap-3.5 max-w-[80%] mr-auto">
                  <div className="w-8 h-8 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center text-red-500 animate-spin">
                    <RefreshCw size={14} />
                  </div>
                  <div className="p-4 bg-[#0E0E0E] border border-white/5 rounded-3xl rounded-tl-none flex items-center gap-3">
                    <span className="text-zinc-500 text-xs font-semibold animate-pulse">SERRA is analyzing data queries...</span>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce delay-200" />
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce delay-300" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* QUICK SUGGESTED ACTION LINKS */}
            <div className="px-6 py-2.5 bg-[#090909] border-t border-white/5 flex gap-2 overflow-x-auto hide-scrollbar shrink-0">
              {suggestedActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSendChat(action.text)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#121212] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white transition-all whitespace-nowrap cursor-pointer active:scale-95"
                  >
                    <Icon size={10} className="text-red-500" />
                    {action.text}
                  </button>
                );
              })}
            </div>

            {/* INPUT FOOTER */}
            <div className="p-4 bg-[#0D0D0D] border-t border-white/5 shrink-0 flex items-center gap-3">
              <input
                type="text"
                placeholder="Ask Serra to analyze user growth, check server latencies, or generate marketing copy..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                disabled={loading}
                className="flex-1 bg-black/40 border border-white/5 focus:border-red-500 rounded-2xl px-5 py-3.5 text-xs text-white focus:outline-none transition-all placeholder-zinc-600 font-semibold"
              />
              <button
                onClick={() => handleSendChat()}
                disabled={loading || !input.trim()}
                className="w-11 h-11 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-40 shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {/* MODULE 2: ANALYTICS INTELLIGENCE */}
        {activeTab === 'analytics' && (
          <div className="p-6 overflow-y-auto h-full space-y-6 hide-scrollbar bg-[#080808]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#0E0E0E] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Total Users</span>
                  <p className="text-2xl font-black text-white mt-1">{users.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center text-red-500"><Database size={18} /></div>
              </div>
              <div className="bg-[#0E0E0E] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Active Profiles</span>
                  <p className="text-2xl font-black text-white mt-1">{users.filter(u => u.preferences_set).length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><UserCheck size={18} /></div>
              </div>
              <div className="bg-[#0E0E0E] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Server Nodes</span>
                  <p className="text-2xl font-black text-white mt-1">{servers.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Globe size={18} /></div>
              </div>
              <div className="bg-[#0E0E0E] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Pending Reports</span>
                  <p className="text-2xl font-black text-white mt-1">{reports.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500"><AlertTriangle size={18} /></div>
              </div>
            </div>

            {/* AI Analytical Insights Box */}
            <div className="bg-gradient-to-br from-[#0E0E0E] to-[#121212] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-zinc-800 opacity-20"><TrendingUp size={120} /></div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-red-500" size={16} />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Serra Analytics Intelligence Insight</h3>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400 font-semibold mb-5">
                Serra evaluates historical records of user behaviors, registration rates, and content consumption on the fly to diagnose and suggest retention solutions.
              </p>
              <button
                onClick={() => handleSendChat("Perform a complete executive summary on user growth and active content engagement")}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/10 flex items-center gap-1.5"
              >
                Request Deep AI Audit Report <ArrowRight size={11} />
              </button>
            </div>
          </div>
        )}

        {/* MODULE 3: CONTENT STUDIO */}
        {activeTab === 'content' && (
          <div className="p-6 overflow-y-auto h-full space-y-6 hide-scrollbar bg-[#080808]">
            <div className="bg-[#0D0D0D] border border-white/5 p-5 rounded-3xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Sparkles className="text-red-500" size={15} /> Content Management Assistant
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1.5">Movie/Show Title</label>
                  <input
                    type="text"
                    placeholder="Enter movie title (e.g. Gladiator II, Interstellar)"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1.5">Operation Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'description', label: 'Movie Summary' },
                      { id: 'seo', label: 'SEO Metadata' },
                      { id: 'tags', label: 'Categories/Tags' },
                      { id: 'similar', label: 'Similar Promos' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setContentPromptType(opt.id)}
                        className={`px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all border cursor-pointer ${
                          contentPromptType === opt.id 
                            ? 'bg-red-600/10 border-red-500/30 text-red-500' 
                            : 'bg-black/30 border-white/5 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleContentToolAction}
                  disabled={contentLoading || !contentTitle.trim()}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {contentLoading && <RefreshCw className="animate-spin" size={13} />}
                  Generate Assets via Serra
                </button>
              </div>
            </div>

            {contentResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0E0E0E] border border-white/5 p-5 rounded-3xl relative"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] bg-red-600/10 border border-red-500/20 text-red-500 px-2 py-0.5 rounded font-bold uppercase">Generated Output</span>
                  <button
                    onClick={() => copyToClipboard(contentResult)}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-all cursor-pointer"
                  >
                    {copiedText ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    {copiedText ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-semibold select-text">{renderCleanMessageText(contentResult)}</div>
              </motion.div>
            )}
          </div>
        )}

        {/* MODULE 4: SECURITY SHIELD AUDIT */}
        {activeTab === 'security' && (
          <div className="p-6 overflow-y-auto h-full space-y-6 hide-scrollbar bg-[#080808]">
            <div className="bg-[#0D0D0D] border border-white/5 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex gap-4 items-start">
                <div className="p-4 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 shrink-0">
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">AgreyFlix Core Security Shield</h3>
                  <p className="text-xs text-zinc-400 mt-1.5 font-semibold">
                    Monitor authorization bypasses, brute force triggers, malicious file uploads, and unusual database activity instantly.
                  </p>
                </div>
              </div>
              <button
                onClick={runSecurityAudit}
                disabled={scanning}
                className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-40"
              >
                {scanning && <RefreshCw className="animate-spin" size={13} />}
                Run Real-time AI Shield Audit
              </button>
            </div>

            {securityScanResult ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0E0E0E] border border-white/5 p-6 rounded-3xl space-y-4"
              >
                <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                  <ShieldCheck className="text-emerald-500" size={16} />
                  <span className="text-xs font-black uppercase tracking-wider text-white">Scan Threat Report Details</span>
                </div>
                <div className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-semibold select-text">{renderCleanMessageText(securityScanResult)}</div>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0E0E0E] border border-white/5 p-5 rounded-3xl">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3">Defensive Rules Configured</h4>
                  <ul className="space-y-2 text-[11px] text-zinc-500 font-semibold">
                    <li className="flex items-center gap-2"><Check size={11} className="text-emerald-500" /> HTML Character Escaping (XSS Protection)</li>
                    <li className="flex items-center gap-2"><Check size={11} className="text-emerald-500" /> Malicious MIME Content Type Blocks</li>
                    <li className="flex items-center gap-2"><Check size={11} className="text-emerald-500" /> Signup/Login Attempts Rate Limiter</li>
                    <li className="flex items-center gap-2"><Check size={11} className="text-emerald-500" /> Strong Password Enforcement Policy (8-20 chars)</li>
                  </ul>
                </div>
                <div className="bg-[#0E0E0E] border border-white/5 p-5 rounded-3xl">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3">Server Telemetry Status</h4>
                  <div className="space-y-3">
                    {servers.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] font-semibold border-b border-white/5 pb-1.5 last:border-b-0 last:pb-0">
                        <span className="text-zinc-400">{s.name}</span>
                        <span className="text-emerald-400">{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODULE 5: NOTIFICATION GENERATOR */}
        {activeTab === 'notifications' && (
          <div className="p-6 overflow-y-auto h-full space-y-6 hide-scrollbar bg-[#080808]">
            <div className="bg-[#0D0D0D] border border-white/5 p-5 rounded-3xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <BellRing className="text-red-500" size={15} /> professional Push Notification Generator
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1.5">New Catalog Title</label>
                  <input
                    type="text"
                    placeholder="E.g. Gladiator II"
                    value={notifMovie}
                    onChange={(e) => setNotifMovie(e.target.value)}
                    className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1.5">Target Audience</label>
                  <select
                    value={notifAudience}
                    onChange={(e) => setNotifAudience(e.target.value)}
                    className="w-full bg-[#121212] border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:outline-none focus:border-red-500 transition-all font-semibold outline-none"
                  >
                    <option value="all">All Registrants (Broad Announcement)</option>
                    <option value="subscribers">Subscribers Only (Exclusive Highlight)</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateNotification}
                  disabled={notifLoading || !notifMovie.trim()}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-wider uppercase rounded-xl transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {notifLoading && <RefreshCw className="animate-spin" size={13} />}
                  Draft Push Campaign with Serra
                </button>
              </div>
            </div>

            {notifResult.title && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0E0E0E] border border-white/5 p-5 rounded-3xl space-y-4"
              >
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500">Proposed Notification Title</span>
                  <div className="text-sm font-black text-white mt-1 select-text">{notifResult.title}</div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500">Proposed Message Body</span>
                  <div className="text-xs text-zinc-300 mt-1 font-semibold select-text">{notifResult.body}</div>
                </div>

                <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handlePublishNotification}
                    disabled={notifLoading}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Publish Directly to Subscribers
                  </button>
                </div>

                {notifStatus === 'success' && (
                  <div className="text-emerald-500 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                    ✓ Notification broadcasted successfully across the system. Update notifications list refreshed.
                  </div>
                )}
                {notifStatus === 'error' && (
                  <div className="text-red-500 text-xs font-bold bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                    ✗ Failed to publish notification. Supabase connection might be temporary offline.
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* MODULE 6: SMART COMMANDS AI */}
        {activeTab === 'commands' && (
          <div className="p-6 overflow-y-auto h-full space-y-6 hide-scrollbar bg-[#080808]">
            <div className="bg-[#0D0D0D] border border-white/5 p-5 rounded-3xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Terminal className="text-red-500" size={15} /> Command Control Center
              </h3>
              <p className="text-xs text-zinc-400 font-semibold mb-5 leading-relaxed">
                Execute pre-designed administrative recipes to trigger high-level intelligence responses. Serra operates as an active operations manager to draft templates, perform competitive comparison, and plan configurations.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {commandRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleRunCommandRecipe(recipe)}
                    disabled={commandLoading}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between h-full ${
                      selectedRecipe === recipe.id
                        ? 'bg-red-600/10 border-red-500/40 text-white'
                        : 'bg-black/30 border-white/5 hover:border-white/10 hover:bg-white/[0.01]'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white group-hover:text-red-500 transition-colors flex items-center gap-2">
                        <Terminal size={12} className="text-zinc-500 shrink-0" /> {recipe.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-semibold mt-2 leading-relaxed">
                        {recipe.description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-red-500">
                      <span>Execute Command</span>
                      <ArrowRight size={10} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {commandLoading && (
              <div className="bg-[#0E0E0E] border border-white/5 p-8 rounded-3xl flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="animate-spin text-red-500" size={24} />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500 animate-pulse">Serra is synthesizing the requested operation command...</p>
              </div>
            )}

            {commandResult && !commandLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0E0E0E] border border-white/5 p-6 rounded-3xl space-y-4"
              >
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Check className="text-emerald-500" size={14} />
                    <span className="text-xs font-black uppercase tracking-wider text-white">Command Execution Result</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(commandResult)}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-all cursor-pointer"
                  >
                    {copiedText ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    {copiedText ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap font-semibold select-text">
                  {renderCleanMessageText(commandResult)}
                </div>
              </motion.div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
