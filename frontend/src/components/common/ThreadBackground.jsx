import React, { useEffect, useRef } from 'react';
import './ThreadBackground.css';

/**
 * Interactive Signature Element #7: ThreadBackground
 * SVG curves for Login/Register pages
 */
const ThreadBackground = () => {
  const pathRefs = useRef([]);

  useEffect(() => {
    // Draw paths on mount
    pathRefs.current.forEach((path, index) => {
      if (!path) return;
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      
      // Trigger reflow
      path.getBoundingClientRect();
      
      // Animate draw
      path.style.transition = `stroke-dashoffset ${2 + index * 0.5}s ease-in-out forwards`;
      path.style.strokeDashoffset = '0';
      
      // After draw, set to infinite loop class for subtle movement
      setTimeout(() => {
        path.style.transition = 'none';
        path.classList.add('thread-loop');
      }, (2 + index * 0.5) * 1000 + 100);
    });
  }, []);

  return (
    <div className="thread-bg-container">
      <svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        {/* We use multiple paths with different opacities and curves */}
        <path 
          ref={el => pathRefs.current[0] = el}
          d="M -100 200 C 300 0, 700 400, 1100 200" 
          stroke="var(--primary)" 
          strokeWidth="2" 
          fill="none" 
          className="thread-path"
          opacity="0.3"
        />
        <path 
          ref={el => pathRefs.current[1] = el}
          d="M -100 500 C 400 700, 600 200, 1100 500" 
          stroke="var(--secondary)" 
          strokeWidth="3" 
          fill="none" 
          className="thread-path"
          opacity="0.2"
        />
        <path 
          ref={el => pathRefs.current[2] = el}
          d="M -100 800 C 200 600, 800 900, 1100 700" 
          stroke="var(--primary)" 
          strokeWidth="1.5" 
          fill="none" 
          className="thread-path"
          opacity="0.4"
        />
        <path 
          ref={el => pathRefs.current[3] = el}
          d="M 200 -100 C 0 300, 400 700, 200 1100" 
          stroke="var(--secondary)" 
          strokeWidth="2" 
          fill="none" 
          className="thread-path"
          opacity="0.2"
        />
      </svg>
    </div>
  );
};

export default ThreadBackground;
