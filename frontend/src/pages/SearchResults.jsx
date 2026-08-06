import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const navigate = useNavigate();

  const [results, setResults] = useState({ cities: [], places: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setLoading(false);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/locations/search', { params: { q: query } });
        setResults({
          cities: res.data.cities || [],
          places: res.data.places || []
        });
      } catch (err) {
        console.error('Search failed:', err);
        setError('Failed to fetch search results.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  const handleCityClick = (city) => {
    const citySlug = city.name.trim().toLowerCase().replace(/\s+/g, '-');
    navigate(`/places/${citySlug}`);
  };

  const handlePlaceClick = (place) => {
    const citySlug = place.city.trim().toLowerCase().replace(/\s+/g, '-');
    const placeSlug = place.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    navigate(`/places/${citySlug}/${placeSlug}`);
  };

  return (
    <div className="page-container container" style={{ minHeight: '80vh', paddingTop: '4rem' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="gradient-text m-0">Search Results</h1>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>← Back</button>
      </div>
      <p className="text-muted mb-5">Showing results for: <strong>"{query}"</strong></p>

      {loading ? (
        <div className="text-center py-5">
          <div className="loading-spinner mb-3 mx-auto" />
          <p>Searching...</p>
        </div>
      ) : error ? (
        <div className="text-center py-5 text-danger">{error}</div>
      ) : (
        <>
          {results.cities.length === 0 && results.places.length === 0 && (
            <div className="text-center py-5 text-muted glass-card">
              No cities or places found matching your query.
            </div>
          )}

          {results.cities.length > 0 && (
            <div className="mb-5">
              <h3 className="mb-4">Cities ({results.cities.length})</h3>
              <div className="places-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                {results.cities.map((city, i) => (
                  <motion.div
                    key={city.name}
                    className="place-card glass-card city-browse-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -8 }}
                    onClick={() => handleCityClick(city)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="place-image" style={{ height: '200px', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
                      <img loading="lazy"
                        src={city.thumbnail || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600'}
                        alt={city.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600'; }}
                      />
                    </div>
                    <div className="place-info p-3">
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{city.name}</h3>
                      <div className="place-meta d-flex justify-content-between text-muted">
                        <span className="place-state">{city.state}</span>
                        {city.rating && <span className="city-rating-badge">&#9733; {city.rating}</span>}
                      </div>
                      {city.description && (
                        <p className="text-muted mt-2" style={{ fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {city.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {results.places.length > 0 && (
            <div>
              <h3 className="mb-4">Places ({results.places.length})</h3>
              <div className="places-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                {results.places.map((place, i) => (
                  <motion.div
                    key={place.name}
                    className="place-card glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -8 }}
                    onClick={() => handlePlaceClick(place)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="place-image" style={{ height: '200px', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
                      <img loading="lazy"
                        src={place.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600'}
                        alt={place.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600'; }}
                      />
                      <span className="badge otp" style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                        {place.type}
                      </span>
                    </div>
                    <div className="place-info p-3">
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>{place.name}</h4>
                      <p className="text-muted m-0">{place.city}, {place.state}</p>
                      {place.description && (
                        <p className="text-muted mt-2" style={{ fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {place.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;
