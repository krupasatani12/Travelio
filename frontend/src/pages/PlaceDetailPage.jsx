import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthGate from '../components/common/AuthGate';
import DepthGallery from '../components/place/DepthGallery';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './PlaceDetail.css';

const PlaceDetailPage = () => {
  const { citySlug, placeSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [place, setPlace] = useState(null);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchPlace = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/locations/cities/${citySlug}/places/${placeSlug}/detail`);
        setPlace(res.data);
        if (user?.savedDestinations?.includes(res.data.name)) {
          setIsSaved(true);
        }
        
        // Fetch public journals for this place
        const jRes = await api.get(`/journals/place/${encodeURIComponent(res.data.name)}`);
        setJournals(jRes.data.journals || []);
        
      } catch (err) {
        console.error("Failed to fetch place detail or journals:", err);
        setPlace(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPlace();
  }, [citySlug, placeSlug, user]);

  const toggleSave = async () => {
    
    setSaving(true);
    try {
      const res = await api.post('/favorites/toggle', { destination: place.name });
      setIsSaved(res.data.isSaved);
      setMessage(res.data.isSaved ? "Added to favorites" : "Removed from favorites");
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage("Failed to update favorites");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container container">
        <div className="loading-state">
          <div className="loading-spinner" />
          Loading place details...
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="page-container container">
        <div className="empty-state">
          <h2>Place not found</h2>
          <p className="text-muted">The place you're looking for doesn't exist.</p>
          <Link to={`/places/${citySlug}`} className="btn-primary">← Back to City</Link>
        </div>
      </div>
    );
  }

  const TYPE_FALLBACKS = {
    temple: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
    spiritual: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
    mountain: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    'hill station': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    beach: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    heritage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    historical: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
    lake: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80',
    nature: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80',
    wildlife: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=800&q=80',
    adventure: 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&w=800&q=80',
    default: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80'
  };

  const getDestinationFallback = (placeObj) => {
    const text = `${placeObj.name || ''} ${placeObj.city || ''} ${placeObj.type || ''}`.toLowerCase();
    for (const [key, url] of Object.entries(TYPE_FALLBACKS)) {
      if (key !== 'default' && text.includes(key)) return url;
    }
    return TYPE_FALLBACKS.default;
  };

  let photos = place.photos && place.photos.length > 0 ? [...place.photos] : [place.image || getDestinationFallback(place)];

  if (!photos[0] || photos[0].includes('photo-1476514525535') || photos[0].includes('photo-1524492412937')) {
    photos[0] = getDestinationFallback(place);
  }

  const defaultFallbacks = [
    'https://images.unsplash.com/photo-1564507592208-528f83141a97?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1585506942812-e72b29cef752?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534430267275-06399081e7d2?auto=format&fit=crop&w=800&q=80'
  ];

  while (photos.length < 5) {
    photos.push(defaultFallbacks[(photos.length - 1) % defaultFallbacks.length]);
  }

  return (
    <div className="page-container place-detail-page">
      <div className="container">
        <div className="place-header-section">
          <Link to={`/places/${citySlug}`} className="back-link">
            ← Back to {place.city}
          </Link>

          <div className="place-title-area">
            <motion.h1 
              className="gradient-text"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {place.name}
            </motion.h1>
            <p className="place-subtitle">
              {place.city}, {place.state} • {place.type} • 
              {place.rating > 0 && ` ⭐ ${place.rating}`}
            </p>
          </div>
          
          <div className="place-actions">
            <AuthGate action="save places to your trip">
              <button 
                className={`btn-${isSaved ? 'outline' : 'primary'}`} 
                onClick={toggleSave}
                disabled={saving}
              >
                {saving ? '...' : isSaved ? '❤️ Saved' : '🤍 Save to Favorites'}
              </button>
            </AuthGate>
            <Link to={`/plan?dest=${encodeURIComponent(place.city || place.name)}&place=${encodeURIComponent(place.name)}`} className="btn-primary">
              Plan a Trip Here
            </Link>
          </div>
        </div>
        {message && <div className="toast-msg glass-card">{message}</div>}
      </div>

      <DepthGallery photos={photos} />

      <div className="container">
        <div className="place-info-grid">
          <div className="info-main glass-card">
            <h2>About {place.name}</h2>
            <p>{place.teaser || `A beautiful ${place.type.toLowerCase()} destination in ${place.city}.`}</p>
            
            <div className="info-stats">
              {place.best_time && (
                <div className="stat-box">
                  <span className="stat-icon">🕐</span>
                  <div>
                    <strong>Best time to visit</strong>
                    <span>{place.best_time}</span>
                  </div>
                </div>
              )}
              {place.entrance_fee > 0 && (
                <div className="stat-box">
                  <span className="stat-icon">🎟️</span>
                  <div>
                    <strong>Entrance Fee</strong>
                    <span>₹{place.entrance_fee}</span>
                  </div>
                </div>
              )}
              {place.review_count_lakhs > 0 && (
                <div className="stat-box">
                  <span className="stat-icon">💬</span>
                  <div>
                    <strong>Reviews</strong>
                    <span>{place.review_count_lakhs} Lakhs</span>
                  </div>
                </div>
              )}
              {place.google_powered && (
                <div className="stat-box">
                  <span className="stat-icon">G</span>
                  <div>
                    <strong>Data Source</strong>
                    <span>Google Places</span>
                  </div>
                </div>
              )}
            </div>

            {place.google_maps_url && (
              <div className="maps-section mt-4">
                <a href={place.google_maps_url} target="_blank" rel="noopener noreferrer" className="btn-outline">
                  📍 View on Google Maps
                </a>
              </div>
            )}
            
            {/* Public Journals Section */}
            {journals.length > 0 && (
              <div className="place-journals-section mt-5">
                <h3 className="mb-4">Traveler Journals</h3>
                <div className="journals-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                  {journals.map((journal) => (
                    <div key={journal._id} className="glass-card" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                      <div className="d-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>{journal.title}</h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            By {journal.userId?.name} • {new Date(journal.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        {journal.rating > 0 && (
                          <div style={{ color: '#f5a623', fontSize: '1.1rem' }}>
                            {'★'.repeat(journal.rating)}{'☆'.repeat(5 - journal.rating)}
                          </div>
                        )}
                      </div>
                      
                      {journal.media && journal.media.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem' }}>
                          {journal.media.map((m, idx) => (
                            m.type === 'video' ? 
                              <video key={idx} src={api.defaults.baseURL.replace('/api', '') + m.url} controls style={{ height: '100px', borderRadius: '6px' }} /> :
                              <img key={idx} src={api.defaults.baseURL.replace('/api', '') + m.url} alt="Journal media" style={{ height: '100px', borderRadius: '6px', objectFit: 'cover' }} />
                          ))}
                        </div>
                      )}
                      
                      <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>{journal.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
          
          <div className="info-sidebar">
            <div className="glass-card side-card">
              <h3>Check Safety</h3>
              <p>View real-time crime stats and safety scores before you go.</p>
              <Link to={`/safety?city=${place.city}`} className="btn-outline">Check Safety Score</Link>
            </div>
            
            <div className="glass-card side-card mt-4">
              <h3>Forecast Budget</h3>
              <p>Get AI predictions for accommodation and travel costs.</p>
              <Link to={`/budget?city=${place.city}`} className="btn-outline">Forecast Costs</Link>
            </div>

            <div className="glass-card side-card mt-4">
              <h3>Ask Travel Bot</h3>
              <p>Get personalized tips about {place.name}.</p>
              <AuthGate action="talk to TravelBot">
                <Link to={`/chatbot?context=${encodeURIComponent(place.name)}`} className="btn-primary" style={{ width: '100%', display: 'block', textAlign: 'center' }}>
                  Ask AI
                </Link>
              </AuthGate>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailPage;
