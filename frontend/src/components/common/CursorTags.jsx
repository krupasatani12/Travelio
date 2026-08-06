import React, { useEffect, useRef } from 'react';
import './CursorTags.css';

/* Inline SVG vehicle icons with explicit colors */
const AeroplaneSVG = () => (
  <svg viewBox="0 0 48 48" width="40" height="40">
    <path d="M44 4L20 28" stroke="#6366f1" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M44 4L30 44L20 28L4 18L44 4Z" fill="#6366f1" opacity="0.85" />
  </svg>
);

const CarSVG = () => (
  <svg viewBox="0 0 48 48" width="40" height="40">
    <path d="M8 28L12 16C12.5 14 14 12 16 12H32C34 12 35.5 14 36 16L40 28" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" />
    <rect x="6" y="28" width="36" height="10" rx="4" fill="#10b981" opacity="0.8" />
    <circle cx="14" cy="38" r="4" fill="#059669" />
    <circle cx="34" cy="38" r="4" fill="#059669" />
    <rect x="16" y="16" width="6" height="8" rx="1" fill="#34d399" opacity="0.5" />
    <rect x="26" y="16" width="6" height="8" rx="1" fill="#34d399" opacity="0.5" />
  </svg>
);

const BoatSVG = () => (
  <svg viewBox="0 0 48 48" width="40" height="40">
    <path d="M24 8V32" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M24 8L38 28H10L24 8Z" fill="#f59e0b" opacity="0.7" />
    <path d="M4 36C10 30 20 30 24 32C28 34 38 34 44 36" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M2 42C8 38 18 38 24 40C30 42 40 42 46 38" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const CamelSVG = () => (
  <svg viewBox="0 0 48 48" width="40" height="40">
    {/* Body */}
    <ellipse cx="24" cy="28" rx="14" ry="8" fill="#e879f9" opacity="0.7" />
    {/* Hump */}
    <path d="M18 20C18 14 22 12 24 12C26 12 30 14 30 20" fill="#d946ef" opacity="0.8" />
    {/* Head */}
    <circle cx="36" cy="18" r="4" fill="#e879f9" />
    <circle cx="37.5" cy="17" r="1.2" fill="#1e1b4b" />
    {/* Neck */}
    <path d="M32 22L36 18" stroke="#d946ef" strokeWidth="3" fill="none" strokeLinecap="round" />
    {/* Legs */}
    <line x1="16" y1="36" x2="14" y2="44" stroke="#d946ef" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="22" y1="36" x2="21" y2="44" stroke="#d946ef" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="26" y1="36" x2="27" y2="44" stroke="#d946ef" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="32" y1="36" x2="34" y2="44" stroke="#d946ef" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const vehicles = [
  { Icon: AeroplaneSVG, xOffset: -110, yOffset: -80, rotation: -15 },
  { Icon: CarSVG, xOffset: 100, yOffset: -45, rotation: 5 },
  { Icon: BoatSVG, xOffset: -90, yOffset: 70, rotation: -8 },
  { Icon: CamelSVG, xOffset: 120, yOffset: 85, rotation: 3 },
];

/**
 * Interactive Signature Element #1: CursorTags
 * Vehicle SVGs that drift toward the cursor with slight rotation.
 */
const CursorTags = () => {
  const containerRef = useRef(null);
  const tagRefs = useRef([]);
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;
    const currentPositions = vehicles.map(() => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    }));

    const animate = () => {
      tagRefs.current.forEach((tagEl, index) => {
        if (!tagEl) return;

        const vehicle = vehicles[index];
        const targetX = mousePos.current.x + vehicle.xOffset;
        const targetY = mousePos.current.y + vehicle.yOffset;

        currentPositions[index].x += (targetX - currentPositions[index].x) * 0.04;
        currentPositions[index].y += (targetY - currentPositions[index].y) * 0.04;

        tagEl.style.transform = `translate3d(${currentPositions[index].x}px, ${currentPositions[index].y}px, 0) rotate(${vehicle.rotation}deg)`;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="cursor-tags-container" ref={containerRef}>
      {vehicles.map((vehicle, i) => (
        <div
          key={i}
          className="cursor-tag-vehicle"
          ref={(el) => (tagRefs.current[i] = el)}
        >
          <vehicle.Icon />
        </div>
      ))}
    </div>
  );
};

export default CursorTags;
