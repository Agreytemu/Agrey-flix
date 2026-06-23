import React, { useRef, useState, useCallback, useEffect } from 'react';
import ContentCard from './ContentCard';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function TrendingRow({ title, items, useNumbers = false }) {
  const listRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({ active: false, startX: 0, startScrollLeft: 0, moved: false });
  const suppressClickRef = useRef(false);

  const scrollLeft = () => {
    if (listRef.current) {
      listRef.current.scrollBy({ left: -window.innerWidth / 1.5, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (listRef.current) {
      listRef.current.scrollBy({ left: window.innerWidth / 1.5, behavior: 'smooth' });
    }
  };

  // Drag to scroll logic
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const el = listRef.current;
    if (!el) return;
    dragStateRef.current = { active: true, startX: e.pageX, startScrollLeft: el.scrollLeft, moved: false };
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((e) => {
    const el = listRef.current;
    const drag = dragStateRef.current;
    if (!el || !drag.active) return;
    const delta = e.pageX - drag.startX;
    if (Math.abs(delta) > 4) drag.moved = true;
    el.scrollLeft = drag.startScrollLeft - delta;
  }, []);

  const endDrag = useCallback(() => {
    const drag = dragStateRef.current;
    if (!drag.active) return;
    drag.active = false;
    suppressClickRef.current = drag.moved;
    setIsDragging(false);
    setTimeout(() => { suppressClickRef.current = false; }, 0);
  }, []);

  useEffect(() => {
    window.addEventListener('mouseup', endDrag);
    return () => window.removeEventListener('mouseup', endDrag);
  }, [endDrag]);

  if (!items || items.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 md:px-12 relative group z-30 mb-10">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-3 border-l-4 border-red-600 pl-3">
          {title}
        </h3>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs font-semibold text-gray-400 mr-2 uppercase self-center cursor-pointer hover:text-white">See All</span>
          <button onClick={scrollLeft} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><FaChevronLeft className="text-xs"/></button>
          <button onClick={scrollRight} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><FaChevronRight className="text-xs"/></button>
        </div>
      </div>
      
      <div 
        ref={listRef} 
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={endDrag}
        className={`flex gap-5 md:gap-6 overflow-x-auto hide-scrollbar pb-6 -mx-4 px-4 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        {items.map((item, idx) => (
          <div key={item.id || idx} className="relative flex-shrink-0 w-[150px] sm:w-[170px] md:w-[190px] lg:w-[210px] xl:w-[230px]">
            <div onClick={(e) => { if(suppressClickRef.current) e.stopPropagation(); }} className="h-full relative z-10 w-[150px] sm:w-[170px] md:w-[190px] lg:w-[210px] xl:w-[230px]">
               <ContentCard 
                 title={item.title} 
                 poster={item.poster_path} 
                 rating={item.vote_average} 
                 releaseDate={item.release_date}
                 mediaType={item.type || item.media_type}
                 mediaId={item.id}
                 rank={useNumbers ? idx + 1 : undefined}
                 isAnimation={item.isAnimation}
                 isUpcoming={item.isUpcoming}
                 genreIds={item.genre_ids}
               />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
