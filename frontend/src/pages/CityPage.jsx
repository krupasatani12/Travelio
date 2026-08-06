import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AuthGate from '../components/common/AuthGate';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './CityPage.css';

const CityPage = () => {
  const { citySlug } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // City detail
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);

  // Places in city
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('alpha');
  const [searchQuery, setSearchQuery] = useState('');

  // Nearby cities
  const [nearby, setNearby] = useState([]);

  // Favorites
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Fetch city detail
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchCity = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/locations/cities/${citySlug}/detail`);
        setCity(res.data);
        // Check if favorited
        if (user?.savedDestinations?.includes(res.data.city)) {
          setIsFavorited(true);
        }
        
        // Fetch AI description on mount
        setAiLoading(true);
        api.get(`/locations/cities/${citySlug}/summary`)
        .then(aiRes => {
          setAiDescription(aiRes.data.reply);
          setAiLoading(false);
        }).catch(err => {
          console.warn('Failed to fetch AI description', err);
          setAiLoading(false);
        });

      } catch (err) {
        console.error('City not found:', err);
        setCity(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCity();
  }, [citySlug, user]);

  // Fetch places
  const fetchPlaces = useCallback(async () => {
    setPlacesLoading(true);
    try {
      const cityName = city?.city || citySlug.replace(/-/g, ' ');
      const res = await api.get(`/locations/cities/${encodeURIComponent(cityName)}/places`, {
        params: { page, limit: 12, sort },
      });
      setPlaces(res.data.places || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch places:', err);
      setPlaces([]);
    } finally {
      setPlacesLoading(false);
    }
  }, [citySlug, city, page, sort]);

  useEffect(() => {
    if (!loading) fetchPlaces();
  }, [fetchPlaces, loading]);

  // Fetch nearby cities
  useEffect(() => {
    const fetchNearby = async () => {
      try {
        const res = await api.get(`/locations/cities/${citySlug}/nearby`);
        setNearby(res.data.nearby || []);
      } catch (err) {
        console.error('Failed to fetch nearby:', err);
      }
    };
    fetchNearby();
  }, [citySlug]);

  // Toggle favorite
  const handleToggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      const res = await api.post('/favorites/toggle', { destination: city.city });
      setIsFavorited(res.data.isSaved);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Navigate to place detail
  const handlePlaceClick = (place) => {
    const placeSlug = place.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    navigate(`/places/${citySlug}/${placeSlug}`);
  };

  // Navigate to nearby city
  const handleNearbyCityClick = (slug) => {
    navigate(`/places/${slug}`);
  };

  // Filter places by search
  const filteredPlaces = searchQuery
    ? places.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : places;

  if (loading) {
    return (
      <div className="page-container container city-page">
        <div className="loading-state">
          <div className="loading-spinner" />
          Loading city...
        </div>
      </div>
    );
  }

  if (!city) {
    return (
      <div className="page-container container city-page">
        <div className="empty-state">
          <h2>City not found</h2>
          <p className="text-muted">The city "{citySlug}" could not be found.</p>
          <Link to="/places" className="btn-primary">← Back to Places</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container city-page">
      {/* Hero Section */}
      <div className="city-hero" style={{ backgroundImage: `url(${city.thumbnail})` }}>
        <div className="city-hero-overlay">
          <div className="container">
            <Link to="/places" className="city-back-link">← All Cities</Link>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="city-hero-content"
            >
              <h1 className="city-hero-title">{city.city}</h1>
              <p className="city-hero-state">{city.state}</p>
              <div className="city-hero-stats">
                <span className="hero-stat">
                  <span className="hero-stat-icon">📍</span>
                  {city.place_count} Places
                </span>
                <span className="hero-stat">
                  <span className="hero-stat-icon">⭐</span>
                  {city.avg_rating} Avg Rating
                </span>
                {city.total_reviews_lakhs > 0 && (
                  <span className="hero-stat">
                    <span className="hero-stat-icon">💬</span>
                    {city.total_reviews_lakhs}L Reviews
                  </span>
                )}
              </div>
              <div className="city-hero-actions">
                <AuthGate action="save favorites">
                  <button
                    className={`btn-hero ${isFavorited ? 'favorited' : ''}`}
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                  >
                    {favoriteLoading ? '...' : isFavorited ? '❤️ Saved to Wishlist' : '🤍 Add to Wishlist'}
                  </button>
                </AuthGate>
                <Link to={`/plan?dest=${city.city}`} className="btn-hero btn-hero-plan">
                  ✈️ Plan a Trip
                </Link>
                <AuthGate action="talk to TravelBot">
                  <Link to={`/chatbot?context=/places/${citySlug}`} className="btn-hero btn-hero-chat">
                    💬 Ask AI about {city.city}
                  </Link>
                </AuthGate>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Teaser & AI Description */}
        {(city.teaser || aiDescription || aiLoading) && (
          <motion.div
            className="glass-card city-teaser-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {city.teaser && <p>{city.teaser}</p>}
            
            <div className="ai-description mt-3" style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🤖 AI Summary
              </h4>
              {aiLoading ? (
                <div className="typing-indicator"><span></span><span></span><span></span> Generating summary...</div>
              ) : (
                <p style={{ margin: 0, fontStyle: 'italic' }}>{aiDescription}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Places Section */}
        <div className="city-places-section">
          <div className="section-header">
            <h2 className="gradient-text">Places to Visit in {city.city}</h2>
            <p className="text-muted">{total} destinations found</p>
          </div>

          {/* Controls */}
          <div className="city-places-controls">
            <input
              type="text"
              className="input-field search-input"
              placeholder={`Search places in ${city.city}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="input-field sort-select"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
            >
              <option value="alpha">Alphabetical</option>
              <option value="highest_rated">Highest Rated</option>
              <option value="most_reviewed">Most Reviewed</option>
            </select>
          </div>

          {/* Places Grid */}
          {placesLoading ? (
            <div className="loading-state">Loading places...</div>
          ) : (
            <>
              <div className="city-places-grid">
                <AnimatePresence>
                  {filteredPlaces.map((place, i) => (
                    <motion.div
                      key={`${place.name}-${i}`}
                      className="place-card glass-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      onClick={() => handlePlaceClick(place)}
                    >
                      <div className="place-card-image">
                        <img loading="lazy"
                          src={place.image}
                          alt={place.name}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80'; }}
                        />
                        {place.rating > 0 && (
                          <div className="place-card-rating">⭐ {place.rating}</div>
                        )}
                        {place.google_powered && (
                          <div className="place-card-google">Google</div>
                        )}
                      </div>
                      <div className="place-card-body">
                        <h3 className="place-card-title">{place.name}</h3>
                        <div className="place-card-meta">
                          <span className="place-type-badge">{place.type}</span>
                          {place.entrance_fee > 0 && (
                            <span className="place-fee">₹{place.entrance_fee}</span>
                          )}
                          {place.review_count_lakhs > 0 && (
                            <span className="place-reviews">{place.review_count_lakhs}L reviews</span>
                          )}
                        </div>
                        {place.best_time && (
                          <p className="place-best-time">🕐 Best: {place.best_time}</p>
                        )}
                        {place.teaser && (
                          <p className="place-card-teaser">{place.teaser.substring(0, 100)}...</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn-outline"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    ← Previous
                  </button>
                  <span className="page-info">Page {page} of {totalPages}</span>
                  <button
                    className="btn-outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Nearby Cities Section */}
        {nearby.length > 0 && (
          <div className="nearby-cities-section">
            <div className="section-header">
              <h2 className="gradient-text">Nearby Cities in {city.state}</h2>
              <p className="text-muted">Explore more destinations in the same region</p>
            </div>
            <div className="nearby-cities-grid">
              {nearby.map((nc, i) => (
                <motion.div
                  key={nc.slug}
                  className="nearby-city-card glass-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  onClick={() => handleNearbyCityClick(nc.slug)}
                >
                  <div className="nearby-city-image">
                    <img loading="lazy"
                      src={nc.thumbnail}
                      alt={nc.city}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80'; }}
                    />
                  </div>
                  <div className="nearby-city-info">
                    <h4>{nc.city}</h4>
                    <span className="nearby-city-count">{nc.place_count} places</span>
                    <span className="nearby-city-rating">⭐ {nc.avg_rating}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CityPage;
