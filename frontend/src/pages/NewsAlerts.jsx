import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './Tools.css';

const NewsAlerts = () => {
  const [destinations, setDestinations] = useState('India');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/news/alerts?destinations=${destinations}`);
      setNews(res.data.articles || []);
    } catch (err) {
      console.error(err);
      // Mock data
      setNews([
        { title: "Heavy rains expected in coastal Kerala", summary: "Tourists advised to avoid beaches.", source: "TravelAlerts", date: new Date().toISOString() },
        { title: "New Vande Bharat express to Jaipur", summary: "Travel time reduced by 2 hours.", source: "RailNews", date: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="page-container container">
      <div className="tool-header text-center">
        <h1 className="gradient-text">Live Travel Alerts</h1>
        <p className="text-muted">Real-time news and advisories scraped for your destinations.</p>
      </div>

      <div className="glass-card p-4 mb-5" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="d-flex gap-3">
          <input
            type="text"
            className="input-field"
            value={destinations}
            onChange={(e) => setDestinations(e.target.value)}
            placeholder="e.g. Goa, Kerala"
          />
          <button className="btn-primary" onClick={fetchNews} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="newspaper-layout">
        {loading && <div className="text-center w-100 py-5">Loading latest headlines...</div>}

        {!loading && news.length === 0 && (
          <div className="text-center w-100 py-5">No recent headlines found for {destinations}.</div>
        )}

        {!loading && news.map((article, i) => (
          <div key={i} className="newspaper-card">
            <div className="mb-3">
              <span className="badge">{article.source}</span>
            </div>
            <h3 className="newspaper-title">{article.title}</h3>
            <p className="newspaper-summary">{article.summary}...</p>
            <div className="newspaper-meta">
              <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                {new Date(article.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              {article.url && (
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="read-more-link">
                  Read Full Story ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .newspaper-layout { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
          gap: 2.5rem; 
          align-items: start; 
        }
        .newspaper-card {
          padding: 1.5rem;
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          border-top: 5px solid var(--primary);
          border-radius: 8px;
          box-shadow: var(--glass-shadow);
          transition: transform 0.3s ease;
        }
        .newspaper-card:hover {
          transform: translateY(-5px);
        }
        .newspaper-title {
          font-family: 'Playfair Display', 'Georgia', serif;
          font-size: 1.5rem;
          line-height: 1.3;
          margin-bottom: 1rem;
          color: var(--text-main);
          text-align: left;
        }
        .newspaper-summary {
          font-family: 'Georgia', serif;
          font-size: 1rem;
          line-height: 1.7;
          color: var(--text-muted);
          text-align: justify;
          margin-bottom: 1.5rem;
        }
        .newspaper-meta {
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Inter', sans-serif;
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.5px;
        }
        .read-more-link {
          color: var(--text-main);
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .read-more-link:hover {
          color: var(--primary);
        }
        .badge { 
          background: rgba(var(--primary-rgb, 99, 102, 241), 0.15); 
          color: var(--primary); 
          padding: 4px 10px; 
          border-radius: 4px; 
          font-size: 0.75rem; 
          font-weight: 700; 
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .gap-3 { gap: 1rem; }
      `}</style>
    </div>
  );
};

export default NewsAlerts;
