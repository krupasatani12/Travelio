import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import Hero3D from '../components/3d/Hero3D';
import CursorTags from '../components/common/CursorTags';
import SpinBadge from '../components/common/SpinBadge';
import AuthGate from '../components/common/AuthGate';
import './Home.css';

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6 },
};

const stagger = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
};

const Home = () => {
  return (
    <div className="home-page">
      {/* Floating vehicle SVGs around cursor disabled as per request */}
      {/* <CursorTags /> */}
      
      {/* ═══════ HERO ═══════ */}
      <section className="hero-section">
        <Hero3D />
        
        <div className="hero-content container">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-text"
          >
            <div className="badge-container">
              <SpinBadge text="AI MATCHED • LIVE DATA • SMART ROUTES • " />
            </div>
            
            <h1 className="hero-title">
              Discover India <br/>
              <span className="gradient-text">Through AI</span>
            </h1>
            <p className="hero-subtitle">
              Personalized itineraries, accurate budget forecasts, and real-time safety scores — powered by machine learning and your unique travel preferences.
            </p>
            
            <div className="hero-cta">
              <Link to="/plan" className="btn-primary cta-btn">Plan Your Trip</Link>
              <Link to="/places" className="btn-outline cta-btn">Explore Places</Link>
            </div>
            
            {/* Stats row */}
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-num">500+</span>
                <span className="stat-label">Destinations</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">6</span>
                <span className="stat-label">ML Models</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">24/7</span>
                <span className="stat-label">AI Assistant</span>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <div className="scroll-arrow"></div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="how-section">
        <div className="container">
          <motion.h2 className="section-title" {...fadeUp}>How Travel.IO Works</motion.h2>
          <motion.p className="section-subtitle" {...fadeUp}>
            From vibe to itinerary in 3 simple steps — no city guessing needed.
          </motion.p>
          
          <div className="steps-grid">
            <motion.div className="step-card glass-card" {...stagger} transition={{ delay: 0.1 }}>
              <div className="step-number">01</div>
              <div className="step-icon">🎯</div>
              <h3>Tell Us Your Vibe</h3>
              <p>Pick categories like Adventure, Spiritual, Beach, Historical — set your budget range, group size, and travel dates. No city name needed!</p>
            </motion.div>
            
            <motion.div className="step-card glass-card" {...stagger} transition={{ delay: 0.2 }}>
              <div className="step-number">02</div>
              <div className="step-icon">🤖</div>
              <h3>AI Suggests Cities</h3>
              <p>Our ML recommender analyzes 500+ Indian destinations and suggests the best-fit cities with safety scores, budget estimates, and ratings.</p>
            </motion.div>
            
            <motion.div className="step-card glass-card" {...stagger} transition={{ delay: 0.3 }}>
              <div className="step-number">03</div>
              <div className="step-icon">✈️</div>
              <h3>Save & Go</h3>
              <p>Select your favourites, view detailed itineraries, get daily weather emails, and share plans with your travel group — all in one place.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES GRID ═══════ */}
      <section className="features-section">
        <div className="container">
          <motion.h2 className="section-title" {...fadeUp}>Smart Travel Tools</motion.h2>
          <motion.p className="section-subtitle" {...fadeUp}>
            Every tool powered by real data, trained models, and the Gemini API.
          </motion.p>
          
          <div className="features-grid">
            <motion.div className="feature-card glass-card" whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(99,102,241,0.2)' }} {...stagger} transition={{ delay: 0.05 }}>
              <div className="feature-icon">🤖</div>
              <h3>AI Trip Planner</h3>
              <p>Tell us your vibe and preferences — our recommender engine finds the perfect destinations using collaborative filtering trained on 10,000+ reviews.</p>
              <Link to="/plan" className="feature-link">Plan a Trip →</Link>
            </motion.div>
            
            <motion.div className="feature-card glass-card" whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(16,185,129,0.2)' }} {...stagger} transition={{ delay: 0.1 }}>
              <div className="feature-icon">📸</div>
              <h3>Landmark Scanner</h3>
              <p>Snap a photo of any Indian monument — our custom CNN identifies it instantly. Low confidence? Gemini Vision kicks in as a fallback.</p>
              <Link to="/landmark" className="feature-link">Try Scanner →</Link>
            </motion.div>
            
            <motion.div className="feature-card glass-card" whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(245,158,11,0.2)' }} {...stagger} transition={{ delay: 0.15 }}>
              <div className="feature-icon">💰</div>
              <h3>Budget Forecast</h3>
              <p>Polynomial regression models predict accommodation costs based on historical travel data, seasonality, and location — before you even pack.</p>
              <Link to="/budget" className="feature-link">Forecast Costs →</Link>
            </motion.div>
            
            <motion.div className="feature-card glass-card" whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(239,68,68,0.2)' }} {...stagger} transition={{ delay: 0.2 }}>
              <div className="feature-icon">🛡️</div>
              <h3>Safety Scorer</h3>
              <p>Random Forest classifier trained on NCRB crime data provides district-level safety ratings so you can travel with confidence.</p>
              <Link to="/safety" className="feature-link">Check Safety →</Link>
            </motion.div>
            
            <motion.div className="feature-card glass-card" whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(168,85,247,0.2)' }} {...stagger} transition={{ delay: 0.25 }}>
              <div className="feature-icon">🧳</div>
              <h3>AI Packing Assistant</h3>
              <p>Smart, weather-aware packing lists customized to your destination, travel style, duration, and planned activities.</p>
              <Link to="/packing" className="feature-link">Get Packing List →</Link>
            </motion.div>
            
            <motion.div className="feature-card glass-card" whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(6,182,212,0.2)' }} {...stagger} transition={{ delay: 0.3 }}>
              <div className="feature-icon">📰</div>
              <h3>Live Travel Alerts</h3>
              <p>RSS feeds scraped in real-time for weather warnings, flight disruptions, and travel advisories — pushed via WebSocket.</p>
              <Link to="/news" className="feature-link">View Alerts →</Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ TECH STACK SHOWCASE ═══════ */}
      <section className="tech-section">
        <div className="container">
          <motion.h2 className="section-title" {...fadeUp}>Built With</motion.h2>
          <motion.p className="section-subtitle" {...fadeUp}>
            A modern three-tier architecture — React × Express × Django
          </motion.p>
          
          <div className="tech-grid">
            <motion.div className="tech-card" {...stagger} transition={{ delay: 0.1 }}>
              <div className="tech-layer-label">Frontend</div>
              <div className="tech-items">
                <span className="tech-tag">React</span>
                <span className="tech-tag">Vite</span>
                <span className="tech-tag">Three.js</span>
                <span className="tech-tag">Framer Motion</span>
                <span className="tech-tag">Socket.IO</span>
              </div>
            </motion.div>
            
            <motion.div className="tech-card" {...stagger} transition={{ delay: 0.2 }}>
              <div className="tech-layer-label">API Gateway</div>
              <div className="tech-items">
                <span className="tech-tag">Node.js</span>
                <span className="tech-tag">Express</span>
                <span className="tech-tag">MongoDB</span>
                <span className="tech-tag">JWT</span>
                <span className="tech-tag">Nodemailer</span>
              </div>
            </motion.div>
            
            <motion.div className="tech-card" {...stagger} transition={{ delay: 0.3 }}>
              <div className="tech-layer-label">ML Service</div>
              <div className="tech-items">
                <span className="tech-tag">Django</span>
                <span className="tech-tag">scikit-learn</span>
                <span className="tech-tag">TensorFlow</span>
                <span className="tech-tag">NetworkX</span>
                <span className="tech-tag">Gemini API</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ CTA BANNER ═══════ */}
      <section className="cta-section">
        <div className="container">
          <motion.div className="cta-banner glass-card" {...fadeUp}>
            <div className="cta-content">
              <h2>Ready to explore?</h2>
              <p>Create your free account and let our AI plan your next Indian adventure.</p>
            </div>
            <div className="cta-buttons">
              <Link to="/register" className="btn-primary cta-btn">Get Started Free</Link>
              <AuthGate action="talk to TravelBot">
                <Link to="/chatbot" className="btn-outline cta-btn">Talk to TravelBot</Link>
              </AuthGate>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
