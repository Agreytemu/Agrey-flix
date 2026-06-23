import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, FaStar, FaBirthdayCake, FaMapMarkerAlt, 
  FaVenusMars, FaFire, FaFilm, FaChevronRight 
} from 'react-icons/fa';
import { fetchTmdb } from '../../../utils/tmdb';
import ContentCard from '../ContentCard';
import AgreyFlixLoader from '../../../components/AgreyFlixLoader';

export default function PersonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [person, setPerson] = useState(null);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedBio, setExpandedBio] = useState(false);

  useEffect(() => {
    let active = true;
    const loadPersonDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchTmdb(`/person/${id}?append_to_response=combined_credits`);
        if (!response.ok) throw new Error("Artist details could not be retrieved");
        const data = await response.json();
        
        if (active) {
          setPerson(data);
          
          // Sort user credits by popularity and unique items
          const castCredits = data.combined_credits?.cast || [];
          const uniqueCreditsMap = {};
          
          castCredits.forEach(item => {
            if (item.id && item.poster_path) {
              // Prefer credit entries with high rating and release dates
              const key = `${item.media_type}-${item.id}`;
              if (!uniqueCreditsMap[key] || (item.popularity || 0) > (uniqueCreditsMap[key].popularity || 0)) {
                uniqueCreditsMap[key] = item;
              }
            }
          });

          const sortedCredits = Object.values(uniqueCreditsMap)
            .sort((a, b) => (b.popularity || 0) * (b.vote_average || 5) - (a.popularity || 0) * (a.vote_average || 5))
            .slice(0, 24);

          setCredits(sortedCredits);
        }
      } catch (err) {
        console.error(err);
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPersonDetails();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center">
        <AgreyFlixLoader />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-950/20 border border-red-500/20 p-8 rounded-3xl max-w-md">
          <p className="text-red-400 font-bold text-lg mb-4">Network Connectivity Error</p>
          <p className="text-sm text-zinc-400 mb-6">{error || "Unable to load artist details at this moment."}</p>
          <button 
            onClick={() => navigate('/best-artists')}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 font-extrabold text-sm rounded-xl transition-all"
          >
            Go to Best Artists
          </button>
        </div>
      </div>
    );
  }

  const profileUrl = person.profile_path 
    ? `https://image.tmdb.org/t/p/h632${person.profile_path}`
    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(person.name)}&backgroundColor=dc2626`;

  // Try to find a gorgeous backdrop backdrop path from their popular movies/shows
  const firstBackdropPath = credits.find(c => c.backdrop_path)?.backdrop_path;
  const backdropUrl = firstBackdropPath
    ? `https://image.tmdb.org/t/p/w1280${firstBackdropPath}`
    : null;

  // Age calculations
  const calculateAge = (birthday, deathday) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const endDate = deathday ? new Date(deathday) : new Date();
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = endDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(person.birthday, person.deathday);

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 font-sans relative pb-20 overflow-x-hidden">
      {/* Immersive Cinematic Background */}
      <div className="absolute top-0 left-0 w-full h-[60vh] md:h-[70vh] pointer-events-none select-none overflow-hidden z-0">
        {backdropUrl ? (
          <div className="relative w-full h-full">
            <img 
              src={backdropUrl} 
              alt="" 
              className="w-full h-full object-cover opacity-20 blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-transparent to-[#07090e]" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-red-950/10 via-transparent to-[#07090e]" />
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 pt-6">
        {/* Navigation Action bar */}
        <button
          onClick={() => navigate('/best-artists')}
          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-xs font-black uppercase text-zinc-300 hover:text-white transition-all duration-300 pointer-events-auto"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          Back to Best Artists List
        </button>

        {/* Profile Content Section */}
        <div className="mt-8 flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Left Column: Portrait & Fast metrics */}
          <div className="w-full md:w-80 shrink-0 flex flex-col items-center md:items-start text-center md:text-left">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-full md:h-96 rounded-3xl overflow-hidden bg-zinc-900 ring-4 ring-red-500/35 shadow-2xl shadow-red-950/20 group"
            >
              <img 
                src={profileUrl} 
                alt={person.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07090e]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-red-600/95 px-3 py-1 rounded-full">
                  TMDB ID: {person.id}
                </span>
              </div>
            </motion.div>

            {/* Metric widgets */}
            <div className="mt-6 w-full grid grid-cols-2 gap-3">
              <div className="bg-[#0b0e14]/90 border border-white/5 p-3.5 rounded-2xl flex flex-col items-center">
                <FaFire className="text-red-500 text-lg mb-1" />
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-500">Popularity</span>
                <span className="text-sm font-black text-white mt-0.5">{Math.round(person.popularity)}</span>
              </div>
              <div className="bg-[#0b0e14]/90 border border-white/5 p-3.5 rounded-2xl flex flex-col items-center">
                <FaVenusMars className="text-amber-500 text-lg mb-1" />
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-500">Gender</span>
                <span className="text-sm font-black text-white mt-0.5">
                  {person.gender === 1 ? 'Female' : (person.gender === 2 ? 'Male' : 'N/A')}
                </span>
              </div>
            </div>

            {/* Birth/Death details */}
            <div className="mt-4 w-full bg-[#0b0e14]/70 border border-white/5 p-4 rounded-2xl flex flex-col gap-3 text-left">
              <div className="flex items-start gap-3">
                <FaBirthdayCake className="text-red-500/75 text-sm shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Birthdate</h4>
                  <p className="text-xs font-bold text-zinc-200 mt-0.5">
                    {person.birthday ? person.birthday : 'Unknown'}
                    {age ? ` (${age} yrs)` : ''}
                  </p>
                  {person.deathday && (
                    <p className="text-[10px] text-red-400 font-bold mt-0.5">Died: {person.deathday}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-white/5 pt-3">
                <FaMapMarkerAlt className="text-red-500/75 text-sm shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Place of Birth</h4>
                  <p className="text-xs font-bold text-zinc-200 mt-0.5 leading-relaxed">
                    {person.place_of_birth ? person.place_of_birth : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bio, Rank highlights and Work credits */}
          <div className="flex-1 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
              <div>
                <span className="text-xs font-extrabold text-red-500 uppercase tracking-widest bg-red-950/30 px-3 py-1 rounded-full border border-red-500/25">
                  {person.known_for_department || 'Acting'}
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mt-3">
                  {person.name}
                </h1>
              </div>

              {/* Custom Rank metrics badge */}
              <div className="bg-gradient-to-br from-red-950/30 to-[#0a0d14] border border-red-500/30 p-4 rounded-2xl flex flex-col items-center sm:items-end justify-center shrink-0">
                <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest leading-none">AgreyFlix ranking</span>
                <div className="flex items-baseline gap-1 mt-1.5 justify-center sm:justify-end">
                  <span className="text-[11px] font-bold text-zinc-400">Score Out of 10:</span>
                  <span className="text-2xl font-black font-mono text-red-400">
                    {Math.min(10.0, Math.max(1.0, parseFloat((3 + Math.log10(person.popularity + 1) * 2.5).toFixed(1))))}
                  </span>
                </div>
              </div>
            </div>

            {/* Biography */}
            <div className="mt-6">
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Biography</h2>
              <div className="mt-3 text-sm text-zinc-300 leading-relaxed font-normal bg-[#0b0e14]/50 border border-white/5 p-5 rounded-2xl relative overflow-hidden">
                <p className={`${!expandedBio && person.biography?.length > 400 ? 'line-clamp-5' : ''}`}>
                  {person.biography 
                    ? person.biography 
                    : `${person.name} is a distinguished artist recognized for exceptional contributions to the film industry. Explore their best work below.`
                  }
                </p>
                
                {person.biography && person.biography.length > 400 && (
                  <button
                    onClick={() => setExpandedBio(!expandedBio)}
                    className="mt-3.5 text-xs font-black text-red-400 hover:text-red-300 uppercase tracking-widest flex items-center gap-1.5 focus:outline-none"
                  >
                    {expandedBio ? 'Show Less' : 'Read More'}
                    <FaChevronRight className={`text-[10px] transform transition-transform ${expandedBio ? 'rotate-90' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Filamu/TV List Panel */}
            <div className="mt-8 flex-1">
              <div className="flex justify-between items-baseline border-b border-white/5 pb-3">
                <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <FaFilm className="text-red-500 text-sm" />
                  Famous Movies & Works ({credits.length})
                </h2>
                <span className="text-[10px] font-mono text-[#444a5e]">Popular work</span>
              </div>

              {credits.length === 0 ? (
                <div className="mt-6 text-center py-12 bg-zinc-950/20 border border-dashed border-white/5 rounded-2xl text-zinc-400 text-sm">
                  No movies available currently. This artist is preparing new exciting projects!
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {credits.map((item, idx) => (
                    <div key={`${item.media_type}-${item.id}`} className="flex flex-col">
                      <ContentCard 
                        mediaId={item.id}
                        mediaType={item.media_type}
                        title={item.title || item.name}
                        poster={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        posterPath={item.poster_path}
                        rating={item.vote_average}
                        voteAverage={item.vote_average}
                        releaseDate={item.release_date || item.first_air_date}
                      />
                      {item.character && (
                        <div className="mt-2 text-center md:text-left px-1">
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider truncate">As</p>
                          <p className="text-xs font-black text-red-500/80 truncate mt-0.5" title={item.character}>
                            {item.character}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
