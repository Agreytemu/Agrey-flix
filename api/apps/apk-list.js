const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = async (req, res) => {
  try {
    const publicDir = path.join(process.cwd(), 'public');

    if (!fs.existsSync(publicDir)) {
      return res.status(200).json({ success: true, apks: [] });
    }

    const files = fs.readdirSync(publicDir).filter((f) => f.toLowerCase().endsWith('.apk'));

    const apks = files.map((filename) => {
      const full = path.join(publicDir, filename);
      const stat = fs.statSync(full);
      let sha = null;
      try {
        const buffer = fs.readFileSync(full);
        sha = crypto.createHash('sha256').update(buffer).digest('hex');
      } catch (err) {
        // ignore hashing errors
        sha = null;
      }

      return {
        filename,
        version: filename.replace(/\.apk$/i, ''),
        size: formatBytes(stat.size),
        bytes: stat.size,
        updated: stat.mtime.toISOString(),
        sha,
        // Serve from the site root (Vercel will expose public/ files at /<filename>)
        url: `/${encodeURIComponent(filename)}`,
        // Raw GitHub fallback
        raw: `https://raw.githubusercontent.com/Agreytemu/Agrey-flix/main/public/${encodeURIComponent(filename)}`,
      };
    });

    // Cache briefly on the edge
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ success: true, apks });
  } catch (err) {
    console.error('apk-list error', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal error' });
  }
};
