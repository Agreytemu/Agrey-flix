import React, { useState, useEffect } from 'react';
import TrendingRow from '../pages/Home/TrendingRow';
import { TrendingRowSkeleton } from './Skeletons';
import { fetchTmdb } from '../utils/tmdb';

export default function TrendingNowCarousel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchTrending = async () => {
      setLoading(true);
      try {
        // Fetch multiple pages of both weekly and daily trends to ensure high variety
        const urls = [
          '/trending/all/week?page=1',
          '/trending/all/week?page=2',
          '/trending/all/day?page=1',
        ];
        
        const responses = await Promise.all(urls.map(url => fetchTmdb(url)));
        const allResults = [];
        
        for (const res of responses) {
          if (res.ok) {
            const data = await res.json();
            if (data && data.results) {
              allResults.push(...data.results);
            }
          }
        }

        if (!cancelled) {
          // Deduplicate by media ID
          const seen = {};
          const uniqueList = [];
          
          allResults.forEach(item => {
            if (item && item.id && !seen[item.id]) {
              seen[item.id] = true;
              uniqueList.push({
                ...item,
                type: item.media_type || 'movie',
                poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
              });
            }
          });

          // Sort by popularity to present the absolute hottest titles
          uniqueList.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

          setItems(uniqueList);
        }
      } catch (error) {
        console.error("Error fetching trending in Carousel:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTrending();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <TrendingRowSkeleton title="Trending Now" />;
  }

  if (items.length === 0) return null;

  return <TrendingRow title="Trending Now" items={items} useNumbers={true} />;
}

