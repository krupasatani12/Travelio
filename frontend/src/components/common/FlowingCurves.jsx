import React, { useEffect, useRef } from 'react';
import './FlowingCurves.css';

/**
 * Flowing curves inspired by allgoodstudio.com
 * A group of thin, closely packed green lines moving like a floating, wavy mesh.
 */
const FlowingCurves = () => {
  const svgRef = useRef(null);
  const pathsRef = useRef([]);
  const timeRef = useRef(0);
  const rafRef = useRef(null);

  const numLines = 20; // A group of thin lines
  
  // Configuration for each line in the group
  const lineConfigs = Array.from({ length: numLines }).map((_, i) => ({
    // Slightly shift the base Y position and phase for each line to create a 3D mesh effect
    yOffset: i * 8, 
    phaseOffset: i * 0.15,
    opacity: 0.1 + (i / numLines) * 0.4, // Graded opacity
    strokeWidth: 1 + (i / numLines) * 0.5,
  }));

  const generatePath = (config, t) => {
    const { yOffset, phaseOffset } = config;
    const time = t * 0.3 + phaseOffset;
    const points = [];
    const segments = 20;
    const width = 1400; // SVG viewport width
    
    // Base parameters for the floating movement
    const amplitude1 = 120;
    const amplitude2 = 80;
    const yBase = 500; // Center Y
    
    for (let i = 0; i <= segments; i++) {
      const ratio = i / segments;
      const x = ratio * width - 100; // start slightly offscreen
      
      // Combine multiple sine waves for organic movement
      const y = yBase + yOffset - (numLines * 8) / 2 + 
        Math.sin(time + ratio * 5) * amplitude1 + 
        Math.cos(time * 0.8 + ratio * 3) * amplitude2 + 
        Math.sin(time * 1.5 + ratio * 8) * (amplitude1 * 0.3);
        
      points.push({ x, y });
    }
    
    // Build smooth cubic bezier path
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy2 = curr.y;
      d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  useEffect(() => {
    const animate = () => {
      timeRef.current += 0.015; // Speed of the floating movement
      
      pathsRef.current.forEach((pathEl, i) => {
        if (!pathEl) return;
        const config = lineConfigs[i];
        const d = generatePath(config, timeRef.current);
        pathEl.setAttribute('d', d);
      });
      
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="flowing-curves-container">
      <svg 
        ref={svgRef}
        viewBox="0 0 1200 1000" 
        preserveAspectRatio="none"
        className="flowing-curves-svg"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="20%" stopColor="#10b981" stopOpacity="1" />
            <stop offset="80%" stopColor="#34d399" stopOpacity="1" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {lineConfigs.map((config, i) => (
          <path
            key={i}
            ref={el => pathsRef.current[i] = el}
            d=""
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth={config.strokeWidth}
            opacity={config.opacity}
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  );
};

export default FlowingCurves;
