/**
 * AgreyFlix Security Hardening Utilities
 * Implementation of defensive programming: input sanitization, password policy validation,
 * client-side rate limiting, audit logging, and safe file uploads validation.
 */

/**
 * Escapes dangerous characters to prevent HTML/JS/CSS injection (XSS).
 * @param {string} str - User-supplied string
 * @returns {string} - Escaped string
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;');
}

/**
 * Strips dangerous injection payloads while keeping safe readable text.
 * @param {string} str - User-supplied string
 * @returns {string} - Clean sanitized string
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  // Remove scripts completely
  let clean = str.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  // Remove inline onXXX handlers and javascript: URIs
  clean = clean.replace(/on\w+\s*=\s*["']\s*[^"']*["']/gi, '');
  clean = clean.replace(/href\s*=\s*["']\s*javascript:[^"']*["']/gi, '');
  // Escape standard tags
  return escapeHTML(clean.trim());
}

/**
 * Recursively sanitizes properties of an object to secure incoming payloads.
 * @param {object} obj - The input object
 * @returns {object} - Sanitzed object
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'string') {
        copy[key] = sanitizeInput(obj[key]);
      } else if (typeof obj[key] === 'object') {
        copy[key] = sanitizeObject(obj[key]);
      } else {
        copy[key] = obj[key];
      }
    }
  }
  return copy;
}

/**
 * Enforces a strong password security policy:
 * - 8 to 20 characters
 * - Minimum 1 uppercase letter
 * - Minimum 1 lowercase letter
 * - Minimum 1 number
 * - Minimum 1 special character
 * @param {string} password 
 * @returns {object} - { isValid: boolean, message: string }
 */
export function validatePassword(password) {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 20) {
    return { isValid: false, message: 'Password must not exceed 20 characters.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number (0-9).' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (e.g. @, #, $, !).' };
  }
  return { isValid: true, message: 'Password meets all security criteria.' };
}

/**
 * Calculates password complexity rating on a scale of 0 to 4.
 * @param {string} password 
 * @returns {object} - { score: number, label: string, color: string }
 */
export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: 'None', color: 'bg-zinc-800' };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (password.length >= 12 && score === 5) {
    return { score: 4, label: 'Very Strong', color: 'bg-emerald-500' };
  }
  if (score >= 4) {
    return { score: 3, label: 'Strong', color: 'bg-green-500' };
  }
  if (score >= 3) {
    return { score: 2, label: 'Medium', color: 'bg-yellow-500' };
  }
  if (score >= 2) {
    return { score: 1, label: 'Weak', color: 'bg-orange-500' };
  }
  return { score: 0, label: 'Very Weak', color: 'bg-red-500' };
}

/**
 * Session-based rate limiter to protect spam-prone user actions.
 * @param {string} action - Action name (e.g. 'login_attempt', 'report_submission')
 * @param {number} limit - Maximum allowed actions inside timeframe
 * @param {number} timeframeMs - Timeframe in milliseconds
 * @returns {boolean} - true if allowed, false if rate limited
 */
export function checkRateLimit(action, limit = 5, timeframeMs = 60000) {
  const key = `agreyflix_rl_${action}`;
  const now = Date.now();
  let attempts = [];
  
  try {
    const data = localStorage.getItem(key);
    if (data) {
      attempts = JSON.parse(data).filter(timestamp => now - timestamp < timeframeMs);
    }
  } catch (e) {
    console.warn('Rate limiter localStorage read error:', e);
  }

  if (attempts.length >= limit) {
    return false;
  }

  attempts.push(now);
  try {
    localStorage.setItem(key, JSON.stringify(attempts));
  } catch (e) {
    console.warn('Rate limiter localStorage write error:', e);
  }
  return true;
}

/**
 * Securely validates files intended for avatar seeds or profile file uploads.
 * @param {File} file 
 * @returns {object} - { isValid: boolean, error: string }
 */
export function validateUploadedFile(file) {
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit
  
  if (!file) {
    return { isValid: false, error: 'No file provided.' };
  }

  const extension = file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { isValid: false, error: `Unauthorized file extension. Allowed extensions are: ${allowedExtensions.join(', ')}` };
  }

  if (file.size > maxSizeBytes) {
    return { isValid: false, error: 'File size exceeds maximum limit of 5MB.' };
  }

  const dangerousMimeTypes = [
    'application/javascript', 
    'text/html', 
    'application/x-msdownload', 
    'application/x-sh', 
    'text/javascript'
  ];
  if (dangerousMimeTypes.includes(file.type)) {
    return { isValid: false, error: 'Malicious content type block trigger activated.' };
  }

  return { isValid: true, error: '' };
}

/**
 * Securely writes logs for critical security actions to localStorage for tracking.
 * @param {string} type - 'AUDIT' | 'ALERT' | 'SUCCESS' | 'FAILURE'
 * @param {string} msg - Action description details
 */
export function logSecurityEvent(type, msg) {
  try {
    const key = 'agreyflix_security_audit_logs';
    const log = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      type,
      message: msg
    };
    const saved = localStorage.getItem(key);
    const logs = saved ? JSON.parse(saved) : [];
    logs.unshift(log);
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 100))); // Keep last 100 logs
  } catch (e) {
    console.error('Failed to write security log:', e);
  }
}
