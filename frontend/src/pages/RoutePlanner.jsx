import React, { useState } from 'react';
import api from '../utils/api';
import './Tools.css';
import Autocomplete from '../components/common/Autocomplete';

const RoutePlanner = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [optimize, setOptimize] = useState('price');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePlan = async (e) => {
    e.preventDefault();
    if (!source || !destination) return;
    
    setLoading(true);
    setResult(null);
    try {
      // Request compare mode to get both flight and train routes
      const res = await api.get(`/route?source=${source}&destination=${destination}&optimize=${optimize}&mode=compare`);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setResult({ error: 'Failed to fetch routes' });
    }
    setLoading(false);
  };

  const renderRoute = (routeData, title, iconClass, colorClass) => {
    if (!routeData) return null;
    
    if (routeData.status === 'error') {
      return (
        <div className={`glass-card ${colorClass} text-center`} style={{ padding: '1.5rem', height: '100%' }}>
          <h3 className="mb-3"><i className={`${iconClass} me-2`}></i>{title}</h3>
          <p className="text-muted">{routeData.message || 'Route unavailable'}</p>
        </div>
      );
    }

    return (
      <div className={`glass-card ${colorClass}`} style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h3 className="text-center mb-4"><i className={`${iconClass} me-2`}></i>{title}</h3>
        
        <div className="route-steps mb-4" style={{ flexGrow: 1 }}>
          {routeData.path && routeData.path.map((node, i) => (
            <React.Fragment key={i}>
              <div className="route-node">
                <span className="node-dot"></span>
                {node}
              </div>
              {i < routeData.path.length - 1 && <div className="route-line"></div>}
            </React.Fragment>
          ))}
        </div>

        <div className="factors-list d-flex justify-content-between text-center" style={{flexDirection: 'row', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem'}}>
          <div>
            <h4 style={{marginBottom: '0.5rem', fontSize: '1rem'}}>Est. Cost</h4>
            <div style={{fontSize: '1.5rem', color: 'var(--success)', fontWeight: 'bold'}}>₹{routeData.total_price}</div>
          </div>
          <div>
            <h4 style={{marginBottom: '0.5rem', fontSize: '1rem'}}>Est. Time</h4>
            <div style={{fontSize: '1.5rem', color: 'var(--warning)', fontWeight: 'bold'}}>{routeData.total_duration} hrs</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container container tool-page">
      <div className="tool-header text-center">
        <h1 className="gradient-text">Graph Route Planner</h1>
        <p className="text-muted">Compare Flight vs Railway routes optimized by price or time.</p>
      </div>

      <div className="tool-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="glass-card tool-form-card mb-4">
          <form onSubmit={handlePlan}>
            <div className="row">
              <div className="col-md-4 mb-3 form-group">
                <label>From</label>
                <Autocomplete 
                  placeholder="e.g. Mumbai"
                  initialValue={source}
                  onSelect={(res) => {
                    const cityName = res.is_city ? res.name : (res.city || res.name);
                    setSource(cityName);
                  }}
                />
              </div>
              
              <div className="col-md-4 mb-3 form-group">
                <label>To</label>
                <Autocomplete 
                  placeholder="e.g. Delhi"
                  initialValue={destination}
                  onSelect={(res) => {
                    const cityName = res.is_city ? res.name : (res.city || res.name);
                    setDestination(cityName);
                  }}
                />
              </div>

              <div className="col-md-4 mb-3 form-group">
                <label>Optimize For</label>
                <select 
                  className="input-field" 
                  value={optimize}
                  onChange={(e) => setOptimize(e.target.value)}
                >
                  <option value="price">Cheapest Price</option>
                  <option value="duration">Fastest Time</option>
                </select>
              </div>
            </div>
            
            <button type="submit" className="btn-primary w-100 mt-2" disabled={loading}>
              {loading ? 'Computing Graph Nodes...' : 'Compare Routes'}
            </button>
          </form>
        </div>

        {(!result && !loading) && (
          <div className="glass-card empty-result text-center mt-4 p-5">
            <div className="text-muted fs-5">Enter a source and destination to compare routes.</div>
          </div>
        )}

        {result && result.error && (
           <div className="alert alert-danger text-center mt-4">
              {result.error}
           </div>
        )}
        
        {result && result.compare && (
          <div className="row mt-4 route-comparison-grid">
            <div className="col-md-6 mb-4">
              {renderRoute(result.flight, 'Optimal Flight Route', 'fa-solid fa-plane-departure', 'route-card-flight')}
            </div>
            <div className="col-md-6 mb-4">
              {renderRoute(result.train, 'Optimal Train Route', 'fa-solid fa-train', 'route-card-train')}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .route-steps { padding: 1rem 0.5rem; }
        .route-node { display: flex; align-items: center; gap: 15px; font-weight: 600; font-size: 1.1rem; }
        .node-dot { width: 14px; height: 14px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 10px var(--primary); }
        .route-line { height: 40px; width: 3px; background: var(--border-color); margin-left: 5px; opacity: 0.5; }
        .route-card-flight { border-top: 4px solid #0dcaf0; }
        .route-card-train { border-top: 4px solid #ffc107; }
        .route-comparison-grid { display: flex; flex-wrap: wrap; align-items: stretch; }
      `}</style>
    </div>
  );
};

export default RoutePlanner;
