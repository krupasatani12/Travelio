import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import RoutePathReveal from '../components/trip/RoutePathReveal';
import ScrambleReveal from '../components/common/ScrambleReveal';
import AuthGate from '../components/common/AuthGate';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './TripPlanner.css';

const CATEGORIES = ['Historical', 'Adventure', 'Beach', 'Spiritual', 'Nature', 'Cultural', 'Wildlife', 'Hill Station'];
const VIBES = ['Romantic', 'Solo Explorer', 'Family Fun', 'Backpacker', 'Luxury', 'Road Trip', 'Festival Chaser'];

const TripPlanner = () => {
  const { user, setUser, fetchUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [searchMode, setSearchMode] = useState('vibe'); 
  const [semanticQuery, setSemanticQuery] = useState('');
  const [creditError, setCreditError] = useState(null);

  // Prefs
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [budget, setBudget] = useState('medium');
  const [days, setDays] = useState(3);
  const [groupSize, setGroupSize] = useState(2);
  const [travelMonth, setTravelMonth] = useState(new Date().getMonth() + 1);
  
  // Data
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [manualSelectedPlaces, setManualSelectedPlaces] = useState([]);

  // Auto-fill and select destination when passed via URL query parameter (e.g. ?dest=Bir%20Billing)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const destParam = params.get('dest') || params.get('city') || params.get('destination');
    const placeParam = params.get('place');
    
    if (destParam) {
      const cityName = destParam.trim();
      const cityObj = { name: cityName };
      setSelectedCity(cityObj);
      setSemanticQuery(cityName);
      setStep(3); // Advance directly to place selection & itinerary generation for this destination
      
      api.get(`/locations/cities/${encodeURIComponent(cityName)}/places`)
        .then(res => {
          const places = res.data.places || [];
          setAvailablePlaces(places);
          if (placeParam) {
            const match = places.find(p => p.name.toLowerCase() === placeParam.toLowerCase());
            if (match) {
              setManualSelectedPlaces([match.name]);
            } else {
              setManualSelectedPlaces([placeParam]);
            }
          }
        })
        .catch(err => {
          console.error("Failed to fetch places for auto-selected destination:", err);
        });
    }
  }, [location.search]);
  
  // Details
  const [safetyResult, setSafetyResult] = useState(null);
  const [budgetResult, setBudgetResult] = useState(null);
  const [seasonWarning, setSeasonWarning] = useState(null);

  // Compute a destination-specific budget breakdown from the ML result + user inputs
  const computeBudgetBreakdown = (mlResult, tripDays, budgetLevel, tripGroupSize, tripVibes) => {
    if (!mlResult) return null;
    const dailyCost = mlResult.predicted_cost_per_day || 0;

    // Budget-level multipliers (applied to categories, not to ML total)
    const levelMul = budgetLevel === 'low' ? 0.70 : budgetLevel === 'high' ? 1.45 : 1.0;

    // Activity-weight boost when adventure / festival vibes are selected
    const activityBoost = (tripVibes || []).some(v =>
      ['Adventure', 'Festival Chaser', 'Backpacker'].includes(v)
    ) ? 1.20 : 1.0;

    // Category split of daily cost (percentages reflect typical Indian travel)
    const base = dailyCost * levelMul;
    const accommodation = Math.round(base * 0.38 * tripDays);
    const food          = Math.round(base * 0.22 * tripDays);
    const transport     = Math.round(base * 0.20 * tripDays);
    const activities    = Math.round(base * 0.13 * tripDays * activityBoost);
    const misc          = Math.round(base * 0.07 * tripDays);
    const total         = accommodation + food + transport + activities + misc;

    return { accommodation, food, transport, activities, misc, total, perPerson: Math.round(total / Math.max(tripGroupSize, 1)) };
  };
  
  // Itinerary
  const [itinerary, setItinerary] = useState(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  
  // Extend
  const [extraDays, setExtraDays] = useState(2);
  const [extraBudget, setExtraBudget] = useState(5000);
  const [extending, setExtending] = useState(false);
  
  // Save & Email
  const [emails, setEmails] = useState(['']);
  const [tripSaved, setTripSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };
  const toggleVibe = (vibe) => {
    setSelectedVibes(prev => prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]);
  };

  useEffect(() => {
    if (user?.email && emails.length === 1 && emails[0] === '') {
      setEmails([user.email]);
    }
  }, [user]);

  const handleDiscover = async (e) => {
    e.preventDefault();
    if (!user) {
      const confirmLogin = window.confirm(`Please login to discover AI recommendations. Go to login page now?`);
      if (confirmLogin) {
        navigate('/login');
      }
      return;
    }
    if (searchMode === 'vibe' && selectedCategories.length === 0) return;
    if (searchMode === 'semantic' && !semanticQuery.trim()) return;
    
    setLoading(true);
    try {
      if (searchMode === 'semantic') {
        const res = await api.post('/trips/semantic', { query: semanticQuery });
        if (fetchUser) fetchUser(); // live refresh credit
        const semanticResults = res.data.results || [];
        setSuggestions(semanticResults.map((item) => ({
          id: item.id, name: item.name || item.id, state: item.state || 'India',
          image: item.heroImage || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da',
          matchPercent: Math.round(item.score * 100), type: 'Semantic Match',
          teaser: item.teaserText || 'This destination matches your description perfectly.'
        })));
      } else {
        const res = await api.post('/trips/recommend', { categories: selectedCategories, vibes: selectedVibes, budget, days, groupSize });
        if (fetchUser) fetchUser(); // live refresh credit
        setSuggestions(res.data.recommendations || []);
      }
      setStep(2);
    } catch (err) {
      console.warn("API unavailable");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = async (city) => {
    setSelectedCity(city);
    setManualSelectedPlaces([]);
    setStep(3); // Manual Place Selection
    setAvailablePlaces([]);
    
    try {
      const res = await api.get(`/locations/cities/${encodeURIComponent(city.name)}/places`);
      setAvailablePlaces(res.data.places || []);
    } catch (err) {
      console.error("Failed to fetch available places", err);
    }
  };

  const toggleManualPlace = (placeName) => {
    setManualSelectedPlaces(prev => 
      prev.includes(placeName) ? prev.filter(p => p !== placeName) : [...prev, placeName]
    );
  };

  const handleGenerateItinerary = async (isFullAi = false) => {
    setStep(4); // Loading screen for AI
    setItineraryLoading(true);
    setItinerary(null);
    setCreditError(null);
    
    try {
      const [safetyRes, budgetRes, seasonalRes, itineraryRes] = await Promise.allSettled([
        api.get(`/safety/${selectedCity.name}`),
        api.post('/budget/predict', { destination: selectedCity.name, duration_days: days, month: travelMonth, group_size: groupSize }),
        api.get('/trips/seasonal', { params: { destination: selectedCity.name, month: travelMonth } }),
        api.post('/trips/generate-itinerary', { 
          city: selectedCity.name, 
          days, 
          budget, 
          vibes: selectedVibes,
          selectedPlaces: isFullAi ? [] : manualSelectedPlaces
        })
      ]);
      
      if (safetyRes.status === 'fulfilled') setSafetyResult(safetyRes.value.data);
      if (budgetRes.status === 'fulfilled') setBudgetResult(budgetRes.value.data.prediction);
      if (seasonalRes.status === 'fulfilled') setSeasonWarning(seasonalRes.value.data);
      
      if (itineraryRes.status === 'fulfilled') {
        setItinerary(itineraryRes.value.data.itinerary);
        // Fetch user to get updated credits from backend
        if (fetchUser) fetchUser();
        setStep(5);
      } else {
        if (itineraryRes.reason?.response?.status === 402) {
          setCreditError(itineraryRes.reason.response.data.message);
          setStep(3); // Go back to selection
        } else if (itineraryRes.reason?.response?.data?.error?.includes('Offline') || itineraryRes.reason?.response?.data?.message?.includes('Offline')) {
          setCreditError("⚠️ Offline Mode — Trip planning unavailable");
          setStep(3);
        } else {
          throw new Error('Itinerary generation failed');
        }
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 402) {
        setCreditError(err.response.data.message);
      } else if (err.response?.data?.error?.includes('Offline') || err.response?.data?.message?.includes('Offline')) {
        setCreditError("⚠️ Offline Mode — Trip planning unavailable");
      }
      setStep(3);
    } finally {
      setItineraryLoading(false);
    }
  };

  const handleExtend = async () => {
    if (!itinerary) return;
    setExtending(true);
    setCreditError(null);
    try {
      const res = await api.post('/trips/extend-itinerary', {
        city: selectedCity.name,
        existingItinerary: { itinerary },
        extraDays: parseInt(extraDays),
        extraBudget: parseInt(extraBudget),
        vibes: selectedVibes
      });
      if (res.data.extended_days) {
        setItinerary([...itinerary, ...res.data.extended_days]);
        setDays(prev => prev + parseInt(extraDays));
        if (fetchUser) fetchUser();
      }
    } catch (e) {
      console.error("Failed to extend", e);
      if (e.response?.status === 402) {
        setCreditError(e.response.data.message);
      }
    } finally {
      setExtending(false);
    }
  };

  const handleFinalize = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      await api.post('/trips/confirm', {
        emails: emails.filter(e => e.trim()),
        destination: selectedCity.name,
        state: selectedCity.state || '',
        travelMonth: MONTHS[travelMonth - 1] || '',
        groupSize,
        comfortLevel: budget === 'low' ? 'budget' : budget === 'high' ? 'luxury' : 'mid',
        durationDays: days,
        estimatedBudget: budgetResult ? budgetResult.predicted_cost_per_day * days : 0,
        itinerary: {
          destinations: selectedCity.name,
          duration: days,
          budget: budgetResult ? budgetResult.predicted_cost_per_day * days : 0,
          recommendations: itinerary ? itinerary.flatMap(d => d.places.map(p => ({ name: p.name, city: selectedCity.name }))) : []
        }
      });
      setTripSaved(true);
    } catch (err) {
      console.warn("Failed to save/email trip", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container container trip-page">
      <div className="planner-header text-center">
        <h1 className="gradient-text">AI Trip Planner</h1>
        <p className="text-muted">Tell us what you love — we'll handle the logistics.</p>
        
        {creditError && (
          <div className="alert alert-danger" style={{ maxWidth: '600px', margin: '1rem auto', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '1rem', borderRadius: '12px' }}>
            <strong>Out of Credits!</strong> {creditError}
          </div>
        )}

        {/* Wizard Progress */}
        <div className="wizard-progress mt-4">
          {[1,2,3,4,5,6].map(s => (
            <div key={s} className={`wizard-step ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}>
              <div className="step-circle">{s}</div>
              {s !== 6 && <div className="step-line"></div>}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="glass-card planner-form-card mt-4">
              <div className="budget-mode-toggle mb-4 d-flex justify-content-center gap-3">
                <button className={`premium-btn ${searchMode === 'vibe' ? 'active' : ''}`} onClick={() => setSearchMode('vibe')}>Vibe & Category</button>
                <button className={`premium-btn ${searchMode === 'semantic' ? 'active' : ''}`} onClick={() => setSearchMode('semantic')}>Free Text</button>
              </div>
              
              <form onSubmit={handleDiscover}>
                {searchMode === 'semantic' ? (
                  <div className="form-section text-center mb-4">
                    <label className="form-label" style={{ fontSize: '1.2rem' }}>Describe your dream destination</label>
                    <textarea className="input-field mt-3" rows="3" placeholder="e.g., A peaceful mountain town..." value={semanticQuery} onChange={(e) => setSemanticQuery(e.target.value)} required />
                  </div>
                ) : (
                  <>
                    <div className="form-section">
                      <label className="form-label">Categories</label>
                      <div className="chip-grid">
                        {CATEGORIES.map(cat => (
                          <button key={cat} type="button" className={`chip ${selectedCategories.includes(cat) ? 'active' : ''}`} onClick={() => toggleCategory(cat)}>{cat}</button>
                        ))}
                      </div>
                    </div>
                    <div className="form-section">
                      <label className="form-label">Vibes</label>
                      <div className="chip-grid">
                        {VIBES.map(vibe => (
                          <button key={vibe} type="button" className={`chip vibe-chip ${selectedVibes.includes(vibe) ? 'active' : ''}`} onClick={() => toggleVibe(vibe)}>{vibe}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="form-row-3">
                  <div className="form-section">
                    <label className="form-label">Budget Range</label>
                    <select className="input-field" value={budget} onChange={(e) => setBudget(e.target.value)}>
                      <option value="low">💵 Budget</option>
                      <option value="medium">💰 Mid-range</option>
                      <option value="high">💎 Premium</option>
                    </select>
                  </div>
                  <div className="form-section">
                    <label className="form-label">Days</label>
                    <input type="number" className="input-field" min="1" max="21" value={days} onChange={(e) => setDays(parseInt(e.target.value))} />
                  </div>
                  <div className="form-section">
                    <label className="form-label">Group Size</label>
                    <input type="number" className="input-field" min="1" max="20" value={groupSize} onChange={(e) => setGroupSize(parseInt(e.target.value))} />
                  </div>
                  <div className="form-section">
                    <label className="form-label">Travel Month</label>
                    <select className="input-field" value={travelMonth} onChange={(e) => setTravelMonth(parseInt(e.target.value))}>
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-primary discover-btn" disabled={loading || (searchMode === 'vibe' && selectedCategories.length === 0)}>
                  {loading ? 'Discovering...' : '✨ Next: Match Destinations'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {step === 2 && suggestions && (
          <motion.div key="step2" className="suggestions-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="gradient-text m-0">Cities Matched For You</h2>
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            </div>
            
            <div className="city-cards-grid">
              {suggestions.map((city, i) => (
                <motion.div 
                  key={city.id} className="city-card glass-card"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8 }} onClick={() => handleSelectCity(city)}
                >
                  <div className="city-card-image">
                                         <img loading="lazy" src={city.image} alt={city.name} onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400'} />
                    <div className="match-badge">{city.matchPercent || 90}% match</div>
                  </div>
                  <div className="city-card-info">
                    <h3>{city.name}</h3>
                    <p className="city-state">{city.state}</p>
                    <div className="city-meta">
                      {city.teaser && <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>{city.teaser.substring(0, 80)}...</p>}
                      <span className="city-type-tag mt-2 d-inline-block">{city.type}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" className="manual-selection-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="gradient-text m-0">Select Places in {selectedCity?.name}</h2>
              <button className="btn btn-outline" onClick={() => setStep(2)}>← Back to Cities</button>
            </div>
            
            {creditError && (
              <div className="alert alert-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                {creditError}
              </div>
            )}
            
            <div className="manual-places-controls mb-4 glass-card p-3 d-flex justify-content-between align-items-center">
              <div>
                <p className="m-0 text-muted">Select places to include, or let AI plan everything.</p>
                <strong>{manualSelectedPlaces.length} places selected</strong>
              </div>
              <div className="d-flex gap-3">
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => handleGenerateItinerary(true)}
                >
                  ✨ Full AI Planning
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => handleGenerateItinerary(false)}
                  disabled={manualSelectedPlaces.length === 0}
                >
                  Plan Selected Places →
                </button>
              </div>
            </div>

            <div className="places-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {availablePlaces.map(place => (
                <div 
                  key={place.name} 
                  className={`place-selection-card glass-card ${manualSelectedPlaces.includes(place.name) ? 'selected' : ''}`}
                  onClick={() => toggleManualPlace(place.name)}
                  style={{ cursor: 'pointer', border: manualSelectedPlaces.includes(place.name) ? '2px solid var(--primary)' : '2px solid transparent', transition: 'all 0.2s', padding: '1rem', borderRadius: '12px' }}
                >
                  <div style={{ height: '120px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <img src={place.image} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400'} />
                  </div>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{place.name}</h4>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-secondary" style={{ fontSize: '0.75rem' }}>{place.type}</span>
                    <input type="checkbox" checked={manualSelectedPlaces.includes(place.name)} readOnly style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }} />
                  </div>
                </div>
              ))}
            </div>
            {availablePlaces.length === 0 && (
              <div className="text-center p-5 text-muted glass-card mt-4">
                <h4>This city is not in our database yet.</h4>
                <p>But don't worry! Our AI can still plan a full trip for you using real-time internet access.</p>
                <button 
                  className="btn btn-primary mt-3" 
                  onClick={() => handleGenerateItinerary(true)}
                >
                  ✨ Start Full AI Planning
                </button>
              </div>
            )}
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" className="loading-ai-section text-center py-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="gradient-text mb-4">AI is curating your perfect itinerary...</h2>
            <div className="scramble-center mb-4" style={{ display: 'flex', justifyContent: 'center', fontSize: '2rem' }}>
              <ScrambleReveal targetValue={selectedCity?.name} label="Target Destination" isScanning={true} />
            </div>
            <p className="text-muted">Analyzing hotels, mapping optimal routes, and checking weather conditions.</p>
          </motion.div>
        )}

        {step === 5 && selectedCity && itinerary && (
          <motion.div key="step5" className="itinerary-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-3">
                <button className="btn btn-outline btn-sm" onClick={() => setStep(3)}>← Back to Places</button>
                <h2 className="gradient-text m-0">{selectedCity.name} Itinerary</h2>
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => navigate('/packing', { state: { city: selectedCity?.name, days, month: travelMonth, weather: seasonWarning?.season, vibes: selectedVibes } })}
                >
                  🧳 Packing List
                </button>
                <button className="btn btn-primary" onClick={() => setStep(6)}>Next: Finalize & Email →</button>
              </div>
            </div>

            <div className="details-grid mb-5">
              <div className="glass-card detail-panel">
                <h3>🛡️ Safety Analysis</h3>
                <div className="scramble-center">
                  <ScrambleReveal targetValue={safetyResult?.safety?.safety_score ? `${safetyResult.safety.safety_score}/100` : '85/100'} label={safetyResult?.safety?.category || 'Moderate Safety'} />
                </div>
              </div>
              <div className="glass-card detail-panel">
                <h3>💰 Budget Forecast</h3>
                {(() => {
                  const breakdown = computeBudgetBreakdown(budgetResult, days, budget, groupSize, selectedVibes);
                  if (!breakdown) {
                    return <div className="text-muted" style={{ fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>Calculating…</div>;
                  }
                  const rows = [
                    { label: '🏨 Accommodation', value: breakdown.accommodation },
                    { label: '🍽️ Food & Dining',  value: breakdown.food },
                    { label: '🚌 Transport',       value: breakdown.transport },
                    { label: '🎭 Activities',       value: breakdown.activities },
                    { label: '🛍️ Miscellaneous',   value: breakdown.misc },
                  ];
                  return (
                    <div className="budget-breakdown">
                      <div className="budget-meta">
                        <span>{selectedCity?.name}</span>
                        <span>{days}D · {groupSize} pax · <span className="budget-level-tag">{budget === 'low' ? 'Budget' : budget === 'high' ? 'Premium' : 'Mid-range'}</span></span>
                      </div>
                      <ul className="budget-rows">
                        {rows.map(r => (
                          <li key={r.label} className="budget-row-item">
                            <span className="budget-row-label">{r.label}</span>
                            <span className="budget-row-value">₹{r.value.toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="budget-total-bar">
                        <div className="budget-total-row">
                          <span>Total Trip</span>
                          <strong>₹{breakdown.total.toLocaleString()}</strong>
                        </div>
                        <div className="budget-per-person">
                          Per person · ₹{breakdown.perPerson.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="itinerary-timeline">
              {itinerary.map((day, index) => (
                <div key={index} className="itinerary-day-card glass-card mb-4">
                  <div className="day-header">
                    <h3>Day {day.day}: {day.theme}</h3>
                    <span className="day-budget">Est: ₹{day.budget_estimate}</span>
                  </div>
                  <div className="places-list">
                    {day.places.map((place, pIdx) => {
                      const isSelected = manualSelectedPlaces.some(p => p.toLowerCase() === place.name.toLowerCase());
                      const linkContent = (
                        <>
                          <div className="place-time">{place.time}</div>
                          <div className="place-info">
                            <h4 style={{ color: 'var(--text-primary)' }}>{place.name}</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{place.description}</p>
                          </div>
                          <div className="place-arrow">→</div>
                        </>
                      );
                      
                      return isSelected ? (
                        <Link to={`/places/${selectedCity.name.toLowerCase()}/${place.slug || place.name.toLowerCase().replace(/\s+/g, '-')}`} key={pIdx} className="place-item" style={{ textDecoration: 'none' }}>
                          {linkContent}
                        </Link>
                      ) : (
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + selectedCity.name)}`} target="_blank" rel="noopener noreferrer" key={pIdx} className="place-item" style={{ textDecoration: 'none' }}>
                          {linkContent}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card extend-trip-section mt-5 text-center">
              <h3>Want to stay longer?</h3>
              <p className="text-muted mb-4">Have extra days and budget? Our AI can append additional places to your itinerary dynamically.</p>
              
              <div className="d-flex justify-content-center gap-3 mb-4 flex-wrap">
                <div>
                  <label className="form-label d-block text-start">Extra Days</label>
                  <input type="number" className="input-field" value={extraDays} onChange={e => setExtraDays(e.target.value)} min="1" max="10" />
                </div>
                <div>
                  <label className="form-label d-block text-start">Extra Budget (₹)</label>
                  <input type="number" className="input-field" value={extraBudget} onChange={e => setExtraBudget(e.target.value)} step="1000" />
                </div>
              </div>
              
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <button className="premium-btn" onClick={handleExtend} disabled={extending}>
                  {extending ? 'Generating Additions...' : `✨ Extend Trip by ${extraDays} Days`}
                </button>
                <button 
                  className="premium-btn active" 
                  onClick={() => handleGenerateItinerary(true)} 
                  disabled={extending}
                >
                  ✨ Full AI Planning
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div key="step6" className="finalize-section mt-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="gradient-text m-0">Save & Export</h2>
              <button className="btn btn-outline" onClick={() => setStep(5)}>← Back to Itinerary</button>
            </div>

            <div className="glass-card">
              {!tripSaved ? (
                <form onSubmit={handleFinalize} className="text-center p-4">
                  <h3 className="mb-3">Receive your beautiful itinerary via email</h3>
                  <p className="text-muted mb-4">We will send a 3D formatted itinerary and save it to your dashboard.</p>
                  
                  <div className="form-section mb-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    {emails.map((em, idx) => (
                      <div key={idx} className="d-flex mb-2 gap-2">
                        <input 
                          type="email" className="input-field flex-grow-1" 
                          placeholder="Enter email address" 
                          value={em} 
                          onChange={e => {
                            const newEmails = [...emails];
                            newEmails[idx] = e.target.value;
                            setEmails(newEmails);
                          }} required={idx === 0} 
                        />
                        {idx === emails.length - 1 ? (
                          <button type="button" className="btn btn-outline-primary" style={{ padding: '0 1rem' }} onClick={() => setEmails([...emails, ''])} title="Add another recipient">+</button>
                        ) : (
                          <button type="button" className="btn btn-outline-danger" style={{ padding: '0 1rem' }} onClick={() => setEmails(emails.filter((_, i) => i !== idx))} title="Remove recipient">&times;</button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={saving || !emails[0]}>
                    {saving ? 'Saving & Sending...' : `✓ Confirm & Send Email${emails.length > 1 ? 's' : ''}`}
                  </button>
                </form>
              ) : (
                <div className="trip-confirmed-card">
                  <div className="trip-confirmed-icon">✅</div>
                  <h3 className="trip-confirmed-heading">Trip Confirmed!</h3>
                  <p className="trip-confirmed-desc text-muted">Your itinerary is saved to your dashboard and the email has been sent.</p>
                  <Link to="/dashboard" className="btn btn-primary trip-confirmed-btn">Go to Dashboard</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TripPlanner;
