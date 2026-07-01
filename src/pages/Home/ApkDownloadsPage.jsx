import React, { useEffect, useState } from 'react';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';

export default function ApkDownloadsPage() {
  const [files, setFiles] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch list of files in public/ from GitHub API
    fetch('https://api.github.com/repos/Agreytemu/Agrey-flix/contents/public')
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const apks = data
          .filter((f) => typeof f.name === 'string' && f.name.toLowerCase().endsWith('.apk'))
          .map((f) => ({ name: f.name, size: f.size, download_url: f.download_url, html_url: f.html_url }));
        setFiles(apks);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Failed to fetch APK list');
      });
  }, []);

  function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold mb-3">APK Downloads</h1>
        <p className="mb-6 text-gray-300">Browse and download APK releases hosted in this repository's public/ folder.</p>

        {!files && !error && <AgreyFlixLoader text="Loading APKs..." />}

        {error && (
          <div className="bg-red-600/20 border border-red-600 p-4 rounded mb-4">
            <strong className="block">Error</strong>
            <div className="text-sm">{error}</div>
            <div className="text-xs text-gray-300 mt-2">You can still download directly from the raw GitHub URL if necessary.</div>
          </div>
        )}

        {files && files.length === 0 && (
          <div className="bg-yellow-600/10 border border-yellow-600 p-4 rounded mb-4 text-yellow-200">No APK files found in public/.</div>
        )}

        {files && files.length > 0 && (
          <ul className="space-y-3">
            {files.map((f) => (
              <li key={f.name} className="flex items-center justify-between bg-[#0f1724] p-4 rounded">
                <div>
                  <div className="font-medium">{f.name}</div>
                  <div className="text-sm text-gray-400">Size: {formatBytes(f.size)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={`${window.location.origin}/${f.name}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    download
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                  <a
                    href={f.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 underline"
                    title="Open raw GitHub download"
                  >
                    Raw
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 text-xs text-gray-500">If you see index.html instead of the APK, clear service worker caches or open the Raw link.</div>
      </div>
    </div>
  );
}
