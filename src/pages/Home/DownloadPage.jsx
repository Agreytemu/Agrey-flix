import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import AgreyFlixLoader from '../../components/AgreyFlixLoader';

export default function DownloadPage() {
  const { type, slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    let device = 'computer';
    if (/iphone|ipad|ipod/i.test(ua)) {
      device = 'ios';
    } else if (/android/i.test(ua)) {
      device = 'android';
    }

    const query = searchParams.toString();
    const targetPath = `/download/${type}/${slug}/${device}${query ? `?${query}` : ''}`;
    navigate(targetPath, { replace: true });
  }, [type, slug, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
      <AgreyFlixLoader text="Detecting system compatibility..." />
    </div>
  );
}
