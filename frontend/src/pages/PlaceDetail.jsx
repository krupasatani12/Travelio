import React, { useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import DepthGallery from '../components/place/DepthGallery';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './PlaceDetail.css';

// Mock data mapping
const placeDetails = {
  'agra': {
    name: 'Agra', state: 'Uttar Pradesh', type: 'Historical', rating: 4.8,
    description: 'Home to the iconic Taj Mahal, Agra is a city on the banks of the Yamuna river in Uttar Pradesh. It is a major tourist destination because of its many splendid Mughal-era buildings.',
    bestTimeToVisit: 'October to March',
    photos: [
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da',
      'https://images.unsplash.com/photo-1564507592208-528f83141a97',
      'https://images.unsplash.com/photo-1548013146-72479768bada',
      'https://images.unsplash.com/photo-1585506942812-e72b29cef752',
      'https://images.unsplash.com/photo-1534430267275-06399081e7d2'
    ]
  },
  // Add fallback for anything else
  'default': {
    name: 'Beautiful Destination', state: 'India', type: 'Mixed', rating: 4.5,
    description: 'An incredible destination in India waiting to be explored. Rich in culture, history, and natural beauty.',
    bestTimeToVisit: 'September to March',
    photos: [
      'https://images.unsplash.com/photo-1514222134-b57cbb8ce073',
      'https://images.unsplash.com/photo-1587474260584-136574528ed5',
      'https://images.unsplash.com/photo-1490079027102-cd08f2308c73',
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2',
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2'
    ]
  }
};

const PlaceDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const place = placeDetails[id] || { ...placeDetails['default'], name: id.charAt(0).toUpperCase() + id.slice(1) };
  
  const isSaved = user?.savedDestinations?.includes(place.name);

  const toggleSave = async () => {
    if (!user) {
      setMessage("Please login to save destinations");
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    setSaving(true);
    try {
      if (isSaved) {
        await api.delete('/favorites/remove', { data: { destination: place.name } });
        setMessage("Removed from favorites");
      } else {
        await api.post('/favorites/save', { destination: place.name });
        setMessage("Added to favorites");
      }
      // Re-fetch user to update context state (handled by AuthContext in a full implementation)
      setTimeout(() => window.location.reload(), 1000); // Quick hack for now
    } catch (err) {
      setMessage("Failed to update favorites");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container place-detail-page">
      <div className="container">
        <div className="place-header-section">
          <div className="place-title-area">
            <h1 className="gradient-text">{place.name}</h1>
            <p className="place-subtitle">{place.state} • {place.type} • ⭐ {place.rating}</p>
          </div>
          
          <div className="place-actions">
            <button 
              className={`btn-${isSaved ? 'outline' : 'primary'}`} 
              onClick={toggleSave}
              disabled={saving}
            >
              {saving ? '...' : isSaved ? '❤️ Saved' : '🤍 Save to Favorites'}
            </button>
            <Link to={`/chatbot?context=${encodeURIComponent(place.name)}&auto=true`} className="btn-primary">
              Plan a Trip Here
            </Link>
          </div>
        </div>
        {message && <div className="toast-msg">{message}</div>}
      </div>

      {/* Interactive Signature #6 */}
      <DepthGallery photos={place.photos} />

      <div className="container">
        <div className="place-info-grid">
          <div className="info-main glass-card">
            <h2>About {place.name}</h2>
            <p>{place.description}</p>
            <p><strong>Best time to visit:</strong> {place.bestTimeToVisit}</p>
          </div>
          
          <div className="info-sidebar">
            <div className="glass-card side-card">
              <h3>Check Safety</h3>
              <p>View real-time crime stats and safety scores before you go.</p>
              <Link to={`/safety?city=${place.name}`} className="btn-outline">Check Safety Score</Link>
            </div>
            
            <div className="glass-card side-card mt-4">
              <h3>Forecast Budget</h3>
              <p>Get AI predictions for accommodation and travel costs.</p>
              <Link to={`/budget?city=${place.name}`} className="btn-outline">Forecast Costs</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetail;
