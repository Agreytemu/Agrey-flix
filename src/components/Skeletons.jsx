import React from 'react';

/**
 * A single pulsating movie card skeleton.
 * Matches ContentCard dimensions and layout.
 */
export function MovieCardSkeleton() {
  return (
    <div className="w-full rounded-xl overflow-hidden ring-1 ring-white/5 bg-[#0d1117] flex flex-col animate-pulse">
      {/* Aspect ratio 2/3 for poster */}
      <div className="relative w-full aspect-[2/3] bg-zinc-800/65">
        {/* Placeholder badge top-left */}
        <div className="absolute top-2 left-2 w-12 h-4 bg-zinc-700/50 rounded-md" />
        {/* Placeholder rating top-right */}
        <div className="absolute top-2 right-2 w-10 h-4 bg-zinc-700/50 rounded-md" />
      </div>
      {/* Text information */}
      <div className="px-2.5 pt-2 pb-2.5 shrink-0 bg-[#0d1117] space-y-2">
        <div className="h-3.5 bg-zinc-800 rounded w-4/5" />
        <div className="h-2.5 bg-zinc-850 rounded w-2/5" />
      </div>
    </div>
  );
}

/**
 * A grid of MovieCardSkeletons.
 * Matches the layout of Category Movie Pages.
 */
export function MovieGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <MovieCardSkeleton key={idx} />
      ))}
    </div>
  );
}

/**
 * A horizontal row of MovieCardSkeletons.
 * Matches TrendingRow horizontal slider.
 */
export function TrendingRowSkeleton({ title = "" }) {
  return (
    <section className="px-4 sm:px-6 md:px-12 relative group z-30 mb-10 animate-pulse">
      <div className="flex justify-between items-end mb-4">
        {/* Title placeholder */}
        {title ? (
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight border-l-4 border-red-600 pl-3">
            {title}
          </h3>
        ) : (
          <div className="h-6 w-48 bg-zinc-800 rounded-md ml-3" />
        )}
        <div className="h-4 w-12 bg-zinc-850 rounded" />
      </div>
      
      <div className="flex gap-5 md:gap-6 overflow-x-hidden pb-6 -mx-4 px-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div 
            key={idx} 
            className="flex-shrink-0 w-[150px] sm:w-[170px] md:w-[190px] lg:w-[210px] xl:w-[230px]"
          >
            <MovieCardSkeleton />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Premium Hero Banner Skeleton.
 * Matches HeroBanner size and layout.
 */
export function HeroBannerSkeleton() {
  return (
    <div className="relative w-full h-[85vh] sm:h-[90vh] bg-[#0c0d14] overflow-hidden flex items-center animate-pulse">
      {/* Background subtle placeholder */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/60 to-zinc-950/20" />
      
      {/* Gradients to blend */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 md:from-black/80 via-black/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 md:via-transparent to-transparent z-10" />

      {/* Hero content skeleton */}
      <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-8 md:px-16 w-full md:w-2/3 max-w-3xl z-20 space-y-4">
        {/* Category indicator / badge */}
        <div className="flex gap-2 items-center">
          <div className="w-24 h-5 bg-zinc-850 rounded" />
          <div className="w-16 h-5 bg-zinc-850 rounded" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="w-[80%] max-w-lg h-10 sm:h-12 bg-zinc-800 rounded-md" />
          <div className="w-[60%] max-w-md h-10 sm:h-12 bg-zinc-800 rounded-md sm:hidden" />
        </div>

        {/* Rating/Meta row */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-4.5 bg-zinc-850 rounded" />
          <div className="w-10 h-4.5 bg-zinc-850 rounded" />
          <div className="w-16 h-4.5 bg-zinc-850 rounded" />
          <div className="w-16 h-4.5 bg-zinc-850 rounded" />
        </div>

        {/* Description block (3 lines) */}
        <div className="space-y-2 pt-2 max-w-2xl">
          <div className="w-full h-4 bg-zinc-850/80 rounded" />
          <div className="w-[95%] h-4 bg-zinc-850/80 rounded" />
          <div className="w-[70%] h-4 bg-zinc-850/80 rounded" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-4">
          <div className="w-32 h-11 md:h-13 bg-zinc-800 rounded-full" />
          <div className="w-32 h-11 md:h-13 bg-zinc-850 rounded-full border border-zinc-800" />
        </div>
      </div>

      {/* Slider indicators */}
      <div className="absolute bottom-10 right-10 z-30 flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className={`h-1.5 rounded-full bg-zinc-800 ${idx === 0 ? 'w-8 bg-zinc-700' : 'w-4'}`} />
        ))}
      </div>
    </div>
  );
}

/**
 * Full HomePage skeleton loader.
 * Renders HeroBannerSkeleton, Continue Watching, Trending Now, and other rows.
 */
export function HomePageSkeleton() {
  return (
    <div className="pb-20 bg-[#050505] min-h-screen">
      <HeroBannerSkeleton />
      
      <div className="relative z-20 -mt-24 sm:-mt-32 space-y-12">
        {/* Continue Watching skeleton */}
        <TrendingRowSkeleton title="Continue Watching" />
        {/* Trending Now skeleton */}
        <TrendingRowSkeleton title="Trending Now" />
        {/* Recently Added skeleton */}
        <TrendingRowSkeleton title="Recently Added" />
        {/* Popular skeleton */}
        <TrendingRowSkeleton title="Top 10 This Week" />
      </div>
    </div>
  );
}
