import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  FaPlay, FaPause, FaVolumeMute, FaVolumeUp, 
  FaExpand, FaCompress, FaUndo, FaRedo, FaCog, FaClosedCaptioning, FaTimes, FaBolt 
} from 'react-icons/fa';
import AgreyFlixLoader from './AgreyFlixLoader';

export default function VideoPlayer({ 
  src, 
  title, 
  subTitle, 
  onClose,
  mediaId,
  type,
  season,
  episode,
  sourceType,
  isMaximized,
  onToggleMaximize,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const controlsTimeoutRef = useRef(null);

  // 1. Initialize HLS or Native Player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setLoading(true);
    setError(null);
    setIsPlaying(false);

    // Reset previous HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Playback of HLS Stream
    if (Hls.isSupported() && src.includes('.m3u8')) {
      const hls = new Hls({
        maxMaxBufferLength: 30, // 30s buffer limit
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.log('Autoplay blocked:', err));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('Fatal network error, trying to recover...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('Fatal media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              setError('Failed to load video stream channel.');
              setLoading(false);
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native support (Safari / iOS)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.log('Autoplay blocked:', err));
      });
      video.addEventListener('error', () => {
        setError('Failed to play this video stream link.');
        setLoading(false);
      });
    } else {
      // Fallback for standard MP4 or direct URLs
      video.src = src;
      video.addEventListener('loadeddata', () => {
        setLoading(false);
        video.play()
          .then(() => setIsPlaying(true))
          .catch((e) => console.log('Autoplay issue:', e));
      });
      video.addEventListener('error', () => {
        setError('This video format is not supported by your browser.');
        setLoading(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src]);

  // Save progress for Continue Watching
  useEffect(() => {
    if (!mediaId || currentTime <= 0 || duration <= 0) return;

    const saveTimer = setTimeout(() => {
      try {
        const STORAGE_KEY = 'weflix_continue_watching_cache';
        const raw = localStorage.getItem(STORAGE_KEY);
        let list = [];
        if (raw) {
          try { list = JSON.parse(raw); } catch(e){}
        }

        // Filter out matches
        list = list.filter(item => String(item.mediaId) !== String(mediaId));
        
        // Push as first item (limit to 12)
        list.unshift({
          mediaId: String(mediaId),
          type,
          title,
          subTitle,
          season,
          episode,
          currentTime,
          duration,
          progress: (currentTime / duration) * 100,
          updatedAt: Date.now(),
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 12)));
      } catch (err) {
        console.error('Failed to update continue watching progress:', err);
      }
    }, 5000); // Debounce saves to local storage every 5 seconds

    return () => clearTimeout(saveTimer);
  }, [currentTime, duration, mediaId, type, title, subTitle, season, episode]);

  // 2. Play/Pause Handlers
  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
    triggerControls();
  };

  // 3. Time formatting
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const hours = Math.floor(timeInSeconds / 3600);
    const mins = Math.floor((timeInSeconds % 3600) / 60);
    const secs = Math.floor(timeInSeconds % 60);

    const pad = (num) => String(num).padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // 4. Progress handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  };

  const handleDurationChange = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
    triggerControls();
  };

  // Jump 10s backward / forward
  const handleSkipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
    triggerControls();
  };

  const handleSkipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
    triggerControls();
  };

  // 5. Volume control
  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMute = !isMuted;
    video.muted = nextMute;
    setIsMuted(nextMute);
  };

  // 6. Speed Control
  const handleSpeedSelect = (speed) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  // 7. Fullscreen Control
  const handleToggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error('Full-screen error:', err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => console.error('Exit full-screen error:', err));
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // 8. Auto Hide Controls
  const triggerControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSpeedMenu) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseMove = () => {
    triggerControls();
  };

  useEffect(() => {
    triggerControls();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden font-sans select-none"
    >
      {/* Native HTML5 Video */}
      <video
        ref={videoRef}
        onClick={handleTogglePlay}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        className="w-full h-full max-h-screen object-contain"
        playsInline
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4 z-40">
          <AgreyFlixLoader />
          <p className="text-gray-300 font-bold text-sm tracking-widest animate-pulse">
            NAKUPAKIA VIDEO... TAFADHALI SUBIRI
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-4 z-40 text-center p-6">
          <div className="bg-red-600/20 border border-red-500 rounded-full w-16 h-16 flex items-center justify-center text-red-500 text-3xl font-black mb-2">
            !
          </div>
          <p className="text-white font-bold text-lg max-w-md">{error}</p>
          <button 
            onClick={onClose}
            className="mt-4 px-6 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all"
          >
            Rudi Nyuma
          </button>
        </div>
      )}

      {/* Main Controls Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 flex flex-col justify-between transition-all duration-300 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* TOP BAR */}
        <div className="p-6 md:p-8 flex items-center gap-2">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white hover:text-red-500 flex items-center justify-center border border-white/20 transition-all active:scale-95 shadow-lg shrink-0"
            title="Funga Player"
          >
            <FaTimes className="text-xl" />
          </button>

          {onToggleMaximize && (
            <button 
              onClick={onToggleMaximize}
              className="w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white hover:text-red-500 flex items-center justify-center border border-white/20 transition-all active:scale-95 shadow-lg shrink-0"
              title={isMaximized ? "Punguza Skrini" : "Sogeza Skrini Nzima"}
            >
              {isMaximized ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5 10H2V8h3v2zm10 0h3V8h-3v2zM10 5V2H8v3h2zm0 10v3H8v-3h2z"/></svg>
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M2 2h6v2H4v4H2V2zm16 0h-6v2h4v4h2V2zM2 18h6v-2H4v-4H2v6zm16 0h-6v-2h4v-4h2v6z"/></svg>
              )}
            </button>
          )}

          <div className="flex-1 flex flex-col gap-1.5 max-w-[70%] ml-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-white font-black text-xl md:text-2xl tracking-tight leading-none drop-shadow">
                {title}
              </h2>
              <span className="text-[10px] md:text-[11px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider flex items-center gap-1 leading-none bg-[#1d2d44] border border-[#3e5c76] text-[#8ecae6]">
                <FaBolt className="text-yellow-400" /> VidSrc Provider
              </span>
            </div>
            {subTitle && (
              <p className="text-gray-400 text-xs md:text-sm font-semibold tracking-wide uppercase">
                {subTitle}
              </p>
            )}
          </div>
        </div>

        {/* MIDDLE CONTROLS (QUICK SKIP BUTTONS OVERLAY ON HOVER) */}
        <div className="flex items-center justify-center gap-12 text-white">
          <button 
            onClick={handleSkipBackward}
            className="w-14 h-14 rounded-full bg-black/40 hover:bg-black/60 border border-white/5 flex items-center justify-center transition-all hover:scale-115"
            title="Sogeza sekunde 10 nyuma"
          >
            <FaUndo className="text-lg" />
          </button>
          
          <button 
            onClick={handleTogglePlay}
            className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 transition-all hover:scale-110 hover:bg-red-500"
          >
            {isPlaying ? <FaPause className="text-2xl" /> : <FaPlay className="text-2xl ml-1" />}
          </button>

          <button 
            onClick={handleSkipForward}
            className="w-14 h-14 rounded-full bg-black/40 hover:bg-black/60 border border-white/5 flex items-center justify-center transition-all hover:scale-115"
            title="Sogeza sekunde 10 mbele"
          >
            <FaRedo className="text-lg" />
          </button>
        </div>

        {/* BOTTOM CONTROLS BAR */}
        <div className="p-6 md:p-8 space-y-4">
          {/* Progress Timeline Slider */}
          <div className="flex items-center gap-4">
            <span className="text-gray-300 font-mono text-xs font-bold leading-none shrink-0 min-w-[45px]">
              {formatTime(currentTime)}
            </span>
            
            <div className="relative flex-1 group">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 accent-red-600 rounded-lg cursor-pointer appearance-none bg-white/20 hover:h-2 transition-all outline-none"
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-red-600 rounded-lg pointer-events-none"
                style={{ width: `${(currentTime / (duration || 100)) * 100}%` }}
              />
            </div>

            <span className="text-gray-300 font-mono text-xs font-bold leading-none shrink-0 min-w-[45px]">
              {formatTime(duration)}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            {/* Play, Volume controls */}
            <div className="flex items-center gap-6 text-white text-base">
              <button onClick={handleTogglePlay} className="hover:text-red-500 transition-colors">
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>

              <div className="flex items-center gap-3">
                <button onClick={handleToggleMute} className="hover:text-red-500 transition-colors">
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 md:w-24 h-1 bg-white/20 rounded cursor-pointer accent-red-600 outline-none"
                />
              </div>
            </div>

            {/* Speed, Subtitles and Fullscreen */}
            <div className="flex items-center gap-6 text-white relative">
              {/* Playback speed menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="flex items-center gap-1.5 hover:text-red-500 transition-colors text-xs font-black uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1 rounded"
                >
                  <FaCog className="text-sm" /> {playbackSpeed}x
                </button>
                
                {showSpeedMenu && (
                  <div className="absolute bottom-10 right-0 bg-[#0d1117] border border-white/10 rounded-lg overflow-hidden py-1.5 w-24 text-xs font-bold shadow-2xl z-50">
                    {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                      <button
                        key={speed}
                        onClick={() => handleSpeedSelect(speed)}
                        className={`w-full text-left px-3 py-2 hover:bg-red-600 hover:text-white transition-colors ${
                          playbackSpeed === speed ? 'text-red-500 bg-white/5' : 'text-gray-300'
                        }`}
                      >
                        {speed === 1 ? 'Kawaida' : `${speed}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={handleToggleFullscreen} 
                className="hover:text-red-500 transition-colors text-lg"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
