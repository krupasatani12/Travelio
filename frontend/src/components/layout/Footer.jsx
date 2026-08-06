import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '2rem 0',
      background: 'rgba(15, 15, 35, 0.5)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid var(--border-color)',
      color: 'var(--text-muted)'
    }}>
      <div className="container">
        <p>© 2026 Travel.IO — AI-Powered Indian Travel Platform</p>
      </div>
    </footer>
  );
};

export default Footer;
