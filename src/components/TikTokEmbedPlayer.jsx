import React, { useEffect, useRef, useState } from 'react';

// Regular expression to parse TikTok video ID
export function getTikTokVideoId(url) {
  if (!url) return '';
  
  // Match standard: tiktok.com/@user/video/123456789
  const videoIdMatch = url.match(/\/video\/(\d+)/);
  if (videoIdMatch && videoIdMatch[1]) {
    return videoIdMatch[1];
  }
  
  // Match alternate: tiktok.com/v/123456789
  const vMatch = url.match(/\/v\/(\d+)/);
  if (vMatch && vMatch[1]) {
    return vMatch[1];
  }

  // Fallback: match any 15-22 digits sequence
  const anyDigitsMatch = url.match(/(\d{15,22})/);
  if (anyDigitsMatch && anyDigitsMatch[0]) {
    return anyDigitsMatch[0];
  }
  
  return '';
}

export default function TikTokEmbedPlayer({ url, title, className = '' }) {
  const containerRef = useRef(null);
  const videoId = getTikTokVideoId(url);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isIframeFallback, setIsIframeFallback] = useState(false);

  useEffect(() => {
    // Check if the URL is a shortened link which might lack a direct video ID in the text
    if (!videoId && url && (url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com') || url.includes('/t/'))) {
      setIsIframeFallback(false); // We must rely on blockquote's cite attribute for shortened links
    } else if (!videoId) {
      setIsIframeFallback(true);
    } else {
      setIsIframeFallback(false);
    }
  }, [url, videoId]);

  useEffect(() => {
    // If we can't extract video ID and it's not a shortened URL, we can't do much
    if (!url) return;

    // Load TikTok official script if not already present
    const scriptId = 'tiktok-embed-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
        if (window.tiktokEmbed) {
          window.tiktokEmbed.lib.render();
        }
      };
      document.body.appendChild(script);
    } else {
      setScriptLoaded(true);
      // If script is already loaded, trigger a render
      if (window.tiktokEmbed && window.tiktokEmbed.lib) {
        window.tiktokEmbed.lib.render();
      }
    }

    // Force TikTok embed engine to process the new blockquote
    const timeout = setTimeout(() => {
      if (window.tiktokEmbed && window.tiktokEmbed.lib) {
        window.tiktokEmbed.lib.render();
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [url, videoId]);

  // If we have a resolved video ID, use the direct responsive, full-scaling iframe to cover the container perfectly!
  if (videoId) {
    return (
      <div className={`relative w-full h-full bg-[#030303] overflow-hidden ${className}`}>
        <iframe
          src={`https://www.tiktok.com/embed/v2/${videoId}`}
          title={title || 'TikTok Video'}
          className="absolute inset-0 w-full h-full border-0 rounded-none md:rounded-3xl"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full flex items-center justify-center rounded-none md:rounded-3xl overflow-hidden bg-zinc-950/80 p-1 border border-white/5 ${className}`}
    >
      <blockquote 
        className="tiktok-embed animate-fade-in" 
        cite={url} 
        data-video-id={videoId || undefined}
        style={{ 
          maxWidth: '100%', 
          minWidth: '280px', 
          width: '100%', 
          height: '100%',
          margin: '0 auto',
          background: 'transparent'
        }}
      >
        <section className="p-6 text-center text-zinc-400 font-semibold text-xs animate-pulse">
          <p className="mb-2">Loading TikTok stream...</p>
          <a 
            target="_blank" 
            rel="noopener noreferrer" 
            href={url}
            className="text-red-500 hover:underline text-[10px] block truncate max-w-xs mx-auto"
          >
            {title || url}
          </a>
        </section>
      </blockquote>
    </div>
  );
}
