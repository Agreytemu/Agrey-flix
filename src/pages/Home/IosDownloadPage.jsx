import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Download, Smartphone, Copy, Check, 
  AlertTriangle, Video, Info, FolderOpen, ShieldCheck, 
  HelpCircle, Cpu, ExternalLink, RefreshCw
} from 'lucide-react';
import { fetchTmdb } from '../../utils/tmdb';
import { fetchStreamLinks, resolveStreamUrl } from '../../utils/extract';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';

export default function IosDownloadPage() {
  const { type, slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const season = parseInt(searchParams.get('season') || '1', 10);
  const episode = parseInt(searchParams.get('episode') || '1', 10);

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [copiedLink, setCopiedLink] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [fetchingStream, setFetchingStream] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(true);

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
        }

        let fetchedStreamUrl = '';

        if (active) {
          setFetchingStream(true);
          try {
            const rawStreamData = await fetchStreamLinks(slug, type, season, episode);
            const resolvedUrl = resolveStreamUrl(rawStreamData);
            if (resolvedUrl) {
              fetchedStreamUrl = resolvedUrl;
            } else {
              fetchedStreamUrl = `https://vidsrcscraper-production.up.railway.app/download/${slug}/${season}/${episode}`;
            }
          } catch (streamErr) {
            console.warn('Fallback link calculation launched:', streamErr);
            fetchedStreamUrl = `https://vidsrcscraper-production.up.railway.app/download/${slug}/${season}/${episode}`;
          } finally {
            setFetchingStream(false);
          }
        }

        if (active) {
          setStreamUrl(fetchedStreamUrl);
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
      <div id="ios-download-loading-wrapper" className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <AgreyFlixLoader text="Initializing secure iOS download console..." />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div id="ios-download-error-wrapper" className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-zinc-900/80 border border-red-500/20 p-8 rounded-3xl max-w-md shadow-2xl">
          <AlertTriangle className="text-red-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-red-400 font-extrabold text-lg mb-2">Content Connection Fault</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            {error || 'Unable to prepare secure offline files for this digital streaming item.'}
          </p>
          <button 
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

  const cleanUrlNoProto = streamUrl.replace(/^https?:\/\//, '');
  // iOS documents browser deep link scheme: rhttps://
  const readdleDocumentsUrl = `rhttps://${cleanUrlNoProto}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(streamUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div id="premium-ios-download-page" className="min-h-screen bg-[#07090e] text-zinc-100 font-sans pb-24 overflow-x-hidden relative">
      
      {/* Premium Cinematic Backdrop Frame */}
      <div className="absolute top-0 left-0 w-full h-[45vh] pointer-events-none select-none overflow-hidden z-0">
        {details.backdrop_path ? (
          <div className="relative w-full h-full">
            <img 
              src={`https://image.tmdb.org/t/p/w1280${details.backdrop_path}`} 
              alt="" 
              className="w-full h-full object-cover opacity-10 blur-md scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/90 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-zinc-900/25 to-[#07090e]" />
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 pt-8">
        
        {/* Navigation Action */}
        <div className="flex items-center justify-between border-b border-white/5 pb-5">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-xs font-bold uppercase text-zinc-300 hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Player
          </button>

          <span className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Dedicated iPhone & iPad Portal
          </span>
        </div>

        {/* Content Layout split */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Column 1: Poster Details */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-[#0b0e14]/65 border border-white/5 p-5 rounded-3xl backdrop-blur-md shadow-2xl space-y-5">
              <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/15 shadow-lg">
                {details.poster_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${details.poster_path}`} 
                    alt={details.title || details.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-600">
                    <Video className="w-12 h-12 mb-3 text-zinc-700" />
                    <span className="text-xs font-bold font-mono">No Digital Artwork</span>
                  </div>
                )}
                
                <div className="absolute bottom-3 left-3 bg-indigo-600 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-md tracking-wider uppercase shadow">
                  iOS Optimized
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight leading-tight">
                  {details.title || details.name}
                </h1>

                {type === 'tv' && (
                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Selected Episode:</span>
                    <span className="text-sm font-bold text-indigo-400">Season {season}, Episode {episode}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-white/5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Year:</span>
                    <span className="text-zinc-300 font-semibold">{year}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">System Compatibility:</span>
                    <span className="text-indigo-400 font-bold">iOS / Safari / Chrome</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0b0e14]/40 border border-white/5 p-5 rounded-2xl space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block font-mono">Required Application</span>
              <div className="flex gap-3 text-xs text-zinc-400">
                <FolderOpen className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="font-bold text-zinc-200 block">Documents by Readdle</span>
                  <span className="text-[11px] text-zinc-500">This free file explorer acts as a local system-bypassing download client for iPhones.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: iOS Download Controls */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-gradient-to-r from-indigo-950/20 to-zinc-900/30 border border-indigo-500/15 p-6 rounded-3xl">
              <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest bg-indigo-950/30 px-3 py-1 rounded-full border border-indigo-500/10">
                Apple Security Override
              </span>
              <h2 className="text-2xl font-black text-white tracking-widest uppercase mt-4 mb-2">
                iPhone & iPad Download Console
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Apple iOS strictly blocks direct in-browser downloads for multimedia formats. By pairing our high-speed links with <strong className="text-indigo-400">Documents by Readdle</strong>, you can download files at maximum speeds directly to your local file storage!
              </p>
            </div>

            {/* STEP 1: RESOLUTION AND QUALITY SELECTOR */}
            <div className="bg-[#0b0e14]/80 border border-white/5 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black px-2 py-1 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 font-mono">01</span>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Configure Playback Quality</h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">Format: .MP4</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {qualityOptions.map((opt) => {
                  const isSelected = selectedQuality === opt.resolution;
                  return (
                    <button
                      key={opt.resolution}
                      onClick={() => setSelectedQuality(opt.resolution)}
                      className={`text-left p-4 rounded-xl border transition-all duration-300 flex justify-between items-center ${
                        isSelected 
                          ? 'bg-indigo-950/10 border-indigo-500/50 shadow-lg shadow-indigo-950/10' 
                          : 'bg-[#10141d]/50 border-white/5 hover:border-white/10 hover:bg-[#10141d]/85'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-sm font-extrabold text-white block">{opt.label}</span>
                        <span className="text-[10px] text-zinc-500 font-mono block uppercase tracking-wider">
                          {opt.codec}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded font-mono ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {opt.size}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: DOCUMENTS APP */}
            <div className="bg-[#0b0e14]/80 border border-white/5 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black px-2 py-1 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 font-mono">02</span>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Get Downloader App</h3>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-zinc-950/60 border border-white/5 rounded-2xl gap-4">
                <div className="flex gap-3">
                  <FolderOpen className="w-8 h-8 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Documents by Readdle</p>
                    <p className="text-[11px] text-zinc-500">Free download utility and video player for your iPhone/iPad system.</p>
                  </div>
                </div>
                <a
                  href="https://apps.apple.com/app/documents-file-manager-pdf/id364905059"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  App Store <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* STEP 3: EXECUTE DOWNLOAD */}
            <div className="bg-[#0b0e14]/80 border border-white/5 p-6 rounded-3xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black px-2 py-1 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 font-mono">03</span>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Initiate iPhone Download</h3>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl space-y-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black block">Aligned Save Target:</span>
                <code className="text-xs font-mono font-bold text-indigo-400 block break-all bg-zinc-900/80 p-2.5 rounded border border-white/5">
                  {videoFileName}
                </code>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={readdleDocumentsUrl}
                  className="py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 text-center active:scale-98"
                >
                  <Smartphone className="w-4 h-4 text-indigo-200" /> Launch in Documents App
                </a>

                <button
                  onClick={handleCopyLink}
                  className="py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-extrabold uppercase rounded-xl transition-all border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                  {copiedLink ? 'Link Copied to Clipboard!' : 'Copy Secure Stream URL'}
                </button>
              </div>

              <div className="p-4 bg-zinc-950/70 border border-indigo-500/20 rounded-2xl text-xs text-zinc-400 space-y-2.5 leading-relaxed">
                <div className="flex items-center gap-2 text-indigo-300 font-extrabold uppercase tracking-wider text-[10px]">
                  <Info className="w-3.5 h-3.5" /> step-by-step iOS download guide
                </div>
                <ul className="space-y-2 text-[11px] list-inside pl-1 text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">1.</span>
                    <span>Make sure <strong className="text-white">Documents by Readdle</strong> is installed on your device.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">2.</span>
                    <span>Tap the <strong className="text-indigo-400">Launch in Documents App</strong> button above. If it asks to open Documents, click Yes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">3.</span>
                    <span>If the deep-link doesn't open automatically, click <strong className="text-white">Copy Secure Stream URL</strong>, launch Readdle Documents manually, open its **built-in web browser** (bottom right corner), and paste the copied URL.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">4.</span>
                    <span>Documents app will detect the high-speed video stream and prompt you to name and download the file. Make sure to name it with <code className="text-yellow-400 font-mono">.mp4</code> extension.</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
