/**
 * Utility for interacting with the Railway streaming server backend.
 */

// Retrieve the base URL from the environment
const getBackendBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  let cleanUrl = (envUrl || '').trim();
  
  if (!cleanUrl) {
    // Graceful fallback to default value
    return 'https://vidsrcscraper-production.up.railway.app';
  }
  
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  
  return cleanUrl.endsWith('/') ? cleanUrl.slice(0, -1) : cleanUrl;
};

/**
 * Fetch streaming links from /extract
 * @param {string|number} tmdbId - The TMDB ID of the movie or tv show
 * @param {'movie'|'tv'} type - Media category
 * @param {number} [season] - Required for type="tv"
 * @param {number} [episode] - Required for type="tv"
 */
export const fetchStreamLinks = async (tmdbId, type, season = 1, episode = 1) => {
  const baseUrl = getBackendBaseUrl();
  let url = `${baseUrl}/extract?tmdb_id=${tmdbId}&type=${type}`;
  
  if (type === 'tv') {
    url += `&season=${season}&episode=${episode}`;
  }
  
  console.log(`[Extract API] Requesting streaming URL from: ${url}`);
  
  let response;
  try {
    response = await fetch(url);
  } catch (netErr) {
    throw new Error(`Network Connection Failure: Failed to connect to the streaming server at ${url}. Please verify that your Railway server is online and the 'VITE_API_BASE_URL' configuration is correct.`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error(`Configuration Error (Route Collision): The server returned an HTML page instead of JSON. This typically happens when 'VITE_API_BASE_URL' is empty or misconfigured to point to this client app instead of your Railway API.`);
  }

  if (!response.ok) {
    throw new Error(`Railway Server returned an HTTP error status: ${response.status} (Server Error).`);
  }
  
  try {
    const data = await response.json();
    console.log('[Extract API] Response data:', data);
    return data;
  } catch (jsonErr) {
    throw new Error(`Failed to read streaming data: The server response was not in the expected JSON format. (Error: ${jsonErr.message})`);
  }
};

/**
 * Resolve the best stream URL from the /extract response.
 * Prioritizes Real-Debrid flows, or falls back to any HLS URL.
 */
/**
 * Resolve the best stream URL from the /extract response.
 * Uses a highly resilient deep-recursive search to find any HLS (.m3u8) or video streaming URL,
 * completely ignoring any Real-Debrid entries as requested by the user.
 */
export const resolveStreamUrl = (data) => {
  if (!data) return null;

  // 1. Direct raw string starting with http
  if (typeof data === 'string' && data.startsWith('http')) {
    const lower = data.toLowerCase();
    if (!lower.includes('debrid') && !lower.includes('/rd/')) {
      return data;
    }
  }

  // 2. High priority checking: Check explicit property keys first to find optimal HLS stream
  const checkDirectProperties = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    
    // Scan array of sources if present
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = checkDirectProperties(item);
        if (found) return found;
      }
    } else {
      // Check priority stream keys in the current object level
      const priorityKeys = ['hls_url', 'stream_url', 'url', 'direct_url', 'streaming'];
      for (const key of priorityKeys) {
        const val = obj[key];
        if (val && typeof val === 'string' && val.startsWith('http')) {
          const valLower = val.toLowerCase();
          // Skip if it contains debrid elements
          if (!valLower.includes('debrid') && !valLower.includes('/rd/')) {
            return val;
          }
        }
      }

      // Check results child object (e.g. data.results["https://vidsrc.xyz"])
      if (obj.results && typeof obj.results === 'object') {
        for (const [provider, resultObj] of Object.entries(obj.results)) {
          if (provider.toLowerCase().includes('debrid')) continue;
          if (resultObj && typeof resultObj === 'object') {
            const found = checkDirectProperties(resultObj);
            if (found) return found;
          }
        }
      }

      // Recurse nesting
      if (obj.data && typeof obj.data === 'object') {
        const found = checkDirectProperties(obj.data);
        if (found) return found;
      }
    }
    return null;
  };

  const directStream = checkDirectProperties(data);
  if (directStream) return directStream;

  // 3. Fallback: Deep recursive search for ANY string value that looks like an HLS URL (.m3u8) or stream link
  const deepSearchUrl = (obj) => {
    if (!obj) return null;
    
    if (typeof obj === 'string') {
      const trimmed = obj.trim();
      if (trimmed.startsWith('http')) {
        const trimmedLower = trimmed.toLowerCase();
        // Fully exclude debrid files
        if (!trimmedLower.includes('debrid') && !trimmedLower.includes('/rd/')) {
          // If it looks like HLS (.m3u8) or a video file, return it
          if (trimmedLower.includes('.m3u8') || trimmedLower.includes('/playlist') || trimmedLower.includes('.mp4') || trimmedLower.includes('/embed/')) {
            return trimmed;
          }
        }
      }
      return null;
    }

    if (Array.isArray(obj)) {
      for (const val of obj) {
        const found = deepSearchUrl(val);
        if (found) return found;
      }
      return null;
    }

    if (typeof obj === 'object') {
      for (const [key, val] of Object.entries(obj)) {
        // Skip explicitly debrid properties
        if (key.toLowerCase().includes('debrid') || key.toLowerCase() === 'rd') {
          continue;
        }
        const found = deepSearchUrl(val);
        if (found) return found;
      }
    }
    return null;
  };

  const recursiveStream = deepSearchUrl(data);
  if (recursiveStream) return recursiveStream;

  // 4. Ultimate fallback: Return the first HTTP url that is not a debrid or subtitle/image link
  const ultimateSearchUrl = (obj) => {
    if (!obj) return null;
    
    if (typeof obj === 'string') {
      const trimmed = obj.trim();
      if (trimmed.startsWith('http')) {
        const trimmedLower = trimmed.toLowerCase();
        const isSubtitle = trimmedLower.includes('.vtt') || trimmedLower.includes('.srt') || trimmedLower.includes('.ass');
        const isImage = trimmedLower.includes('.jpg') || trimmedLower.includes('.png') || trimmedLower.includes('.webp') || trimmedLower.includes('.gif');
        const isDebrid = trimmedLower.includes('debrid') || trimmedLower.includes('/rd/');
        
        if (!isSubtitle && !isImage && !isDebrid) {
          return trimmed;
        }
      }
      return null;
    }

    if (Array.isArray(obj)) {
      for (const val of obj) {
        const found = ultimateSearchUrl(val);
        if (found) return found;
      }
      return null;
    }

    if (typeof obj === 'object') {
      for (const [key, val] of Object.entries(obj)) {
        if (key.toLowerCase().includes('debrid') || key.toLowerCase() === 'rd') {
          continue;
        }
        const found = ultimateSearchUrl(val);
        if (found) return found;
      }
    }
    return null;
  };

  return ultimateSearchUrl(data);
};

/**
 * Detects whether the active link is VidSrc provider. Real-Debrid has been removed entirely.
 */
export const getStreamSourceType = (data, resolvedUrl) => {
  return 'VidSrc';
};

/**
 * Fetch VTT subtitle tracks for TV series
 */
export const fetchTvSubtitles = async (title, season = 1, episode = 1) => {
  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}/tv-subtitles?title=${encodeURIComponent(title)}&season=${season}&episode=${episode}&type=tv`;
  
  console.log(`[Subtitles API] Fetching subtitles from: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : (data.subtitles || []);
  } catch (error) {
    console.error('[Subtitles API] Subtitles fetch failed:', error);
    return [];
  }
};

/**
 * Inspect server fitness status
 */
export const checkServerHealth = async () => {
  const baseUrl = getBackendBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/health`);
    return res.ok;
  } catch (e) {
    console.warn('[Health API] Server health check failed:', e);
    return false;
  }
};
