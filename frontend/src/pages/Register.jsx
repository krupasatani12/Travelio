import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import FlowingCurves from '../components/common/FlowingCurves';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.post('/auth/register', formData);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.post('/auth/verify-otp', { email: formData.email, otp });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Flowing green wind curves background */}
      <FlowingCurves />
      
      <motion.div 
        className="auth-container glass-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="auth-header">
          <h2>Join Travel.IO</h2>
          <p>Create your account to start planning</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="input-field" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength="6" />
            </div>
            <button type="submit" className="btn-primary submit-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="auth-form otp-section">
            <h3>Verify Your Email</h3>
            <p style={{marginBottom: '1rem', color: 'var(--text-muted)'}}>
              We sent a 6-digit code to <strong>{formData.email}</strong>.
            </p>
            <div className="form-group" style={{width: '100%'}}>
              <input type="text" className="input-field" style={{textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px'}} value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength="6" placeholder="000000" />
            </div>
            <button type="submit" className="btn-primary submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}
        
        {step === 1 && (
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Register;
