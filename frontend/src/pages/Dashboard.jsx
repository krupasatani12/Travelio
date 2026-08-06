import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import AuthGate from '../components/common/AuthGate';
import CreditUsageTable from '../components/dashboard/CreditUsageTable';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [journals, setJournals] = useState([]);
  const [trips, setTrips] = useState([]);
  const [wishlistDetails, setWishlistDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [journalRes, wishlistRes, tripsRes] = await Promise.all([
          api.get('/journals'),
          api.get('/favorites/details'),
          api.get('/trips')
        ]);
        setJournals(journalRes.data.journals || []);
        setWishlistDetails(wishlistRes.data.savedDestinations || []);
        setTrips(tripsRes.data.trips || []);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (!user) {
    return <AuthGate mode="page" action="view your dashboard" />;
  }

  return (
    <div className="page-container container dashboard-page">
      <div className="dashboard-header glass-card">
        <div>
          <h1 className="gradient-text">Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="text-muted">Manage your trips, journals, and saved destinations.</p>
        </div>
        <button onClick={logout} className="btn-outline">Logout</button>
      </div>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-sidebar">
          {/* AI Credits Usage */}
          <div className="glass-card stat-card">
            <h3>AI Credits</h3>
            <div className="credits-bar-container mt-2 mb-2" style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
              <div 
                className="credits-bar-fill" 
                style={{ 
                  width: `${Math.min(100, Math.max(0, (user.credits / (user.maxCredits || 100)) * 100))}%`, 
                  background: (user.credits / (user.maxCredits || 100)) < 0.2 ? 'var(--danger)' : 'linear-gradient(90deg, var(--primary), var(--secondary))', 
                  height: '100%', 
                  transition: 'width 0.3s ease' 
                }} 
              />
            </div>
            <p className="text-muted" style={{ fontSize: '0.9rem', margin: 0 }}>
              {user.maxCredits - user.credits} / {user.maxCredits || 100} credits used today
            </p>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
              (Resets at midnight IST)
            </p>
            
            <CreditUsageTable data={user.creditUsage || []} />
          </div>

          <div className="glass-card stat-card">
            <h3>My Wishlist</h3>
            {wishlistDetails.length > 0 ? (
              <ul className="saved-list">
                {wishlistDetails.map((dest, i) => (
                  <li key={i}>
                    <Link to={dest.url}>{dest.name}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No saved destinations yet.</p>
            )}
            <Link to="/places" className="btn-primary" style={{display: 'block', textAlign: 'center', marginTop: '1rem'}}>
              Explore Places
            </Link>
          </div>

          <div className="glass-card stat-card">
            <h3>Travel Preferences</h3>
            <div className="pref-tags">
              {user.preferences?.types?.map(p => <span key={p} className="tag">{p}</span>)}
              {!user.preferences?.types?.length && <p className="text-muted">Not set</p>}
            </div>
          </div>
        </div>

        {/* Right Column - Journals */}
        <div className="dashboard-main glass-card">
          <div className="main-header">
            <h3>Travel Journals</h3>
            <Link to="/journal" className="btn-outline btn-sm">Write New</Link>
          </div>
          
          {loading ? (
            <p>Loading journals...</p>
          ) : journals.length > 0 ? (
            <div className="journal-list">
              {journals.map(journal => (
                <div key={journal._id} className="journal-item">
                  <h4>{journal.title}</h4>
                  <p className="text-muted">{new Date(journal.createdAt).toLocaleDateString()}</p>
                  <p className="journal-excerpt">{journal.content.substring(0, 100)}...</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span style={{fontSize: '3rem'}}>📓</span>
              <p>You haven't written any travel journals yet.</p>
              <Link to="/journal" className="btn-primary mt-3">Start Journaling</Link>
            </div>
          )}

          <div className="main-header" style={{ marginTop: '2rem' }}>
            <h3>Planned Trips</h3>
            <Link to="/plan" className="btn-outline btn-sm">Plan New Trip</Link>
          </div>
          
          {loading ? (
            <p>Loading trips...</p>
          ) : trips.length > 0 ? (
            <div className="journal-list">
              {trips.map(trip => (
                <div key={trip._id} className="journal-item">
                  <h4>{trip.destination} ({trip.durationDays} Days)</h4>
                  <p className="text-muted">Confirmed on: {new Date(trip.createdAt).toLocaleDateString()}</p>
                  <p className="journal-excerpt">Group of {trip.groupSize} • Budget: ₹{trip.estimatedBudget}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span style={{fontSize: '3rem'}}>✈️</span>
              <p>You haven't planned any trips yet.</p>
              <Link to="/plan" className="btn-primary mt-3">Try AI Trip Planner</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
