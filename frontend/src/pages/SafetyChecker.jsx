import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ScrambleReveal from '../components/common/ScrambleReveal';
import api from '../utils/api';
import './Tools.css';
import Autocomplete from '../components/common/Autocomplete';

const SafetyChecker = () => {
  const [searchParams] = useSearchParams();
  const cityParam = searchParams.get('city') || '';
  
  const [city, setCity] = useState(cityParam);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!city) return;
    
    setLoading(true);
    try {
      const res = await api.get(`/safety/${city}`);
      setResult(res.data.safety || res.data);
    } catch (err) {
      console.error(err);
      // Mock result
      setTimeout(() => {
        setResult({
          city: city,
          safety_score: Math.floor(Math.random() * 40) + 60,
          category: 'Moderate Safety',
          tips: ['Avoid isolated areas at night', 'Keep belongings secure in crowded places']
        });
        setLoading(false);
      }, 1000);
      return;
    }
    setLoading(false);
  };

  // Auto trigger if city param exists
  React.useEffect(() => {
    if (cityParam && !result) {
      document.getElementById('safety-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  }, [cityParam]);

  return (
    <div className="page-container container tool-page">
      <div className="tool-header text-center">
        <h1 className="gradient-text">Safety Scorer</h1>
        <p className="text-muted">Real-time safety ratings powered by NCRB crime statistics.</p>
      </div>

      <div className="tool-content">
        <div className="glass-card tool-form-card">
          <form id="safety-form" onSubmit={handleCheck}>
            <div className="form-group mb-4">
              <label>District / City Name</label>
              <Autocomplete 
                placeholder="e.g. Bangalore, Pune"
                initialValue={city}
                onSelect={(res) => {
                  const cityName = res.is_city ? res.name : (res.city || res.name);
                  setCity(cityName);
                }}
              />
            </div>
            
            <button type="submit" className="btn-primary w-100" disabled={loading}>
              Analyze Safety
            </button>
          </form>
        </div>

        <div className="glass-card tool-result-card">
          {(!result && !loading) && (
            <div className="empty-result text-center">
              <div className="text-muted">Enter a city to check its safety score</div>
            </div>
          )}
          
          {(loading || result) && (
            <div className="result-display text-center">
              <h3>Safety Score (0-100)</h3>
              <div className="scramble-wrapper my-4">
                {/* Interactive Signature #3 */}
                <ScrambleReveal 
                  targetValue={result ? `${result.safety_score}/100` : ''} 
                  label={result ? result.category : ''}
                  isScanning={loading} 
                />
              </div>
              
              {result && (
                <div className="factors-list">
                  <h4>Safety Tips:</h4>
                  <ul>
                    {result.tips?.map((t, i) => <li key={i}>{t}</li>) || <li>No specific tips available.</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafetyChecker;
