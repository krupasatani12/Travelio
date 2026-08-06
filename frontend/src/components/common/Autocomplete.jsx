import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Autocomplete.css';

const Autocomplete = ({ placeholder = "Search for a city or place...", onSelect, className = "", initialValue = "" }) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (initialValue !== query) {
      setQuery(initialValue || "");
    }
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const debounceTimeout = setTimeout(async () => {
      // Search if query >= 1 chars AND the input is currently focused by the user
      if (query.trim().length > 0 && isFocused) {
        setLoading(true);
        try {
          const res = await api.get('/locations/places/autocomplete', { params: { q: query, limit: 5 } });
          setResults(res.data.results || []);
          if (res.data.results && res.data.results.length > 0) {
            setIsOpen(true);
          }
        } catch (error) {
          console.error("Failed to fetch autocomplete", error);
        } finally {
          setLoading(false);
        }
      } else if (!isFocused) {
        // Optional: clear results if we want, but keeping them might be nice if they just clicked away
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimeout);
  }, [query, isFocused]);

  const handleSelect = (result) => {
    setQuery(result.name);
    setIsOpen(false);
    if (onSelect) {
      onSelect(result);
    }
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    if (onSelect) {
      // Allow parent to get the raw text as well
      onSelect({ name: e.target.value, isRaw: true });
    }
  };

  return (
    <div className={`autocomplete-wrapper ${className}`} ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        className="input-field autocomplete-input"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        onFocus={() => { 
          setIsFocused(true);
          if (results.length > 0) setIsOpen(true); 
        }}
        onBlur={() => {
          // We delay setting isFocused to false slightly so that clicking a result works
          setTimeout(() => setIsFocused(false), 200);
        }}
        required
      />
      {loading && <div className="autocomplete-loading" style={{ position: 'absolute', right: '10px', top: '10px' }}>⏳</div>}
      
      {isOpen && results.length > 0 && (
        <ul className="autocomplete-dropdown glass-card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, listStyle: 'none', padding: 0, margin: '4px 0 0 0', maxHeight: '200px', overflowY: 'auto' }}>
          {results.map((item, idx) => (
            <li 
              key={idx} 
              className="autocomplete-item" 
              onClick={() => handleSelect(item)}
              style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
            >
              <span className="ac-name">
                {item.is_city ? <span style={{marginRight: '6px', fontSize: '1.1em'}}>🏙️</span> : <span style={{marginRight: '6px', fontSize: '1.1em', color: 'var(--primary)'}}>📍</span>}
                {item.name}
              </span>
              {item.city && item.city !== item.name && <span className="ac-city" style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}> ({item.city})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Autocomplete;
