import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import './Places.css';
import api from '../utils/api';
import Autocomplete from '../components/common/Autocomplete';
const Places = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // --- City Grid State (outer) ---
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stateFilter, setStateFilter] = useState('');
  const [sort, setSort] = useState(() => localStorage.getItem('places_sort') || 'alpha');

  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSort(newSort);
    localStorage.setItem('places_sort', newSort);
  };
  const [showWishlist, setShowWishlist] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimer = useRef(null);

  // ------------------------------------------------------------------
  // Fetch cities (outer grid)
  // ------------------------------------------------------------------
  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: showWishlist ? 999 : 20, sort };
      if (!showWishlist) {
        params.page = page;
      } else {
        params.page = 1; // Fetch all top 999 for local pagination
      }
      
      if (stateFilter) params.state = stateFilter;
      
      const res = await api.get('/locations/cities', { params });
      
      let fetchedCities = res.data.cities || [];
      if (showWishlist && user?.savedDestinations) {
         // Filter wishlist locally
         fetchedCities = fetchedCities.filter(c => user.savedDestinations.includes(c.city));
         
         // Apply local pagination
         const startIndex = (page - 1) * 20;
         const endIndex = startIndex + 20;
         
         setTotalPages(Math.ceil(fetchedCities.length / 20) || 1);
         setTotal(fetchedCities.length);
         setCities(fetchedCities.slice(startIndex, endIndex));
      } else {
         setCities(fetchedCities);
         setTotalPages(res.data.total_pages || 1);
         setTotal(res.data.total || 0);
      }

      if (res.data.states && res.data.states.length > 0) {
        setStates(res.data.states);
      }
    } catch (err) {
      console.warn('Failed to fetch cities:', err.message);
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, stateFilter, showWishlist, user?.savedDestinations]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [stateFilter, sort, showWishlist]);

  // ------------------------------------------------------------------
  // Navigate to CityPage
  // ------------------------------------------------------------------
  const handleCityClick = (city) => {
    const citySlug = city.city.trim().toLowerCase().replace(/\s+/g, '-');
    navigate(`/places/${citySlug}`);
  };

  const handlePlaceClick = (place) => {
    const citySlug = place.city.trim().toLowerCase().replace(/\s+/g, '-');
    const placeSlug = place.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    navigate(`/places/${citySlug}/${placeSlug}`);
  };

  // ------------------------------------------------------------------
  // Semantic Search (debounced, 33k locations_rows.csv)
  // ------------------------------------------------------------------
  // ------------------------------------------------------------------
  // Simple Search (Direct Navigation)
  // ------------------------------------------------------------------
  const handleSearchSelect = (res) => {
    if (res.isRaw) {
      setSearchQuery(res.name);
      return; // Don't navigate on raw text typing
    }

    if (res.is_city) {
      handleCityClick({ city: res.name });
    } else {
      handlePlaceClick({ name: res.name, city: res.city });
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="page-container container places-page">
      <div className="places-header">
        <h1 className="gradient-text">Explore Incredible India</h1>
        <p className="text-muted">Browse {total} cities or search for your favorite destinations</p>

        {/* Search bar */}
        <div className="search-bar" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <div style={{ flex: 1, maxWidth: '600px' }}>
            <Autocomplete 
              placeholder="Search for a city or place..."
              onSelect={handleSearchSelect}
            />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              if (searchQuery.trim()) navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
            }}
            disabled={!searchQuery.trim()}
          >
            🔍
          </button>
        </div>

        {/* Filters */}
        <div className="filter-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <select
            className="input-field filter-select"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="input-field filter-select"
            value={sort}
            onChange={handleSortChange}
          >
            <option value="alpha">Alphabetical</option>
            <option value="highest_rated">Highest Rated</option>
            <option value="most_reviewed">Most Reviewed</option>
          </select>

          {user && (
            <button 
              className={`premium-btn ${showWishlist ? 'active' : ''}`}
              onClick={() => setShowWishlist(!showWishlist)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {showWishlist ? '❤️ My Wishlist' : '🤍 Show Wishlist'}
            </button>
          )}
        </div>
      </div>

      {/* ---------- City Grid ---------- */}
      <>
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            Loading cities...
          </div>
        ) : (
          <>
              <div className="places-grid">
                {cities.length > 0 ? (
                  cities.map((city, i) => (
                    <motion.div
                      key={`${city.state}-${city.city}`}
                      className="place-card glass-card city-browse-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ y: -8 }}
                      onClick={() => handleCityClick(city)}
                    >
                      <div className="place-image">
                        <img loading="lazy"
                          src={city.thumbnail}
                          alt={city.city}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80'; }}
                        />
                        <div className="place-rating">{city.place_count} place{city.place_count !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="place-info">
                        <h3>{city.city}</h3>
                        <div className="place-meta">
                          <span className="place-state">{city.state}</span>
                          <span className="city-rating-badge">&#9733; {city.avg_rating}</span>
                        </div>
                        {city.total_reviews_lakhs > 0 && (
                          <p className="city-reviews">{city.total_reviews_lakhs}L reviews</p>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                    No cities found. Try a different state filter.
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn-outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    &larr; Previous
                  </button>
                  <span className="page-info">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn-outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
      </>
    </div>
  );
};

export default Places;
