const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../../../frontend/public/paper_plane_animation.svg');
const outPath = path.join(__dirname, '../../client/src/components/common/SplashLoader.jsx');

const svgContent = fs.readFileSync(svgPath, 'utf8');

const componentCode = `import React from 'react';
import { motion } from 'framer-motion';
import './SplashLoader.css';

const SplashLoader = () => {
  return (
    <motion.div 
      className="splash-loader-container"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 3 }}
    >
      <div className="splash-svg-wrapper">
        ${svgContent.replace(/fill-rule/g, 'fillRule').replace(/calcMode/g, 'calcMode').replace(/keyTimes/g, 'keyTimes').replace(/repeatCount/g, 'repeatCount')}
      </div>
      <motion.h1 
        className="splash-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        Travel.IO
      </motion.h1>
    </motion.div>
  );
};

export default SplashLoader;
`;

fs.writeFileSync(outPath, componentCode);
console.log('Created SplashLoader.jsx');
