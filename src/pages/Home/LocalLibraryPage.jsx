import React, { useState, useEffect, useRef } from 'react';
import { 
  FaFolder, FaVideo, FaMusic, FaSearch, FaPlay, FaPause, FaFolderOpen, 
  FaRedo, FaTrash, FaChevronRight, FaVolumeUp, FaVolumeMute, FaExpand, 
  FaCompress, FaStepForward, FaStepBackward, FaSync, FaShieldAlt, 
  FaCheck, FaFileAudio, FaFileVideo, FaClock, FaTimes, FaSlidersH,
  FaRandom, FaTv
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function LocalLibraryPage() {
  const navigate = useNavigate();
  // Permission States: 'prompt', 'granted', 'denied'
  const [permissionStatus, setPermissionStatus] = useState(() => {
    return localStorage.getItem('agreyflix_media_permission_granted') || 'prompt';
  });

  // Media Lists
  const [localVideos, setLocalVideos] = useState([]);
  const [localMusic, setLocalMusic] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    const cached = localStorage.getItem('agreyflix_local_recently_played');
    return cached ? JSON.parse(cached) : [];
  });

  // Scanning States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState([]);
  const [scanStats, setScanStats] = useState({ videos: 0, music: 0 });

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('videos'); // 'videos' | 'music'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Audio Player States
  const [currentAudio, setCurrentAudio] = useState(null); // { file, name, size, duration, url, id }
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [audioLoop, setAudioLoop] = useState(false);
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState(1.0);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);

  // Custom Video Player States
  const [currentVideo, setCurrentVideo] = useState(null); // { file, name, size, url, thumbnail, id }
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoVolume, setVideoVolume] = useState(1.0);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState(1.0);
  const [videoAspectRatio, setVideoAspectRatio] = useState('contain'); // 'contain' | 'cover' | 'fill'
  const [videoToast, setVideoToast] = useState(null);

  // References
  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Load previously cached metadata (file references cannot be stored as serialized files, but we preserve metadata lists!)
  useEffect(() => {
    const cachedVideos = localStorage.getItem('agreyflix_local_videos_metadata');
    const cachedMusic = localStorage.getItem('agreyflix_local_music_metadata');
    if (cachedVideos) {
      try { setLocalVideos(JSON.parse(cachedVideos)); } catch (e) { console.error(e); }
    }
    if (cachedMusic) {
      try { setLocalMusic(JSON.parse(cachedMusic)); } catch (e) { console.error(e); }
    }
  }, []);

  // Sync recently played to localStorage
  useEffect(() => {
    localStorage.setItem('agreyflix_local_recently_played', JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  // Audio equalizer visualizer effect
  useEffect(() => {
    if (activeTab === 'music' && currentAudio && isAudioPlaying) {
      startVisualizer();
    } else {
      stopVisualizer();
    }
    return () => stopVisualizer();
  }, [activeTab, currentAudio, isAudioPlaying]);

  const isAndroidApp = navigator.userAgent.includes("AgreyFlixAndroidApp");

  if (!isAndroidApp) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-300 flex flex-col items-center justify-center px-6 py-20 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full bg-zinc-950 border border-white/5 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl" />
          <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-3xl">
            <FaFolder />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">Device Library</h1>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest text-red-500">Android Feature Only</p>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed font-semibold">
            The local Device Library is a native feature exclusive to the official AgreyFlix Android Application. It allows you to scan your offline device storage safely, import your own local videos or audio files, and play them directly in our media engine.
          </p>
          <div className="pt-4 space-y-3">
            <button
              onClick={() => navigate('/download-app')}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg hover:shadow-red-600/10 cursor-pointer"
            >
              Get Android App
            </button>
            <button
              onClick={() => navigate('/home')}
              className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all border border-white/5 cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Handle HTML5 File/Folder imports and generate records
  const handleMediaFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanLogs([]);
    const videoArr = [];
    const audioArr = [];
    let processed = 0;

    const totalFiles = fileList.length;

    for (let i = 0; i < totalFiles; i++) {
      const file = fileList[i];
      processed++;
      
      const progressPercent = Math.min(Math.round((processed / totalFiles) * 100), 100);
      setScanProgress(progressPercent);

      const virtualPath = file.webkitRelativePath 
        ? `/storage/emulated/0/${file.webkitRelativePath}`
        : `/storage/emulated/0/Download/${file.name}`;

      const fileLog = `Scanning: ${virtualPath}`;
      setScanLogs(prev => [fileLog, ...prev.slice(0, 15)]);

      // Check file types
      if (file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.mkv') || file.name.endsWith('.webm') || file.name.endsWith('.mov')) {
        const videoId = `vid_${file.name}_${file.size}`;
        let thumbnail = null;

        // Try extracting high fidelity video thumbnail using temporary offscreen video/canvas element
        try {
          thumbnail = await generateVideoThumbnail(file);
        } catch (err) {
          console.warn("Failed to generate thumbnail for: ", file.name, err);
        }

        videoArr.push({
          id: videoId,
          name: file.name.replace(/\.[^/.]+$/, ""), // remove extension for display
          fullName: file.name,
          size: formatBytes(file.size),
          type: file.type || 'video/mp4',
          path: virtualPath,
          thumbnail: thumbnail,
          file: file, // Keep live file reference in-memory for active session
          duration: '00:00', // updated dynamically upon playback
          addedAt: Date.now()
        });
      } else if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.ogg') || file.name.endsWith('.m4a') || file.name.endsWith('.aac')) {
        const audioId = `aud_${file.name}_${file.size}`;
        audioArr.push({
          id: audioId,
          name: file.name.replace(/\.[^/.]+$/, ""),
          fullName: file.name,
          size: formatBytes(file.size),
          type: file.type || 'audio/mp3',
          path: virtualPath,
          file: file,
          artist: 'Local Artist',
          album: 'Device Album',
          addedAt: Date.now()
        });
      }

      // Add a tiny artificial delay to make the beautiful terminal scanner readable
      if (totalFiles < 50) {
        await new Promise(r => setTimeout(r, 40));
      } else if (i % 5 === 0) {
        await new Promise(r => setTimeout(r, 10));
      }
    }

    // Merge and save
    setLocalVideos(prev => {
      const merged = [...videoArr, ...prev].filter((v, idx, self) => 
        self.findIndex(t => t.id === v.id) === idx
      );
      // Cache metadata (serialize without live file object)
      const serializable = merged.map(({ file, ...rest }) => rest);
      localStorage.setItem('agreyflix_local_videos_metadata', JSON.stringify(serializable));
      return merged;
    });

    setLocalMusic(prev => {
      const merged = [...audioArr, ...prev].filter((a, idx, self) => 
        self.findIndex(t => t.id === a.id) === idx
      );
      const serializable = merged.map(({ file, ...rest }) => rest);
      localStorage.setItem('agreyflix_local_music_metadata', JSON.stringify(serializable));
      return merged;
    });

    setScanStats({ videos: videoArr.length, music: audioArr.length });
    
    // Complete beautiful scanning terminal
    setScanLogs(prev => [
      `🎉 MediaStore indexing complete! Discovered ${videoArr.length} videos and ${audioArr.length} audio tracks.`,
      ...prev
    ]);
    
    setTimeout(() => {
      setIsScanning(false);
    }, 1500);
  };

  // Extract a real base64 image frame from video file using canvas
  const generateVideoThumbnail = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const fileURL = URL.createObjectURL(file);
      video.src = fileURL;

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Thumbnail extraction timed out"));
      }, 5000);

      const cleanup = () => {
        clearTimeout(timeout);
        video.removeAttribute('src');
        video.load();
        URL.revokeObjectURL(fileURL);
      };

      video.onloadeddata = () => {
        // seek to 1.5s to bypass initial black frames
        video.currentTime = Math.min(1.5, video.duration / 2 || 0);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 180;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(dataUrl);
          } else {
            reject(new Error("Could not construct 2D context"));
          }
        } catch (e) {
          reject(e);
        } finally {
          cleanup();
        }
      };

      video.onerror = (e) => {
        cleanup();
        reject(e);
      };
    });
  };

  // Helper formatting size bytes
  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  // Android-style permission acceptance
  const grantPermission = () => {
    localStorage.setItem('agreyflix_media_permission_granted', 'granted');
    setPermissionStatus('granted');
  };

  const denyPermission = () => {
    localStorage.setItem('agreyflix_media_permission_granted', 'denied');
    setPermissionStatus('denied');
  };

  const resetPermission = () => {
    localStorage.removeItem('agreyflix_media_permission_granted');
    setPermissionStatus('prompt');
  };

  // Add Item to Recently Played list
  const trackPlayback = (item) => {
    const simplifiedItem = {
      id: item.id,
      name: item.name,
      fullName: item.fullName,
      type: item.type,
      size: item.size,
      thumbnail: item.thumbnail || null,
      path: item.path,
      playedAt: Date.now()
    };

    setRecentlyPlayed(prev => {
      const filtered = prev.filter(x => x.id !== item.id);
      return [simplifiedItem, ...filtered].slice(0, 8); // limit to last 8
    });
  };

  // Clear a specific local library database
  const clearLibrary = () => {
    if (window.confirm("Are you sure you want to clear your local media library cache? This will not delete files from your device.")) {
      setLocalVideos([]);
      setLocalMusic([]);
      setRecentlyPlayed([]);
      localStorage.removeItem('agreyflix_local_videos_metadata');
      localStorage.removeItem('agreyflix_local_music_metadata');
      localStorage.removeItem('agreyflix_local_recently_played');
    }
  };

  // Play Video file
  const handlePlayVideo = (videoItem) => {
    // Check if live file is attached. If not (e.g. loaded from localStorage cache on reload), 
    // prompt user to browse/select files to authorize browser reader.
    if (!videoItem.file) {
      alert(`⚠️ To play "${videoItem.fullName}", please scan your device storage again using the "Scan Media" button to authorize security permissions.`);
      return;
    }

    // Stop active audio player
    if (isAudioPlaying) {
      audioRef.current?.pause();
      setIsAudioPlaying(false);
    }

    const objectUrl = URL.createObjectURL(videoItem.file);
    setCurrentVideo({
      ...videoItem,
      url: objectUrl
    });
    setIsVideoPlaying(true);
    setVideoCurrentTime(0);
    setVideoPlaybackSpeed(1.0);
    trackPlayback(videoItem);
  };

  // Play Audio file
  const handlePlayAudio = (audioItem) => {
    if (!audioItem.file) {
      alert(`⚠️ To play "${audioItem.fullName}", please scan your device storage again using the "Scan Media" button to authorize security permissions.`);
      return;
    }

    // Stop active video player
    if (currentVideo) {
      setCurrentVideo(null);
      setIsVideoPlaying(false);
    }

    const objectUrl = URL.createObjectURL(audioItem.file);
    
    // Revoke old audio object url if playing
    if (currentAudio?.url) {
      URL.revokeObjectURL(currentAudio.url);
    }

    setCurrentAudio({
      ...audioItem,
      url: objectUrl
    });
    setIsAudioPlaying(true);
    setAudioCurrentTime(0);
    trackPlayback(audioItem);

    // Load and play
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = objectUrl;
        audioRef.current.play()
          .then(() => setIsAudioPlaying(true))
          .catch(e => console.error(e));
      }
    }, 100);
  };

  // Video Events handler
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setVideoCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleVideoPlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      } else {
        videoRef.current.play();
        setIsVideoPlaying(true);
      }
    }
  };

  const handleVideoSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setVideoCurrentTime(val);
    }
  };

  const handleVideoMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleVideoVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVideoVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsVideoMuted(val === 0);
    }
  };

  const toggleVideoFullscreen = () => {
    const playerContainer = document.getElementById('agreyflix-custom-video-container');
    if (playerContainer) {
      if (!document.fullscreenElement) {
        playerContainer.requestFullscreen()
          .catch(err => console.error("Error enabling full-screen:", err));
      } else {
        document.exitFullscreen();
      }
    }
  };

  const showVideoControlsWithTimeout = () => {
    setShowVideoControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isVideoPlaying) {
        setShowVideoControls(false);
      }
    }, 4000);
  };

  // Audio Events handler
  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleAudioPlayPause = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsAudioPlaying(true))
          .catch(err => console.error(err));
      }
    }
  };

  const handleAudioSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setAudioCurrentTime(val);
    }
  };

  const handleAudioVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setAudioVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleAudioMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isAudioMuted;
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Beautiful Visualizer loop for audio playing
  const startVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 110;

    const barCount = 42;
    const barWidth = (canvas.width / barCount) - 3;
    const bars = Array.from({ length: barCount }, () => Math.random() * 20 + 5);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw smooth, pulsating gradient equalizer bars
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#ef4444'); // Red accent
      gradient.addColorStop(0.5, '#f87171');
      gradient.addColorStop(1, '#ffffff');

      for (let i = 0; i < barCount; i++) {
        // Oscillate with standard sine waves for a super realistic equalizer feel
        const rate = 0.03 + (i * 0.005);
        const factor = Math.sin(Date.now() * rate) * 0.4 + 0.6;
        const targetHeight = isAudioPlaying ? (Math.random() * 70 + 10) * factor : 4;
        
        // Smooth transition
        bars[i] = bars[i] * 0.7 + targetHeight * 0.3;

        const x = i * (barWidth + 3);
        const y = canvas.height - bars[i];

        // Draw pill-shaped rounded bars
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, bars[i], 3);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Fast-seek helper
  const handleDoubleTapVideoSeek = (direction) => {
    if (videoRef.current) {
      const skip = direction === 'forward' ? 10 : -10;
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + skip));
      showVideoControlsWithTimeout();
    }
  };

  // Trigger HUD toast notifications on top of video overlay
  const triggerVideoToast = (message) => {
    setVideoToast(message);
  };

  // Automatically clear video toast after delay
  useEffect(() => {
    if (videoToast) {
      const t = setTimeout(() => setVideoToast(null), 2000);
      return () => clearTimeout(t);
    }
  }, [videoToast]);

  // Toggle Video Aspect Ratio Aspect
  const toggleVideoAspectRatio = () => {
    const modes = ['contain', 'cover', 'fill'];
    const nextIdx = (modes.indexOf(videoAspectRatio) + 1) % modes.length;
    const nextMode = modes[nextIdx];
    setVideoAspectRatio(nextMode);
    triggerVideoToast(`Aspect Ratio: ${nextMode.toUpperCase()}`);
  };

  // Toggle Picture in Picture Mode
  const toggleVideoPiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        triggerVideoToast("Exited PiP Mode");
      } else {
        await videoRef.current.requestPictureInPicture();
        triggerVideoToast("PiP Mode Activated");
      }
    } catch (e) {
      console.error(e);
      triggerVideoToast("PiP Mode Not Supported");
    }
  };

  // Audio track switching forward/backward
  const handlePrevAudioTrack = () => {
    if (localMusic.length <= 1 || !currentAudio) return;
    if (isShuffleEnabled) {
      const randomIdx = Math.floor(Math.random() * localMusic.length);
      handlePlayAudio(localMusic[randomIdx]);
      return;
    }
    const currIdx = localMusic.findIndex(x => x.id === currentAudio.id);
    const prevIdx = currIdx <= 0 ? localMusic.length - 1 : currIdx - 1;
    handlePlayAudio(localMusic[prevIdx]);
  };

  const handleNextAudioTrack = () => {
    if (localMusic.length <= 1 || !currentAudio) return;
    if (isShuffleEnabled) {
      let randomIdx = Math.floor(Math.random() * localMusic.length);
      if (randomIdx === localMusic.findIndex(x => x.id === currentAudio.id) && localMusic.length > 1) {
        randomIdx = (randomIdx + 1) % localMusic.length;
      }
      handlePlayAudio(localMusic[randomIdx]);
      return;
    }
    const currIdx = localMusic.findIndex(x => x.id === currentAudio.id);
    const nextIdx = currIdx >= localMusic.length - 1 ? 0 : currIdx + 1;
    handlePlayAudio(localMusic[nextIdx]);
  };

  // Searching discovered files
  const filteredVideos = localVideos.filter(item => 
    item.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMusic = localMusic.filter(item => 
    item.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#060606] text-white py-20 px-4 md:px-10 pb-36">
      
      {/* 1. Android Permission Mock Modal Dialog */}
      {permissionStatus === 'prompt' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-3xl bg-[#18181A] border border-white/5 p-6 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-red-500" />
            
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-500 mb-5">
              <FaShieldAlt className="text-3xl" />
            </div>

            <h3 className="text-xl font-black mb-2 tracking-tight">Android Media Permission Required</h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              AgreyFlix needs standard system permissions (<code className="text-red-400 text-xs font-mono">READ_MEDIA_VIDEO</code> and <code className="text-red-400 text-xs font-mono">READ_MEDIA_AUDIO</code>) to scan and playback media stored locally on your device.
            </p>

            <div className="flex flex-col gap-2.5">
              <button 
                onClick={grantPermission}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm tracking-wide uppercase transition-all shadow-lg active:scale-95"
              >
                Allow Access to Local Media
              </button>
              <button 
                onClick={denyPermission}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-sm tracking-wide transition-all"
              >
                Don't allow
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto">
        
        {/* Header Branding */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs bg-red-600/20 text-red-500 font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                Offline Mode
              </span>
              <span className="text-xs bg-emerald-600/20 text-emerald-500 font-black tracking-widest px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                <FaCheck className="text-[9px]" /> MediaStore API
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              Device <span className="text-red-500">Media Library</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Browse, search, and enjoy video and music files stored directly on your phone or PC.
            </p>
          </div>

          {/* Library Controls / Media Actions */}
          {permissionStatus === 'granted' && (
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => folderInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
                title="Select a whole folder to index"
              >
                <FaFolderOpen className="text-red-500 text-sm" /> Select Folder
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 cursor-pointer"
                title="Select multiple files to play"
              >
                <FaFolder className="text-sm" /> Scan Media Files
              </button>

              {(localVideos.length > 0 || localMusic.length > 0) && (
                <button 
                  onClick={clearLibrary}
                  className="p-2.5 rounded-xl bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-500 transition-colors border border-white/5"
                  title="Clear Indexed Cache"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hidden inputs for scanner */}
        <input 
          type="file" 
          ref={folderInputRef}
          className="hidden"
          webkitdirectory="true"
          directory="true"
          multiple
          onChange={(e) => handleMediaFiles(e.target.files)}
        />
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="video/*,audio/*"
          onChange={(e) => handleMediaFiles(e.target.files)}
        />

        {/* 2. Media Store Scanning Overlay Progress Animation */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-6 rounded-2xl bg-[#111112] border border-red-500/10 shadow-xl overflow-hidden relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-red-500 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  MediaStore Scan Active
                </span>
                <span className="text-xs text-zinc-500 font-mono">{scanProgress}%</span>
              </div>
              
              <div className="w-full bg-white/5 h-2 rounded-full mb-4 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${scanProgress}%` }}
                />
              </div>

              {/* Scanning Logs Terminal */}
              <div className="bg-[#080809] rounded-lg p-3 font-mono text-[11px] text-zinc-400 h-32 overflow-y-auto flex flex-col-reverse gap-1 border border-white/5 scrollbar-thin">
                {scanLogs.length === 0 ? (
                  <span className="text-zinc-600">Initializing MediaStore components...</span>
                ) : (
                  scanLogs.map((log, idx) => (
                    <div key={idx} className="truncate">
                      <span className="text-red-500 mr-2">&gt;</span>{log}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Permission Denied Handler Screen */}
        {permissionStatus === 'denied' && (
          <div className="p-10 text-center rounded-3xl bg-[#0D0D0E] border border-white/5">
            <FaShieldAlt className="text-4xl text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-1">Local Device Library is locked</h3>
            <p className="text-zinc-500 text-sm max-w-md mx-auto mb-5">
              Permissions were denied. To play media from your device, grant AgreyFlix standard media access.
            </p>
            <button 
              onClick={resetPermission}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all"
            >
              Reset Permission Prompt
            </button>
          </div>
        )}

        {/* 4. Active Library UI Grid and Lists */}
        {permissionStatus === 'granted' && (
          <>
            {/* SEARCH AND TAB TOGGLES */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              {/* Tabs */}
              <div className="flex bg-[#111112] rounded-xl p-1 border border-white/5 w-full sm:w-auto">
                <button 
                  onClick={() => setActiveTab('videos')}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'videos' 
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FaVideo /> Videos ({localVideos.length})
                </button>
                <button 
                  onClick={() => setActiveTab('music')}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'music' 
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FaMusic /> Music & Audio ({localMusic.length})
                </button>
              </div>

              {/* Search input bar */}
              <div className="relative w-full sm:w-72">
                <FaSearch className="absolute left-3.5 top-3.5 text-zinc-500 text-xs" />
                <input 
                  type="text"
                  placeholder={`Search local ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111112] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:border-red-500/40 text-white transition-all"
                />
              </div>
            </div>

            {/* RECENTLY PLAYED SECTION */}
            {recentlyPlayed.length > 0 && !searchQuery && (
              <div className="mb-10">
                <h3 className="text-sm font-black uppercase tracking-wider text-red-500 mb-4 flex items-center gap-2">
                  <FaClock className="text-xs" /> Recently Played Local Media
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {recentlyPlayed.map((item) => {
                    const isVideo = item.type.startsWith('video');
                    return (
                      <div 
                        key={item.id}
                        onClick={() => {
                          // Find corresponding live object in arrays
                          const sourceList = isVideo ? localVideos : localMusic;
                          const matched = sourceList.find(x => x.id === item.id);
                          if (matched) {
                            isVideo ? handlePlayVideo(matched) : handlePlayAudio(matched);
                          } else {
                            alert("⚠️ To play this, please authorize browser permissions by clicking 'Scan Media Files' and selecting your file folder again.");
                          }
                        }}
                        className="group bg-[#111112] hover:bg-[#18181a] border border-white/5 rounded-2xl p-3 cursor-pointer transition-all hover:-translate-y-1"
                      >
                        <div className="aspect-video rounded-xl overflow-hidden bg-black mb-2.5 relative flex items-center justify-center">
                          {isVideo ? (
                            item.thumbnail ? (
                              <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <FaFileVideo className="text-3xl text-zinc-700" />
                            )
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center relative">
                              <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.08)_0%,transparent_70%)] animate-pulse" />
                              <FaFileAudio className="text-3xl text-red-500/80" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                              <FaPlay className="text-xs ml-0.5" />
                            </span>
                          </div>
                        </div>
                        <h4 className="text-xs font-black truncate max-w-full text-zinc-200 group-hover:text-red-500 transition-colors">
                          {item.name}
                        </h4>
                        <span className="text-[10px] text-zinc-500 font-bold block mt-0.5">
                          {isVideo ? 'Local Video' : 'Local Music'} • {item.size}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MAIN EMPTY STATE */}
            {localVideos.length === 0 && localMusic.length === 0 && (
              <div className="text-center py-20 bg-[#0d0d0e] rounded-3xl border border-white/5">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 mb-4 animate-bounce">
                  <FaFolder className="text-2xl" />
                </div>
                <h3 className="text-lg font-black mb-1">Your Media Library is Empty</h3>
                <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6 px-4">
                  Scan folders or select files from your mobile storage using the scanning buttons above. All indexing runs offline on your device securely.
                </p>
                <div className="flex justify-center gap-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/20"
                  >
                    Select Local Files
                  </button>
                  <button 
                    onClick={() => folderInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/10"
                  >
                    Select Media Folder
                  </button>
                </div>
              </div>
            )}

            {/* TAB: VIDEOS LISTING GRID */}
            {activeTab === 'videos' && localVideos.length > 0 && (
              <>
                {filteredVideos.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-10">No videos match "{searchQuery}"</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {filteredVideos.map((video) => (
                      <div 
                        key={video.id}
                        onClick={() => handlePlayVideo(video)}
                        className="group bg-[#111112] hover:bg-[#151516] border border-white/5 rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        {/* Video Frame Preview / Generated Thumbnail */}
                        <div className="aspect-video bg-[#080809] relative flex items-center justify-center overflow-hidden border-b border-white/5">
                          {video.thumbnail ? (
                            <img src={video.thumbnail} alt={video.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <FaFileVideo className="text-4xl text-zinc-700" />
                          )}
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-zinc-300">
                            {video.size}
                          </div>
                          
                          {/* Hover Play Button */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform active:scale-95">
                              <FaPlay className="text-sm ml-0.5" />
                            </span>
                          </div>
                        </div>

                        {/* Video Metadata Panel */}
                        <div className="p-4">
                          <h4 className="font-bold text-sm text-zinc-100 truncate group-hover:text-red-500 transition-colors mb-1" title={video.fullName}>
                            {video.name}
                          </h4>
                          <span className="text-[10px] text-zinc-500 font-mono tracking-wider truncate block" title={video.path}>
                            {video.fullName.split('.').pop()?.toUpperCase()} • {video.path}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TAB: MUSIC LISTING ROW */}
            {activeTab === 'music' && localMusic.length > 0 && (
              <>
                {filteredMusic.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-10">No audio tracks match "{searchQuery}"</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {filteredMusic.map((audio) => {
                      const isCurrent = currentAudio?.id === audio.id;
                      return (
                        <div 
                          key={audio.id}
                          onClick={() => handlePlayAudio(audio)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all ${
                            isCurrent 
                              ? 'bg-red-600/10 border border-red-500/20' 
                              : 'bg-[#111112] hover:bg-[#151516] border border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Animated Vinyl if active */}
                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center shrink-0 border border-white/10 relative overflow-hidden ${
                              isCurrent && isAudioPlaying ? 'animate-spin' : ''
                            }`} style={{ animationDuration: '6s' }}>
                              <span className="absolute inset-1.5 rounded-full border border-dashed border-white/10" />
                              <span className="w-3 h-3 rounded-full bg-[#0d0d0e] z-10 border border-white/20" />
                              <FaMusic className={`text-sm z-5 ${isCurrent ? 'text-red-500' : 'text-zinc-500'}`} />
                            </div>

                            <div className="min-w-0">
                              <h4 className={`text-xs font-black truncate max-w-sm ${isCurrent ? 'text-red-500' : 'text-zinc-100'}`}>
                                {audio.name}
                              </h4>
                              <p className="text-[10px] text-zinc-500 font-bold truncate mt-0.5">
                                {audio.size} • {audio.fullName.split('.').pop()?.toUpperCase() || 'AUDIO'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isCurrent && isAudioPlaying ? (
                              <span className="flex items-end gap-0.5 h-3.5 pr-2">
                                <span className="w-0.5 bg-red-500 animate-[pulse_0.8s_infinite] h-3" />
                                <span className="w-0.5 bg-red-500 animate-[pulse_1.2s_infinite] h-4" />
                                <span className="w-0.5 bg-red-500 animate-[pulse_1s_infinite] h-2" />
                              </span>
                            ) : (
                              <button className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-red-600 text-white flex items-center justify-center transition-all text-[10px]">
                                <FaPlay className="ml-0.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>

      {/* 5. IMMERSIVE CUSTOM VIDEO PLAYER MODAL OVERLAY */}
      <AnimatePresence>
        {currentVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[120] flex items-center justify-center select-none"
            id="agreyflix-custom-video-container"
            onMouseMove={showVideoControlsWithTimeout}
            onTouchStart={showVideoControlsWithTimeout}
          >
            {/* Native player video viewport */}
            <video 
              ref={videoRef}
              src={currentVideo.url}
              className={`w-full h-full object-${videoAspectRatio}`}
              autoPlay
              playsInline
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onClick={handleVideoPlayPause}
              onEnded={() => {
                setIsVideoPlaying(false);
                showVideoControlsWithTimeout();
              }}
            />

            {/* Gesture skip tap panels */}
            <div 
              className="absolute top-20 bottom-20 left-0 w-1/4 z-10 cursor-pointer flex items-center justify-center active:bg-white/5 transition-colors"
              onDoubleClick={() => handleDoubleTapVideoSeek('backward')}
            >
              <span className="opacity-0 active:opacity-100 text-zinc-300 font-mono text-xs flex flex-col items-center gap-1 transition-opacity">
                <FaStepBackward /> -10s
              </span>
            </div>
            
            <div 
              className="absolute top-20 bottom-20 right-0 w-1/4 z-10 cursor-pointer flex items-center justify-center active:bg-white/5 transition-colors"
              onDoubleClick={() => handleDoubleTapVideoSeek('forward')}
            >
              <span className="opacity-0 active:opacity-100 text-zinc-300 font-mono text-xs flex flex-col items-center gap-1 transition-opacity">
                <FaStepForward /> +10s
              </span>
            </div>

            {/* Video Player Toast HUD Notification Overlay */}
            <AnimatePresence>
              {videoToast && (
                <motion.div 
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/85 border border-white/10 px-5 py-2 rounded-full text-white text-[11px] font-black tracking-widest uppercase shadow-2xl z-40 flex items-center gap-2 pointer-events-none"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                  {videoToast}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls Overlay UI */}
            <AnimatePresence>
              {showVideoControls && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/70 flex flex-col justify-between p-4 sm:p-6 z-20 pointer-events-auto"
                >
                  {/* Top Bar Controls */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-white truncate max-w-sm sm:max-w-md">{currentVideo.name}</h3>
                      <p className="text-[10px] text-zinc-400 font-bold truncate mt-0.5">Offline Video Stream</p>
                    </div>

                    <button 
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.pause();
                        }
                        setIsVideoPlaying(false);
                        setCurrentVideo(null);
                        // Clean up object URL memory
                        if (currentVideo.url) {
                          URL.revokeObjectURL(currentVideo.url);
                        }
                      }}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/10"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  {/* Centered Large Play/Pause Toggle */}
                  <div className="flex items-center justify-center gap-6">
                    <button 
                      onClick={() => handleDoubleTapVideoSeek('backward')}
                      className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-all"
                    >
                      <FaStepBackward />
                    </button>
                    <button 
                      onClick={handleVideoPlayPause}
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-lg shadow-lg shadow-red-600/30 transition-all active:scale-95"
                    >
                      {isVideoPlaying ? <FaPause /> : <FaPlay className="ml-1" />}
                    </button>
                    <button 
                      onClick={() => handleDoubleTapVideoSeek('forward')}
                      className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-all"
                    >
                      <FaStepForward />
                    </button>
                  </div>

                  {/* Bottom Bar Player Controls */}
                  <div className="flex flex-col gap-3">
                    
                    {/* Progress timeline bar */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold font-mono text-zinc-300">
                        {formatTime(videoCurrentTime)}
                      </span>
                      <input 
                        type="range"
                        min="0"
                        max={videoDuration || 100}
                        value={videoCurrentTime}
                        onChange={handleVideoSeek}
                        className="flex-1 accent-red-600 bg-white/20 rounded-full h-1 h-hover-3 outline-none cursor-pointer"
                      />
                      <span className="text-[10px] font-bold font-mono text-zinc-300">
                        {formatTime(videoDuration)}
                      </span>
                    </div>

                    {/* Bottom toolbar */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-4">
                        {/* Volume controls */}
                        <div className="flex items-center gap-2">
                          <button onClick={handleVideoMuteToggle} className="text-zinc-300 hover:text-white transition-colors">
                            {isVideoMuted || videoVolume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
                          </button>
                          <input 
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isVideoMuted ? 0 : videoVolume}
                            onChange={handleVideoVolumeChange}
                            className="w-16 accent-red-600 bg-white/20 rounded-full h-1 outline-none"
                          />
                        </div>

                        {/* Playback speed multiplier */}
                        <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded text-[10px] font-bold">
                          <FaSlidersH className="text-[9px]" />
                          <select 
                            value={videoPlaybackSpeed}
                            onChange={(e) => {
                              const speed = parseFloat(e.target.value);
                              setVideoPlaybackSpeed(speed);
                              if (videoRef.current) videoRef.current.playbackRate = speed;
                              triggerVideoToast(`Speed: ${speed}x`);
                            }}
                            className="bg-transparent border-none outline-none text-white cursor-pointer"
                          >
                            <option value="0.5" className="bg-[#18181a]">0.5x</option>
                            <option value="1.0" className="bg-[#18181a]">Normal</option>
                            <option value="1.25" className="bg-[#18181a]">1.25x</option>
                            <option value="1.5" className="bg-[#18181a]">1.5x</option>
                            <option value="2.0" className="bg-[#18181a]">2x</option>
                          </select>
                        </div>
                      </div>

                      {/* Extra Aspect-Ratio & PiP Controls */}
                      <div className="flex items-center gap-2">
                        {/* Picture-in-Picture */}
                        <button 
                          onClick={toggleVideoPiP}
                          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all text-xs"
                          title="Picture-in-Picture"
                        >
                          <FaTv />
                        </button>

                        {/* Aspect Ratio Cycler */}
                        <button 
                          onClick={toggleVideoAspectRatio}
                          className="px-2.5 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all text-[9px] font-black uppercase tracking-widest"
                          title="Aspect Ratio (Fit / Fill / Stretch)"
                        >
                          {videoAspectRatio}
                        </button>

                        {/* Fullscreen Button */}
                        <button 
                          onClick={toggleVideoFullscreen}
                          className="p-2 text-zinc-300 hover:text-white transition-all text-sm"
                        >
                          {document.fullscreenElement ? <FaCompress /> : <FaExpand />}
                        </button>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. GLOWING NATIVE AUDIO PLAYER BOTTOM BAR / CONTROL DRAWER */}
      <AnimatePresence>
        {currentAudio && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[68px] md:bottom-0 left-0 right-0 z-40 bg-[#0F0F10] border-t border-white/5 py-3.5 px-4 md:py-5 md:px-6 shadow-2xl flex flex-col gap-3 md:gap-4 pointer-events-auto"
          >
            {/* Secondary invisible HTML5 player container */}
            <audio 
              ref={audioRef}
              onTimeUpdate={handleAudioTimeUpdate}
              onLoadedMetadata={handleAudioLoadedMetadata}
              onEnded={() => {
                if (audioLoop) {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(e => console.error(e));
                  }
                } else {
                  handleNextAudioTrack();
                }
              }}
            />

            {/* Immersive Audio Layout */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-6xl mx-auto w-full">
              
              {/* Media Title & Dynamic canvas audio visualizer wave */}
              <div className="flex items-center gap-4 min-w-0 md:w-1/3">
                {/* Album Vinyl disk Art */}
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-red-600/30 to-zinc-950 flex items-center justify-center shrink-0 border border-red-500/10 relative overflow-hidden shadow-lg shadow-red-600/10 ${
                  isAudioPlaying ? 'animate-[spin_8s_linear_infinite]' : ''
                }`}>
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.12)_0%,transparent_70%)]" />
                  <span className="w-4 h-4 rounded-full bg-[#0F0F10] border border-zinc-800 z-10 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  </span>
                  <FaMusic className="text-sm text-red-500 absolute opacity-30" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-sm text-zinc-100 truncate">{currentAudio.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-bold truncate mt-0.5">
                    {currentAudio.artist} • {currentAudio.size}
                  </p>
                </div>
              </div>

              {/* Equalisers drawing inside player bar */}
              <div className="hidden md:block w-1/4 relative px-2">
                <canvas ref={canvasRef} className="w-full opacity-70" />
              </div>

              {/* Audio Playback control Panel buttons */}
              <div className="flex flex-col gap-1.5 md:w-1/3 w-full">
                <div className="flex items-center justify-center gap-4">
                  {/* Shuffle Button */}
                  <button 
                    onClick={() => setIsShuffleEnabled(!isShuffleEnabled)}
                    className={`p-2 transition-colors text-xs ${isShuffleEnabled ? 'text-red-500 font-black' : 'text-zinc-500 hover:text-white'}`}
                    title="Shuffle Playback"
                  >
                    <FaRandom className={isShuffleEnabled ? 'animate-pulse' : ''} />
                  </button>

                  <button 
                    onClick={() => setAudioLoop(!audioLoop)}
                    className={`p-2 transition-colors text-xs ${audioLoop ? 'text-red-500' : 'text-zinc-500 hover:text-white'}`}
                    title="Toggle Loop"
                  >
                    <FaSync className={audioLoop ? 'animate-[spin_4s_linear_infinite]' : ''} />
                  </button>

                  <button 
                    onClick={handlePrevAudioTrack}
                    className="p-2.5 text-zinc-400 hover:text-white transition-colors text-sm"
                  >
                    <FaStepBackward />
                  </button>

                  <button 
                    onClick={handleAudioPlayPause}
                    className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg transition-all active:scale-90"
                  >
                    {isAudioPlaying ? <FaPause /> : <FaPlay className="ml-0.5" />}
                  </button>

                  <button 
                    onClick={handleNextAudioTrack}
                    className="p-2.5 text-zinc-400 hover:text-white transition-colors text-sm"
                  >
                    <FaStepForward />
                  </button>

                  <button 
                    onClick={() => {
                      if (audioRef.current) audioRef.current.pause();
                      setIsAudioPlaying(false);
                      setCurrentAudio(null);
                    }}
                    className="p-2 text-zinc-500 hover:text-white transition-colors text-xs"
                    title="Close Player"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Progress Timeline bar */}
                <div className="flex items-center gap-2.5">
                  <span className="text-[9px] font-mono font-bold text-zinc-500 w-8 text-right">
                    {formatTime(audioCurrentTime)}
                  </span>
                  <input 
                    type="range"
                    min="0"
                    max={audioDuration || 100}
                    value={audioCurrentTime}
                    onChange={handleAudioSeek}
                    className="flex-1 accent-red-600 bg-white/10 rounded-full h-1 outline-none cursor-pointer"
                  />
                  <span className="text-[9px] font-mono font-bold text-zinc-500 w-8">
                    {formatTime(audioDuration)}
                  </span>
                </div>
              </div>

              {/* Volume & Audio Speed controls */}
              <div className="hidden md:flex items-center justify-end gap-4 w-1/4">
                {/* Audio playback speed multiplier */}
                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded text-[9px] font-bold">
                  <FaSlidersH className="text-[8px]" />
                  <select 
                    value={audioPlaybackSpeed}
                    onChange={(e) => {
                      const speed = parseFloat(e.target.value);
                      setAudioPlaybackSpeed(speed);
                      if (audioRef.current) {
                        audioRef.current.playbackRate = speed;
                      }
                    }}
                    className="bg-transparent border-none outline-none text-zinc-400 cursor-pointer text-[10px]"
                  >
                    <option value="0.75" className="bg-[#18181a] text-white">0.75x</option>
                    <option value="1.0" className="bg-[#18181a] text-white">Normal</option>
                    <option value="1.25" className="bg-[#18181a] text-white">1.25x</option>
                    <option value="1.5" className="bg-[#18181a] text-white">1.5x</option>
                    <option value="2.0" className="bg-[#18181a] text-white">2x</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={toggleAudioMute} className="text-zinc-500 hover:text-white transition-colors">
                    {isAudioMuted || audioVolume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
                  </button>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isAudioMuted ? 0 : audioVolume}
                    onChange={handleAudioVolumeChange}
                    className="w-20 accent-red-600 bg-white/10 rounded-full h-1 outline-none"
                  />
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
