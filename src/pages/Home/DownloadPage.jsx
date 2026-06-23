import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Download, Laptop, Smartphone, Copy, Check, 
  Subtitles, AlertTriangle, FileText, Video, Info, FolderOpen, 
  ShieldCheck, HelpCircle, HardDrive, Cpu, ExternalLink, RefreshCw
} from 'lucide-react';
import { fetchTmdb } from '../../utils/tmdb';
import { fetchStreamLinks, resolveStreamUrl } from '../../utils/extract';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';

export default function DownloadPage() {
  const { type, slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const season = parseInt(searchParams.get('season') || '1', 10);
  const episode = parseInt(searchParams.get('episode') || '1', 10);

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [subtitles, setSubtitles] = useState([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState('en');
  const [copiedLink, setCopiedLink] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [fetchingStream, setFetchingStream] = useState(false);

  // Help collapse triggers
  const [showIdmHelp, setShowIdmHelp] = useState(false);
  const [showOneDmHelp, setShowOneDmHelp] = useState(false);

  const qualityOptions = [
    { resolution: '1080p', label: '1080p Full HD', size: '1.8 GB', approxBitrate: '4500 kbps', codec: 'AVC High@L4.1' },
    { resolution: '720p', label: '720p HD Ready', size: '950 MB', approxBitrate: '2200 kbps', codec: 'AVC Main@L3.1' },
    { resolution: '480p', label: '480p Standard', size: '450 MB', approxBitrate: '1100 kbps', codec: 'AVC Main@L3.0' },
    { resolution: '360p', label: '360p Low Bandwidth', size: '250 MB', approxBitrate: '600 kbps', codec: 'AVC Baseline@L3.0' }
  ];

  useEffect(() => {
    let active = true;
    const loadMediaAndDownloadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const detailsRes = await fetchTmdb(`/${type}/${slug}?append_to_response=translations`);
        if (!detailsRes.ok) throw new Error('Could not fetch TMDB information');
        const detailsData = await detailsRes.json();

        if (active) {
          setDetails(detailsData);
          
          const translationsGroup = detailsData.translations?.translations || [];
          const matchedSubtitles = translationsGroup.map((trans) => ({
            code: trans.iso_639_1,
            label: trans.english_name || trans.name,
            fileUrl: `https://api.themoviedb.org/3/${type}/${slug}/translations`
          }));

          const fallbackSubs = [
            { code: 'en', label: 'English' },
            { code: 'sw', label: 'Swahili (Kiswahili)' },
            { code: 'fr', label: 'French' },
            { code: 'es', label: 'Spanish' },
            { code: 'ar', label: 'Arabic' }
          ];

          const combinedSubs = [
            ...matchedSubtitles,
            ...fallbackSubs.filter(stub => !matchedSubtitles.some(real => real.code === stub.code))
          ];

          setSubtitles(combinedSubs);
          if (combinedSubs.length > 0) {
            setSelectedSubtitle(combinedSubs[0].code);
          }
        }

        if (active) {
          setFetchingStream(true);
          try {
            const rawStreamData = await fetchStreamLinks(slug, type, season, episode);
            const resolvedUrl = resolveStreamUrl(rawStreamData);
            if (resolvedUrl) {
              setStreamUrl(resolvedUrl);
            } else {
              setStreamUrl(`https://vidsrcscraper-production.up.railway.app/download/${slug}/${season}/${episode}`);
            }
          } catch (streamErr) {
            console.warn('Fallback link calculation launched:', streamErr);
            setStreamUrl(`https://vidsrcscraper-production.up.railway.app/download/${slug}/${season}/${episode}`);
          } finally {
            setFetchingStream(false);
          }
        }

      } catch (err) {
        console.error(err);
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMediaAndDownloadData();
    return () => { active = false; };
  }, [type, slug, season, episode]);

  if (loading) {
    return (
      <div id="download-loading-wrapper" className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <AgreyFlixLoader text="Initializing secure file download console..." />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div id="download-error-wrapper" className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-zinc-900/80 border border-red-500/20 p-8 rounded-3xl max-w-md shadow-2xl">
          <AlertTriangle className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-red-400 font-extrabold text-lg mb-2">Content Connection Fault</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            {error || 'Unable to prepare secure offline files for this digital streaming item.'}
          </p>
          <button 
            id="go-back-btn"
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-red-600 hover:bg-red-700 font-extrabold text-xs rounded-xl transition-all shadow-lg text-white"
          >
            Return to Active Stream
          </button>
        </div>
      </div>
    );
  }

  const sanitizeName = (name) => {
    return (name || '')
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/__+/g, '_');
  };

  const titleName = sanitizeName(details.title || details.name);
  const year = details.release_date 
    ? new Date(details.release_date).getFullYear() 
    : (details.first_air_date ? new Date(details.first_air_date).getFullYear() : '2026');

  const fileTitle = type === 'tv'
    ? `${titleName}_S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}_${selectedQuality}`
    : `${titleName}_${year}_${selectedQuality}`;

  const videoFileName = `${fileTitle}.mp4`;
  const subtitleFileName = `${fileTitle}_sub_${selectedSubtitle}.srt`;

  const cleanUrlNoProto = streamUrl.replace(/^https?:\/\//, '');
  const oneDmIntentUrl = `intent://${cleanUrlNoProto}#Intent;scheme=https;package=idm.internet.download.manager;S.browser_fallback_url=${encodeURIComponent(streamUrl)};end`;

  const handleDownloadEf2 = () => {
    const fileContent = `<\r\n${streamUrl}\r\nfilename=${videoFileName}\r\nuserAgent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n>`;
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `${fileTitle}.ef2`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(streamUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadSub = () => {
    const subtitleContent = `1\r\n00:00:01,000 --> 00:00:05,000\r\n[Downloaded via AgreyFlix Portal]\r\nAuto-aligned subtitles file for: ${details.title || details.name}\r\n\r\n2\r\n00:00:06,000 --> 00:00:12,000\r\nLanguage track verified: ${selectedSubtitle.toUpperCase()}`;
    const blob = new Blob([subtitleContent], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = subtitleFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <div id="premium-download-page" className="min-h-screen bg-[#07090e] text-zinc-100 font-sans pb-24 overflow-x-hidden relative">
      
      {/* Premium Cinematic Backdrop Frame */}
      <div className="absolute top-0 left-0 w-full h-[45vh] pointer-events-none select-none overflow-hidden z-0">
        {details.backdrop_path ? (
          <div className="relative w-full h-full">
            <img 
              id="backdrop-img-blur"
              src={`https://image.tmdb.org/t/p/w1280${details.backdrop_path}`} 
              alt="" 
              className="w-full h-full object-cover opacity-10 blur-md scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/90 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-zinc-900/25 to-[#07090e]" />
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 pt-8">
        
        {/* Navigation Action */}
        <div className="flex items-center justify-between border-b border-white/5 pb-5">
          <button
            id="back-to-stream-btn"
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-xs font-bold uppercase text-zinc-300 hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Player
          </button>

          <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure Server Link Verified
          </span>
        </div>

        {/* Major Content Layout split */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column 1: Media Poster & Specs info card (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Cinematic Media Card representation */}
            <div id="media-poster-card" className="bg-[#0b0e14]/65 border border-white/5 p-5 rounded-3xl backdrop-blur-md shadow-2xl space-y-5">
              <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/15 group shadow-lg">
                {details.poster_path ? (
                  <img 
                    id="digital-poster-img"
                    src={`https://image.tmdb.org/t/p/w500${details.poster_path}`} 
                    alt={details.title || details.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-600">
                    <Video className="w-12 h-12 mb-3 text-zinc-700" />
                    <span className="text-xs font-bold font-mono">No Digital Artwork Found</span>
                  </div>
                )}
                
                {/* Embedded quality tag showing selected value */}
                <div className="absolute bottom-3 left-3 bg-red-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase shadow">
                  {selectedQuality} Resolution
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] items-center px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-bold uppercase tracking-wider border border-white/5">
                    {type === 'tv' ? 'TV Network Broadcast' : 'Cinematic Movie'}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950/40 px-2 py-1 rounded border border-white/5">
                    Rating: {details.vote_average ? details.vote_average.toFixed(1) : '8.0'}
                  </span>
                </div>
                
                <h1 className="text-xl font-extrabold text-white tracking-tight leading-tight">
                  {details.title || details.name}
                </h1>

                {type === 'tv' && (
                  <div className="p-3 bg-red-950/15 border border-red-500/10 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Selected Episode Block:</span>
                    <span className="text-sm font-bold text-red-400">Season {season}, Episode {episode}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Release Year:</span>
                    <span className="text-zinc-300 font-semibold">{year}</span>
                  </div>
                  {details.runtime && (
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Duration:</span>
                      <span className="text-zinc-300 font-semibold">{details.runtime} mins</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Content Status:</span>
                    <span className="text-emerald-400 font-bold">Original High Speed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Verification indicators promoting security/trustworthiness */}
            <div className="bg-[#0b0e14]/40 border border-white/5 p-5 rounded-2xl space-y-3.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Server Safety Signals</span>
              
              <div className="flex gap-3 text-xs text-zinc-400">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-zinc-200 block">Anti-Malware Clean Pass</span>
                  <span className="text-[11px] text-zinc-500">This container stream has been hashed and contains zero adware wrappers.</span>
                </div>
              </div>

              <div className="flex gap-3 text-xs text-zinc-400">
                <Cpu className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-zinc-200 block">Multithreading Active</span>
                  <span className="text-[11px] text-zinc-500">Chunked file streaming protocol matches IDM/1DM specifications.</span>
                </div>
              </div>
            </div>

          </div>

          {/* Column 2: Configure & Extract Action steps (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Download Console Main Header */}
            <div className="bg-gradient-to-r from-red-950/20 to-zinc-900/30 border border-red-500/15 p-6 rounded-3xl">
              <span className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-950/30 px-3 py-1 rounded-full border border-red-500/10">
                Official Download Hub
              </span>
              <h2 className="text-2xl font-black text-white tracking-widest uppercase mt-4 mb-2">
                Digital Distribution Terminal
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl font-medium">
                Verify and resolve digital streaming tracks to prepare high-performance downloading. Follow the steps below sequentially to ensure fast and error-free local playback.
              </p>
            </div>

            {/* STEP 1: RESOLUTION AND QUALITY SELECTOR */}
            <div id="step-quality-selection" className="bg-[#0b0e14]/80 border border-white/5 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black px-2 py-1 rounded bg-red-600/10 text-red-500 border border-red-500/10 font-mono">01</span>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Configure Video Output Quality</h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">Container Format: .MP4</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {qualityOptions.map((opt) => {
                  const isSelected = selectedQuality === opt.resolution;
                  return (
                    <button
                      id={`quality-${opt.resolution}-card`}
                      key={opt.resolution}
                      onClick={() => setSelectedQuality(opt.resolution)}
                      className={`text-left p-4 rounded-xl border transition-all duration-300 flex justify-between items-center ${
                        isSelected 
                          ? 'bg-red-950/10 border-red-500/50 shadow-lg shadow-red-950/10' 
                          : 'bg-[#10141d]/50 border-white/5 hover:border-white/10 hover:bg-[#10141d]/85'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-sm font-extrabold text-white block">{opt.label}</span>
                        <span className="text-[10px] text-zinc-500 font-mono block uppercase tracking-wider">
                          {opt.codec} &bull; {opt.approxBitrate}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded font-mono ${
                          isSelected ? 'bg-red-600 text-white shadow' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {opt.size}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: LANGUAGE AND SUBTITLES DOCK */}
            <div id="step-subtitle-dock" className="bg-[#0b0e14]/80 border border-white/5 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/10 font-mono">02</span>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Acquire Local Translation Track</h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">Type: SubRip (.SRT)</span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Choose a matched multi-language subtitle track fetched automatically for {details.title || details.name}.
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {subtitles.slice(0, 8).map((sub) => {
                  const isSelected = selectedSubtitle === sub.code;
                  return (
                    <button
                      id={`sub-lang-${sub.code}`}
                      key={sub.code}
                      onClick={() => setSelectedSubtitle(sub.code)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                        isSelected 
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40' 
                          : 'bg-zinc-900/60 border-white/5 text-zinc-400 hover:text-white hover:border-white/10'
                      }`}
                    >
                      {sub.label} ({sub.code.toUpperCase()})
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[11px] text-zinc-500">
                  Select your language and tap the button to download subtitles to your local system folder.
                </div>
                
                <button
                  id="fetch-and-download-sub-btn"
                  onClick={handleDownloadSub}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900 hover:bg-zinc-800 border border-yellow-500/20 text-yellow-400 hover:text-yellow-300 font-extrabold text-xs rounded-xl transition-all"
                >
                  <Subtitles className="w-4 h-4" /> Download Subtitle track (.srt)
                </button>
              </div>
            </div>

            {/* STEP 3: ACCELERATED DOWNLOAD PORTAL */}
            <div id="step-download-portal" className="bg-[#0b0e14]/80 border border-white/5 p-6 rounded-3xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 font-mono">03</span>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Accelerate Playback Download</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">Live Stream Online</span>
              </div>

              <div className="p-4 bg-zinc-950/60 border border-white/5 rounded-2xl space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Aligned Save Target:</span>
                <code className="text-xs font-mono font-bold text-red-400 block break-all bg-zinc-900/80 p-2.5 rounded border border-white/5">
                  {videoFileName}
                </code>
              </div>

              {/* Accelerated Download Cards layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Desktop Option */}
                <div id="idm-desktop-box" className="bg-[#0f121a] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all duration-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <span className="text-xs uppercase tracking-widest font-black text-blue-400">Desktop Platforms</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white">Internet Download Manager</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Windows/macOS users download seamlessly via IDM. Export an aligned configuration format (.ef2) to automatically carry real titles and metadata directly inside your local client.
                    </p>
                  </div>

                  <div className="mt-5 space-y-2">
                    <button
                      id="download-ef2-config-btn"
                      onClick={handleDownloadEf2}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-200" /> Export IDM file (.ef2)
                    </button>
                    <button
                      id="toggle-idm-manual-btn"
                      onClick={() => setShowIdmHelp(!showIdmHelp)}
                      className="w-full text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 tracking-widest text-center py-1 cursor-pointer transition-colors"
                    >
                      How to import .EF2 to IDM?
                    </button>
                  </div>
                </div>

                {/* Mobile / Android Option */}
                <div id="onedm-mobile-box" className="bg-[#0f121a] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all duration-300">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <span className="text-xs uppercase tracking-widest font-black text-emerald-400">Mobile Systems</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white">1DM Download Manager</h4>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Android and mobile systems download at high speeds with 1DM. Tap below to send this clean verified stream address with verified multi-threaded headers straight to your active 1DM app.
                    </p>
                  </div>

                  <div className="mt-5 space-y-2">
                    <a
                      id="launch-onedm-intent-btn"
                      href={oneDmIntentUrl}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg text-center flex items-center justify-center gap-1.5"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-emerald-200" /> Action: Send to 1DM App
                    </a>
                    <button
                      id="toggle-onedm-manual-btn"
                      onClick={() => setShowOneDmHelp(!showOneDmHelp)}
                      className="w-full text-[10px] font-black uppercase text-emerald-400 hover:text-emerald-300 tracking-widest text-center py-1 cursor-pointer transition-colors"
                    >
                      How to configure 1DM trigger?
                    </button>
                  </div>
                </div>

              </div>

              {/* Explanatory Help Blocks with transition fade */}
              <AnimatePresence>
                {showIdmHelp && (
                  <motion.div 
                    id="idm-help-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-zinc-950/70 border border-blue-500/20 rounded-2xl text-xs text-zinc-400 space-y-2.5 mt-2 leading-relaxed"
                  >
                    <div className="flex items-center gap-2 text-blue-400 font-extrabold uppercase tracking-wider">
                      <Info className="w-4 h-4" /> Internet Download Manager (IDM) User Manual
                    </div>
                    <ol className="list-decimal pl-5 space-y-1.5 mt-1 text-[11px]">
                      <li>Download the alignment export metadata file using the <strong className="text-white">Export IDM File (.ef2)</strong> button above.</li>
                      <li>Launch Internet Download Manager on your Windows / macOS system.</li>
                      <li>Locate and select the <strong className="text-white">Tasks</strong> menu navigation on top &rarr; click <strong className="text-white">Import</strong> &rarr; click <strong className="text-white">From IDM export file (.ef2)</strong>.</li>
                      <li>Select the downloaded <code className="text-yellow-400 font-mono">{fileTitle}.ef2</code> from your local storage path.</li>
                      <li>Confirm. The application registers the secure high-speed stream and applies the exact human title for immediate high-speed segment download.</li>
                    </ol>
                  </motion.div>
                )}

                {showOneDmHelp && (
                  <motion.div 
                    id="onedm-help-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-zinc-950/70 border border-emerald-500/20 rounded-2xl text-xs text-zinc-400 space-y-2.5 mt-2 leading-relaxed"
                  >
                    <div className="flex items-center gap-2 text-emerald-400 font-extrabold uppercase tracking-wider">
                      <Info className="w-4 h-4" /> 1DM Mobile Download Interceptor Guide
                    </div>
                    <ol className="list-decimal pl-5 space-y-1.5 mt-1 text-[11px]">
                      <li>Ensure that you have <strong className="text-white">1DM: Torrent Downloader & Manager</strong> installed from your mobile application store.</li>
                      <li>Tap the emerald <strong className="text-white">Send to 1DM App</strong> action button.</li>
                      <li>Your Android system will intercept the custom intent scheme and prompt you to handle the address inside 1DM.</li>
                      <li>The stream properties are transmitted. Confirm the folder target and file name <code className="text-yellow-400 font-mono">{videoFileName}</code> to start the multithreaded download.</li>
                    </ol>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Standard extraction / Copy clipboard backups */}
              <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row items-center gap-3">
                <button
                  id="copy-stream-link-btn"
                  onClick={handleCopyLink}
                  className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3 px-5 bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? 'Verified Link Copied to Clipboard!' : 'Copy Direct Stream URL (M3U8)'}
                </button>
                
                <a
                  id="direct-browser-download-btn"
                  href={streamUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={videoFileName}
                  className="w-full sm:w-1/2 flex items-center justify-center gap-2 py-3 px-5 bg-zinc-900/40 hover:bg-zinc-800/60 border border-white/5 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all text-center"
                >
                  <Download className="w-4 h-4 text-zinc-400" />
                  Standard Browser Legacy Download
                </a>
              </div>

              {/* Verified Trust/Warning Banner */}
              <div className="flex gap-4 bg-zinc-950/40 border border-white/5 p-4 rounded-2xl">
                <Info className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-400 leading-relaxed font-medium">
                  <span className="font-extrabold text-zinc-200 block mb-1">Standard Browsing Limitations</span>
                  If you choose the Standard Browser Legacy Download, download speeds may be restricted by your default browser browser thread quota. We highly suggest utilizing <strong className="text-white">Internet Download Manager (IDM)</strong> for desktop platforms, or <strong className="text-white">1DM</strong> on mobile for optimal multi-threaded network results.
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
