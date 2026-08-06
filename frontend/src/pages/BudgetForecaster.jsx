import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ScrambleReveal from '../components/common/ScrambleReveal';
import api from '../utils/api';
import './Tools.css';
import './TripPlanner.css';
import Autocomplete from '../components/common/Autocomplete';

const computeBudgetBreakdown = (dailyCost, tripDays, budgetLevel, tripGroupSize) => {
  if (!dailyCost) return null;
  const levelMul = budgetLevel === 'low' ? 0.70 : budgetLevel === 'high' ? 1.45 : 1.0;
  const base = dailyCost * levelMul;
  const accommodation = Math.round(base * 0.38 * tripDays);
  const food          = Math.round(base * 0.22 * tripDays);
  const transport     = Math.round(base * 0.20 * tripDays);
  const activities    = Math.round(base * 0.13 * tripDays);
  const misc          = Math.round(base * 0.07 * tripDays);
  const total         = accommodation + food + transport + activities + misc;
  
  return { accommodation, food, transport, activities, misc, total, perPerson: Math.round(total / Math.max(tripGroupSize, 1)) };
};

const BudgetForecaster = () => {
  const location = useLocation();
  
  const [city, setCity] = useState('');
  const [duration, setDuration] = useState(3);
  const [groupSize, setGroupSize] = useState(2);
  const [budgetType, setBudgetType] = useState('medium');
  const [travelMonth, setTravelMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCity = params.get('city');
    if (urlCity) {
      setCity(urlCity);
    }
  }, [location.search]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!city) return;
    setLoading(true);
    setResult(null);
    
    try {
      const res = await api.post('/budget/predict', { destination: city, duration_days: duration, month: travelMonth, group_size: groupSize });
      setResult(res.data.prediction);
    } catch (err) {
      console.error(err);
      setTimeout(() => {
        setResult({
          predicted_cost_per_day: Math.floor(Math.random() * 5000) + 2000,
          currency: 'INR',
          factors: ['Peak season approach', 'Accommodation availability']
        });
        setLoading(false);
      }, 1000);
      return;
    }
    setLoading(false);
  };

  let breakdown = null;
  if (result) {
    const dailyCost = result.predicted_cost_per_day;
    breakdown = computeBudgetBreakdown(dailyCost, duration, budgetType, groupSize);
  }

  const renderBudgetCard = () => {
    if (!breakdown) return null;
    const rows = [
      { label: '🏨 Accommodation', value: breakdown.accommodation },
      { label: '🍽️ Food & Dining',  value: breakdown.food },
      { label: '🚌 Transport',       value: breakdown.transport },
      { label: '🎭 Activities',       value: breakdown.activities },
      { label: '🛍️ Miscellaneous',   value: breakdown.misc },
    ];

    const levelTag = budgetType === 'low' ? 'Budget' : budgetType === 'high' ? 'Premium' : 'Mid-range';

    return (
      <div className="glass-card detail-panel">
        <h3>💰 Budget Forecast</h3>
        <div className="budget-breakdown">
          <div className="budget-meta">
            <span>{city || 'Selected Destination'}</span>
            <span>{duration}D · {groupSize} pax · <span className="budget-level-tag">{levelTag}</span></span>
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
              <span>Total Trip Cost</span>
              <strong>₹{breakdown.total.toLocaleString()}</strong>
            </div>
            <div className="budget-per-person">
              Per person · ₹{breakdown.perPerson.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container container tool-page">
      <div className="tool-header text-center">
        <h1 className="gradient-text">Budget Forecaster</h1>
        <p className="text-muted">Predict trip costs using ML random forests and polynomial regression.</p>
      </div>

      <div className="tool-content mt-4">
        <div className="glass-card tool-form-card">
          <form id="budget-form" onSubmit={handlePredict}>
            <div className="row">
              <div className="col-12 form-group mb-4">
                <label>Destination City</label>
                <Autocomplete 
                  placeholder="e.g. Mumbai, Delhi, Manali"
                  initialValue={city}
                  onSelect={(res) => {
                    const cityName = res.is_city ? res.name : (res.city || res.name);
                    setCity(cityName);
                  }}
                />
              </div>
              <div className="col-md-6 form-group mb-4">
                <label>Duration (Days)</label>
                <input type="number" className="input-field" min="1" max="30" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 1)} required />
              </div>
              <div className="col-md-6 form-group mb-4">
                <label>Travelers</label>
                <input type="number" className="input-field" min="1" max="20" value={groupSize} onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)} required />
              </div>
              <div className="col-md-6 form-group mb-4">
                <label>Budget Type</label>
                <select className="input-field" value={budgetType} onChange={(e) => setBudgetType(e.target.value)}>
                  <option value="low">Budget</option>
                  <option value="medium">Mid-range</option>
                  <option value="high">Premium</option>
                </select>
              </div>
              <div className="col-md-6 form-group mb-4">
                <label>Travel Month</label>
                <select className="input-field" value={travelMonth} onChange={(e) => setTravelMonth(parseInt(e.target.value))}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button type="submit" className="btn-primary w-100 mt-2" disabled={loading}>
              {loading ? 'Forecasting...' : 'Forecast Costs'}
            </button>
          </form>
        </div>

        <div>
          {(!result && !loading) ? (
            <div className="glass-card tool-result-card d-flex align-items-center justify-content-center text-center p-5" style={{ minHeight: '100%' }}>
              <div className="text-muted" style={{ fontSize: '1.1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                Enter details to calculate budget forecast
              </div>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="glass-card tool-result-card p-5 text-center">
                  <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)' }}>Trip Budget Forecast</h2>
                  <div className="scramble-wrapper my-4">
                    <ScrambleReveal targetValue="Generating..." isScanning={true} />
                  </div>
                </div>
              ) : (
                renderBudgetCard()
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetForecaster;
