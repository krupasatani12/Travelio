import React, { useEffect, useRef, useState } from 'react';

/* Airplane SVG for the traveling icon */
const AirplaneIcon = ({ x, y }) => (
  <g transform={`translate(${x - 10}, ${y - 10})`}>
    <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--secondary)" stroke="none">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  </g>
);

/**
 * Interactive Signature Element #4: NavThread
 * Wavy SVG path with a traveling airplane icon instead of a dot.
 */
const NavThread = () => {
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const [iconPos, setIconPos] = useState({ x: 0, y: 20 });
  const mousePos = useRef({ x: 0, targetX: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        let relativeX = e.clientX - rect.left;
        relativeX = Math.max(0, Math.min(relativeX, rect.width));
        mousePos.current.targetX = relativeX;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;
    
    const animate = () => {
      if (pathRef.current) {
        const path = pathRef.current;
        const totalLength = path.getTotalLength();
        
        mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.1;
        
        const containerWidth = svgRef.current?.getBoundingClientRect().width || 1;
        const ratio = mousePos.current.x / containerWidth;
        const lengthAtX = totalLength * ratio;
        
        const point = path.getPointAtLength(lengthAtX);
        setIconPos({ x: point.x, y: point.y });
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <svg 
      ref={svgRef}
      width="100%" 
      height="100%" 
      viewBox="0 0 500 40" 
      preserveAspectRatio="none"
      style={{ overflow: 'visible' }}
    >
      {/* Background track */}
      <path 
        d="M 0 20 Q 50 5, 100 20 T 200 20 T 300 20 T 400 20 T 500 20" 
        fill="none" 
        stroke="var(--border-color)" 
        strokeWidth="1"
      />
      
      {/* Active path */}
      <path 
        ref={pathRef}
        d="M 0 20 Q 50 5, 100 20 T 200 20 T 300 20 T 400 20 T 500 20" 
        fill="none" 
        stroke="var(--primary)" 
        strokeWidth="2"
        strokeOpacity="0.3"
      />
      
      {/* Airplane icon instead of dot */}
      <g transform={`translate(${iconPos.x - 8}, ${iconPos.y - 8})`}>
        <path
          d="M16 1L10 8.5L1 6L4 9L1 16L7.5 13L10 16L8.5 7L16 1Z"
          fill="var(--secondary)"
          filter="drop-shadow(0 0 4px var(--secondary))"
        />
      </g>
    </svg>
  );
};

export default NavThread;
