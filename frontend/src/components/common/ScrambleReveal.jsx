import React, { useState, useEffect } from 'react';

/**
 * Interactive Signature Element #3: ScrambleReveal
 * Takes a target value, shows a "scanning" state, then decodes into the real number.
 */
const ScrambleReveal = ({ targetValue, label, isScanning = false }) => {
  const [displayText, setDisplayText] = useState('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

  useEffect(() => {
    if (isScanning) {
      // Show scanning state
      const scanInterval = setInterval(() => {
        let text = '';
        for (let i = 0; i < String(targetValue).length; i++) {
          text += chars[Math.floor(Math.random() * chars.length)];
        }
        setDisplayText(text);
      }, 50);
      return () => clearInterval(scanInterval);
    } else {
      // Decode sequence
      if (!targetValue) return;
      const targetStr = String(targetValue);
      let iteration = 0;
      
      const decodeInterval = setInterval(() => {
        let text = targetStr.split('').map((letter, index) => {
          if (index < iteration) {
            return targetStr[index];
          }
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        
        setDisplayText(text);
        
        if (iteration >= targetStr.length) {
          clearInterval(decodeInterval);
        }
        
        iteration += 1 / 3; // Controls speed of reveal
      }, 30);
      
      return () => clearInterval(decodeInterval);
    }
  }, [isScanning, targetValue]);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ 
        fontSize: '2.5rem', 
        fontWeight: 'bold', 
        fontFamily: 'monospace',
        color: isScanning ? 'var(--warning)' : 'var(--success)'
      }}>
        {displayText || (isScanning ? 'SCANNING...' : targetValue)}
      </div>
      {label && <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{label}</div>}
      
      {isScanning && (
        <div style={{ width: '100%', height: '4px', background: 'var(--border-color)', marginTop: '8px', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ 
            width: '50%', height: '100%', background: 'var(--warning)', 
            animation: 'scan-bar 1s infinite alternate linear' 
          }} />
        </div>
      )}
      <style>{`
        @keyframes scan-bar {
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default ScrambleReveal;
