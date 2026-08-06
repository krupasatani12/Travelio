import React, { useState, useEffect } from 'react';
import './EmojiLoader.css';

const EMOJIS = ['✈️', '🚂', '🏨', '🎒', '🌴', '🏛️', '🍛', '🏔️'];

const EmojiLoader = ({ message = "Loading..." }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % EMOJIS.length);
    }, 400); // Fast switch
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="emoji-loader-container">
      <div className="emoji-box">
        <span className="emoji-animate">{EMOJIS[index]}</span>
      </div>
      <p className="emoji-text gradient-text">{message}</p>
    </div>
  );
};

export default EmojiLoader;
