import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './RoutePathReveal.css';

/**
 * Interactive Signature Element #2: RoutePathReveal
 * Wavy SVG path across the top of the planner drawing a route.
 */
const RoutePathReveal = ({ itinerary = [] }) => {
  const pathRef = useRef(null);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [dotPos, setDotPos] = useState({ x: 0, y: 50 });
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    // If itinerary changes, auto-play the path
    if (itinerary.length > 0) {
      let currentProgress = 0;
      const animationSpeed = 0.01;
      
      const animatePath = setInterval(() => {
        currentProgress += animationSpeed;
        if (currentProgress >= 1) {
          currentProgress = 1;
          clearInterval(animatePath);
        }
        
        setProgress(currentProgress);
        
        // Update active day based on progress
        const dayIndex = Math.min(
          Math.floor(currentProgress * itinerary.length), 
          itinerary.length - 1
        );
        setActiveDay(dayIndex);
        
        // Update dot position
        if (pathRef.current) {
          const path = pathRef.current;
          const totalLength = path.getTotalLength();
          const point = path.getPointAtLength(totalLength * currentProgress);
          setDotPos({ x: point.x, y: point.y });
        }
      }, 30);
      
      return () => clearInterval(animatePath);
    }
  }, [itinerary]);

  // Initial calculation of path length to set strokeDasharray/offset
  const pathLength = pathRef.current ? pathRef.current.getTotalLength() : 1000;
  
  if (!itinerary || itinerary.length === 0) return null;

  return (
    <div className="route-reveal-container">
      {/* The Map/Path Area */}
      <div className="route-svg-container">
        <svg viewBox="0 0 800 100" preserveAspectRatio="none">
          {/* Background Path */}
          <path 
            d="M 0 50 Q 100 0, 200 50 T 400 50 T 600 50 T 800 50" 
            fill="none" stroke="var(--border-color)" strokeWidth="4" 
            strokeDasharray="10 10"
          />
          {/* Active Path */}
          <path 
            ref={pathRef}
            d="M 0 50 Q 100 0, 200 50 T 400 50 T 600 50 T 800 50" 
            fill="none" stroke="var(--primary)" strokeWidth="4"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength * (1 - progress)
            }}
          />
          {/* Traveling Dot */}
          {progress > 0 && (
            <circle 
              cx={dotPos.x} cy={dotPos.y} r="8" 
              fill="var(--secondary)" 
              filter="drop-shadow(0 0 6px var(--secondary))" 
            />
          )}
          
          {/* Markers for destinations */}
          {itinerary.map((stop, index) => {
            // Approximate position for markers based on index
            const stopProgress = (index + 0.5) / itinerary.length;
            const pt = pathRef.current ? pathRef.current.getPointAtLength(pathLength * stopProgress) : {x:0, y:0};
            
            return (
              <g key={index} className={`stop-marker ${activeDay >= index ? 'reached' : ''}`}>
                <circle cx={pt.x} cy={pt.y} r="5" />
                <text x={pt.x} y={pt.y + 20} textAnchor="middle">{stop.name}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* The Active Itinerary Card */}
      <div className="itinerary-cards-area">
        <AnimatePresence mode="wait">
          {itinerary[activeDay] && (
            <motion.div
              key={activeDay}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="itinerary-card glass-card"
            >
              <h3>Day {activeDay + 1}: {itinerary[activeDay].name}</h3>
              <p>{itinerary[activeDay].city}, {itinerary[activeDay].state}</p>
              <div className="card-details">
                <span>⭐ {itinerary[activeDay].google_rating || 'N/A'}</span>
                <span>Type: {itinerary[activeDay].type}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RoutePathReveal;
