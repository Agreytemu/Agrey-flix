export const getTmdbUrl = (path) => {
  const baseUrl = 'https://api.themoviedb.org/3';
  const apiKey = import.meta.env.VITE_TMDB_API || '';
  
  let cleanBase = baseUrl.trim();
  if (cleanBase.endsWith('/')) {
    cleanBase = cleanBase.slice(0, -1);
  }
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  let targetUrl = `${cleanBase}${cleanPath}`;
  
  if (apiKey && !targetUrl.includes('api_key=')) {
    const separator = targetUrl.includes('?') ? '&' : '?';
    targetUrl = `${targetUrl}${separator}api_key=${apiKey}`;
  }
  
  return targetUrl;
};

export const fetchTmdb = async (path) => {
  const url = getTmdbUrl(path);
  let response;
  
  try {
    response = await fetch(url);
    
    // Check if the response contains HTML, which indicates a fallback/router match on local/proxy server
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error(`HTML response returned instead of JSON (CORS/Proxy Routing Issue). Current endpoint: ${url}`);
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(`API key is missing or invalid on your environment config (Status 401 Unauthorized)`);
      }
      throw new Error(`TMDB returned an error with status: ${response.status}`);
    }
    return response;
  } catch (error) {
    console.warn(`TMDB Proxy Fetch failed for ${path}, trying direct TMDB fallback:`, error);
    
    const fallbackBase = 'https://api.themoviedb.org/3';
    const apiKey = import.meta.env.VITE_TMDB_API || '';
    
    // Diagnostic hints for the direct error display
    if (!apiKey) {
      throw new Error(`TMDB API Key (VITE_TMDB_API) is not set in your project environment secrets! Please configure it to fetch media data.`);
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    let fallbackUrl = `${fallbackBase}${cleanPath}`;
    
    if (!fallbackUrl.includes('api_key=')) {
      const separator = fallbackUrl.includes('?') ? '&' : '?';
      fallbackUrl = `${fallbackUrl}${separator}api_key=${apiKey}`;
    }

    try {
      const fallbackRes = await fetch(fallbackUrl);
      if (!fallbackRes.ok) {
        if (fallbackRes.status === 401) {
          throw new Error(`TMDB API Key (VITE_TMDB_API) is invalid or expired (Status 401 Unauthorized).`);
        }
        if (fallbackRes.status === 404) {
          throw new Error(`TMDB endpoint not found (Status 404) for path: ${path}`);
        }
        throw new Error(`TMDB Direct API rejected with status: ${fallbackRes.status}`);
      }
      return fallbackRes;
    } catch (fallbackError) {
      // Re-throw if it has rich context already, otherwise wrap in network error
      if (fallbackError.message.includes('API') || fallbackError.message.includes('TMDB')) {
        throw fallbackError;
      }
      throw new Error(`Network Error: Failed to communicate with TMDB or your Railway Server. Please verify your internet connection or make sure your server is online. (Details: ${fallbackError.message})`);
    }
  }
};
