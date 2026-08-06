import React, { useEffect, useRef } from 'react';
import './DepthGallery.css';

/**
 * Interactive Signature Element #6: DepthGallery
 * Photos at different z-planes, parallax on scroll
 */
const DepthGallery = ({ photos = [] }) => {
  const containerRef = useRef(null);
  const itemsRef = useRef([]);

  // Use some placeholder images if none provided
  const displayPhotos = photos.length >= 3 ? photos : [
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da', // Taj Mahal
    'https://images.unsplash.com/photo-1514222134-b57cbb8ce073',    // Jaipur
    'https://images.unsplash.com/photo-1587474260584-136574528ed5', // Delhi
    'https://images.unsplash.com/photo-1490079027102-cd08f2308c73', // Kerala
    'https://images.unsplash.com/photo-1548013146-72479768bada'     // Mumbai
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate how far the container is through the viewport (0 to 1)
      // 0 = just entered bottom, 1 = just left top
      const scrollPercentage = Math.max(0, Math.min(1, 
        1 - (rect.bottom / (viewportHeight + rect.height))
      ));
      
      // Apply parallax to each item based on its z-index data attribute
      itemsRef.current.forEach(item => {
        if (!item) return;
        const depth = parseFloat(item.dataset.depth || 1);
        const yOffset = (scrollPercentage - 0.5) * 100 * depth;
        item.style.transform = `translate3d(0, ${yOffset}px, 0)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="depth-gallery-container" ref={containerRef}>
      <div className="depth-gallery-grid">
        {displayPhotos.slice(0, 5).map((photo, i) => {
          // Assign different depths for parallax effect
          let depth = 1;
          let sizeClass = "medium";
          
          if (i === 0) { depth = 0.5; sizeClass = "large"; }
          if (i === 1) { depth = 1.5; sizeClass = "small"; }
          if (i === 2) { depth = 1.2; sizeClass = "medium"; }
          if (i === 3) { depth = 0.8; sizeClass = "small"; }
          if (i === 4) { depth = 1.8; sizeClass = "medium"; }

          return (
            <div 
              key={i}
              className={`gallery-item ${sizeClass}`}
              ref={el => itemsRef.current[i] = el}
              data-depth={depth}
            >
              <img src={photo} alt={`Destination ${i}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DepthGallery;
