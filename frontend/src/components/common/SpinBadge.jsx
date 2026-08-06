import React from 'react';
import { motion } from 'framer-motion';

/**
 * Interactive Signature Element #5: SpinBadge
 * Rotating "AI-matched" / "Live data" badge. pure CSS keyframes.
 */
const SpinBadge = ({ text = "AI MATCHED • LIVE DATA • " }) => {
  return (
    <div style={{
      position: 'relative',
      width: '120px',
      height: '120px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Center Icon */}
      <div style={{
        position: 'absolute',
        fontSize: '1.5rem',
        color: 'var(--primary)',
      }}>
        ✨
      </div>
      
      {/* Spinning Text SVG */}
      <svg 
        viewBox="0 0 100 100" 
        width="100" 
        height="100"
        style={{
          animation: 'spin-slow 10s linear infinite'
        }}
      >
        <defs>
          <path id="circle" d="
            M 50, 50
            m -37, 0
            a 37,37 0 1,1 74,0
            a 37,37 0 1,1 -74,0"/>
        </defs>
        <text fontSize="11" fontWeight="bold" fill="var(--text-muted)" letterSpacing="2">
          <textPath href="#circle">
            {text}
          </textPath>
        </text>
      </svg>
      <style>
        {`
          @keyframes spin-slow {
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default SpinBadge;
