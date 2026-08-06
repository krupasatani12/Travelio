import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AuthGate = ({ children, mode = 'intercept', action = 'do this' }) => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  if (loading) return null;

  if (user) {
    return <>{children}</>;
  }

  if (mode === 'hide') {
    return null;
  }

  if (mode === 'page') {
    return (
      <div className="page-container container text-center pt-5 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="glass-card p-5" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="mb-4" style={{ fontSize: '3rem', color: 'var(--primary)' }}>
            <i className="fa-solid fa-lock"></i>
          </div>
          <h2>Login Required</h2>
          <p className="text-muted mb-4">You must be logged in to {action}.</p>
          <button className="btn-primary w-100" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // mode === 'intercept'
  return (
    <div 
      className="auth-gate-wrapper" 
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const confirmLogin = window.confirm(`Please login to ${action}. Go to login page now?`);
        if (confirmLogin) {
          navigate('/login');
        }
      }}
      style={{ display: 'inline-block', cursor: 'not-allowed' }}
    >
      <div style={{ pointerEvents: 'none' }}>
        {children}
      </div>
    </div>
  );
};

export default AuthGate;
