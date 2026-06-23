import React from 'react';

export default function AgreyFlixLoader({ small, text }) {
  if (small) {
    return (
      <div className="w-full flex justify-center items-center py-4 flex-col gap-2 min-h-[90px]">
        {/* Container for small loader */}
        <div className="relative w-full max-w-[160px] flex items-center justify-center p-1">
          {/* Glow behind the text */}
          <div className="absolute inset-0 bg-red-600/10 rounded-full blur-2xl w-32 h-10 mx-auto animate-pulse" />

          <svg 
            viewBox="0 0 540 140" 
            className="w-full drop-shadow-[0_0_12px_rgba(0,0,0,0.8)]"
            preserveAspectRatio="xMidYMid meet"
          >
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght=900&display=swap');
              
              .neon-text-main {
                font-family: 'Montserrat', 'Inter', system-ui, -apple-system, sans-serif;
                font-weight: 900;
                letter-spacing: -1px;
              }

              /* PULSING FILL ANIMATIONS */
              .fill-agrey-base {
                animation: fill-agrey-pulse 4s infinite ease-in-out;
              }
              .fill-flix-base {
                animation: fill-flix-pulse 4s infinite ease-in-out;
              }

              @keyframes fill-agrey-pulse {
                0%, 10% { fill: rgba(255, 255, 255, 0.15); filter: drop-shadow(0 0 2px rgba(255,255,255,0.1)); }
                40%, 65% { fill: #ffffff; filter: drop-shadow(0 0 15px rgba(255,255,255,0.7)); }
                90%, 100% { fill: rgba(255, 255, 255, 0.15); filter: drop-shadow(0 0 2px rgba(255,255,255,0.1)); }
              }

              @keyframes fill-flix-pulse {
                0%, 50% { fill: rgba(239, 68, 68, 0.1); filter: drop-shadow(0 0 2px rgba(239,68,68,0.1)); }
                75%, 95% { fill: #ef4444; filter: drop-shadow(0 0 20px rgba(239,68,68,0.8)); }
                100%, 10% { fill: rgba(239, 68, 68, 0.1); filter: drop-shadow(0 0 2px rgba(239,68,68,0.1)); }
              }

              /* NEON CONTOUR TRACING ANIMATIONS */
              .trace-agrey-neon {
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
                animation: draw-agrey-red 4s infinite cubic-bezier(0.4, 0, 0.2, 1);
              }

              .trace-flix-neon {
                stroke-dasharray: 1000;
                stroke-dashoffset: 1000;
                animation: draw-flix-white 4s infinite cubic-bezier(0.4, 0, 0.2, 1);
              }

              @keyframes draw-agrey-red {
                0% {
                  stroke-dashoffset: 1000;
                  opacity: 0;
                }
                5% {
                  opacity: 1;
                  stroke-dashoffset: 1000;
                }
                45% {
                  stroke-dashoffset: 0;
                  opacity: 1;
                }
                50% {
                  stroke-dashoffset: 0;
                  opacity: 0.3;
                }
                55%, 100% {
                  stroke-dashoffset: -1000;
                  opacity: 0;
                }
              }

              @keyframes draw-flix-white {
                0%, 45% {
                  stroke-dashoffset: 1000;
                  opacity: 0;
                }
                50% {
                  opacity: 1;
                  stroke-dashoffset: 1000;
                }
                85% {
                  stroke-dashoffset: 0;
                  opacity: 1;
                }
                90% {
                  stroke-dashoffset: 0;
                  opacity: 0.3;
                }
                95%, 100% {
                  stroke-dashoffset: -1000;
                  opacity: 0;
                }
              }
            `}</style>

            <defs>
              <filter id="neon-glow-red" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur1" />
                <feGaussianBlur stdDeviation="10" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="neon-glow-white" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur1" />
                <feGaussianBlur stdDeviation="10" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g className="neon-text-main">
              <text 
                x="255" 
                y="95" 
                textAnchor="end" 
                fontSize="78" 
                className="fill-agrey-base select-none"
              >
                Agrey
              </text>
              <text 
                x="275" 
                y="95" 
                textAnchor="start" 
                fontSize="78" 
                className="fill-flix-base select-none"
              >
                Flix
              </text>
            </g>

            <g className="neon-text-main" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <text 
                x="255" 
                y="95" 
                textAnchor="end" 
                fontSize="78" 
                stroke="#ef4444"
                filter="url(#neon-glow-red)"
                className="trace-agrey-neon select-none"
              >
                Agrey
              </text>
              <text 
                x="275" 
                y="95" 
                textAnchor="start" 
                fontSize="78" 
                stroke="#ffffff"
                filter="url(#neon-glow-white)"
                className="trace-flix-neon select-none"
              >
                Flix
              </text>
            </g>
          </svg>
        </div>
        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">
          {text || "Searching sources..."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center py-16 flex-col gap-6 min-h-[350px]">
      
      {/* Container for loader */}
      <div className="relative w-full max-w-md flex items-center justify-center p-4">
        
        {/* Glow behind the text for extra ambiance */}
        <div className="absolute inset-0 bg-red-600/10 rounded-full blur-3xl w-72 h-32 mx-auto animate-pulse" />

        <svg 
          viewBox="0 0 540 140" 
          className="w-full drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Custom style block for precise animation coordination */}
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght=900&display=swap');
            
            .neon-text-main {
              font-family: 'Montserrat', 'Inter', system-ui, -apple-system, sans-serif;
              font-weight: 900;
              letter-spacing: -1px;
            }

            /* PULSING FILL ANIMATIONS */
            .fill-agrey-base {
              animation: fill-agrey-pulse 4s infinite ease-in-out;
            }
            .fill-flix-base {
              animation: fill-flix-pulse 4s infinite ease-in-out;
            }

            @keyframes fill-agrey-pulse {
              0%, 10% { fill: rgba(255, 255, 255, 0.15); filter: drop-shadow(0 0 2px rgba(255,255,255,0.1)); }
              40%, 65% { fill: #ffffff; filter: drop-shadow(0 0 15px rgba(255,255,255,0.7)); }
              90%, 100% { fill: rgba(255, 255, 255, 0.15); filter: drop-shadow(0 0 2px rgba(255,255,255,0.1)); }
            }

            @keyframes fill-flix-pulse {
              0%, 50% { fill: rgba(239, 68, 68, 0.1); filter: drop-shadow(0 0 2px rgba(239,68,68,0.1)); }
              75%, 95% { fill: #ef4444; filter: drop-shadow(0 0 20px rgba(239,68,68,0.8)); }
              100%, 10% { fill: rgba(239, 68, 68, 0.1); filter: drop-shadow(0 0 2px rgba(239,68,68,0.1)); }
            }

            /* NEON CONTOUR TRACING ANIMATIONS */
            .trace-agrey-neon {
              stroke-dasharray: 1000;
              stroke-dashoffset: 1000;
              animation: draw-agrey-red 4s infinite cubic-bezier(0.4, 0, 0.2, 1);
            }

            .trace-flix-neon {
              stroke-dasharray: 1000;
              stroke-dashoffset: 1000;
              animation: draw-flix-white 4s infinite cubic-bezier(0.4, 0, 0.2, 1);
            }

            /* Red contour traces from bottom-left around to the top and right */
            @keyframes draw-agrey-red {
              0% {
                stroke-dashoffset: 1000;
                opacity: 0;
              }
              5% {
                opacity: 1;
                stroke-dashoffset: 1000;
              }
              45% {
                stroke-dashoffset: 0;
                opacity: 1;
              }
              50% {
                stroke-dashoffset: 0;
                opacity: 0.3;
              }
              55%, 100% {
                stroke-dashoffset: -1000;
                opacity: 0;
              }
            }

            /* Tracing is handed over to white contour for Flix */
            @keyframes draw-flix-white {
              0%, 45% {
                stroke-dashoffset: 1000;
                opacity: 0;
              }
              50% {
                opacity: 1;
                stroke-dashoffset: 1000;
              }
              85% {
                stroke-dashoffset: 0;
                opacity: 1;
              }
              90% {
                stroke-dashoffset: 0;
                opacity: 0.3;
              }
              95%, 100% {
                stroke-dashoffset: -1000;
                opacity: 0;
              }
            }
          `}</style>

          {/* Glowing Filters */}
          <defs>
            <filter id="neon-glow-red" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur1" />
              <feGaussianBlur stdDeviation="10" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="neon-glow-white" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur1" />
              <feGaussianBlur stdDeviation="10" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* BASE FONT LAYERS (Solid pulsing colors) */}
          <g className="neon-text-main">
            {/* Agrey - White Fill */}
            <text 
              x="255" 
              y="95" 
              textAnchor="end" 
              fontSize="78" 
              className="fill-agrey-base select-none"
            >
              Agrey
            </text>

            {/* Flix - Red Fill */}
            <text 
              x="275" 
              y="95" 
              textAnchor="start" 
              fontSize="78" 
              className="fill-flix-base select-none"
            >
              Flix
            </text>
          </g>

          {/* ACTIVE NEON CONTOUR LAYERS */}
          <g className="neon-text-main" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            
            {/* Red neon tracing contour for Agrey */}
            <text 
              x="255" 
              y="95" 
              textAnchor="end" 
              fontSize="78" 
              stroke="#ef4444"
              filter="url(#neon-glow-red)"
              className="trace-agrey-neon select-none"
            >
              Agrey
            </text>

            {/* White neon tracing contour for Flix */}
            <text 
              x="275" 
              y="95" 
              textAnchor="start" 
              fontSize="78" 
              stroke="#ffffff"
              filter="url(#neon-glow-white)"
              className="trace-flix-neon select-none"
            >
              Flix
            </text>

          </g>
        </svg>

      </div>

      {/* Subtext info */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-gray-400 font-bold uppercase tracking-[0.35em] text-xs animate-pulse">
          {text || "Loading your world..."}
        </p>
        <span className="text-[10px] text-zinc-600 select-none font-semibold tracking-wider">AGREYFLIX MEDIA SERVICE</span>
      </div>

    </div>
  );
}
