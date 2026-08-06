import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './Journal.css';
import Autocomplete from '../components/common/Autocomplete';

const RATING_FIELDS = [
  { key: 'ratingValueForMoney', label: 'Value for Money' },
  { key: 'ratingCleanliness', label: 'Cleanliness' },
  { key: 'ratingSafetyFelt', label: 'Safety Felt' },
  { key: 'ratingCrowds', label: 'How Crowded (5 = Not Crowded)' },
];

const Journal = () => {
  const { user } = useContext(AuthContext);
  const [journals, setJournals] = useState([]);
  const [publicJournals, setPublicJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [activeTab, setActiveTab] = useState('my_journals'); // 'my_journals' or 'community'

  // Form state
  const [form, setForm] = useState({
    title: '', content: '', location: '', mood: 'good', rating: 0,
    ratingValueForMoney: 3, ratingCrowds: 3, ratingCleanliness: 3,
    ratingSafetyFelt: 3, ratingWouldReturn: null,
    actualSpendPerDay: '', actualDaysStayed: '',
    visibility: 'private'
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [showSliders, setShowSliders] = useState(false);
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimer = useRef(null);
  
  // Comment state
  const [commentText, setCommentText] = useState('');
  const [activeCommentId, setActiveCommentId] = useState(null);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const fetchJournals = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my_journals') {
        const res = await api.get('/journals', { params: { sort: sortBy } });
        setJournals(res.data.journals);
      } else {
        const res = await api.get('/journals/public', { params: { page: 1, limit: 50 } });
        setPublicJournals(res.data.journals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJournals(); }, [sortBy, activeTab]);

  // Handle Autocomplete
  const handleLocationChange = (e) => {
    const q = e.target.value;
    updateForm('location', q);

    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      try {
        const res = await api.get('/journals/destinations/autocomplete', { params: { q } });
        setSuggestions(res.data.results || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);
  };

  const selectSuggestion = (place) => {
    updateForm('location', `${place.name}, ${place.city}`);
    setShowSuggestions(false);
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);
  };

  const resetForm = () => {
    setForm({
      title: '', content: '', location: '', mood: 'good', rating: 0,
      ratingValueForMoney: 3, ratingCrowds: 3, ratingCleanliness: 3,
      ratingSafetyFelt: 3, ratingWouldReturn: null,
      actualSpendPerDay: '', actualDaysStayed: '', visibility: 'private'
    });
    setMediaFiles([]);
    setIsEditing(false);
    setCurrentId(null);
    setShowSliders(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });
      
      mediaFiles.forEach(file => {
        formData.append('media', file);
      });

      if (isEditing) {
        await api.put(`/journals/${currentId}`, form); // PUT doesn't support file update cleanly without more logic, simplified for now
      } else {
        await api.post('/journals', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      resetForm();
      fetchJournals();
    } catch (err) {
      console.error(err);
      alert('Failed to save journal');
    }
  };

  const handleEdit = (journal) => {
    setForm({
      title: journal.title, content: journal.content,
      location: journal.location || '', mood: journal.mood || 'good',
      rating: journal.rating || 0,
      ratingValueForMoney: journal.ratingValueForMoney || 3,
      ratingCrowds: journal.ratingCrowds || 3,
      ratingCleanliness: journal.ratingCleanliness || 3,
      ratingSafetyFelt: journal.ratingSafetyFelt || 3,
      ratingWouldReturn: journal.ratingWouldReturn,
      actualSpendPerDay: journal.actualSpendPerDay || '',
      actualDaysStayed: journal.actualDaysStayed || '',
      visibility: journal.visibility || 'private'
    });
    setCurrentId(journal._id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await api.delete(`/journals/${id}`);
      fetchJournals();
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  const handleToggleSave = async (id) => {
    try {
      await api.post(`/journals/${id}/save`);
      fetchJournals(); // Refresh list to show updated save status
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (id) => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/journals/${id}/comment`, { text: commentText });
      setCommentText('');
      setActiveCommentId(null);
      fetchJournals();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return <div className="page-container container text-center">Please log in to use the Travel Journal.</div>;
  }

  const displayedJournals = activeTab === 'my_journals' ? journals : publicJournals;

  return (
    <div className="page-container container journal-page">
      <div className="journal-header text-center">
        <h1 className="gradient-text">Travel Journal</h1>
        <p className="text-muted">Document your adventures, rate your experiences, and help other travellers.</p>
      </div>

      <div className="journal-layout">
        {/* ======= Editor ======= */}
        <div className="journal-editor glass-card">
          <h2>{isEditing ? 'Edit Entry' : 'New Entry'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-4">
              <input
                type="text" className="input-field"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="Entry Title (e.g., Sunset at Taj Mahal)"
                required
              />
            </div>

            <div className="form-group mb-4 position-relative" style={{ position: 'relative' }}>
              <Autocomplete 
                placeholder="Destination (e.g., Manali, Goa, Delhi)"
                initialValue={form.location}
                onSelect={(res) => updateForm('location', res.isRaw ? res.name : `${res.name}, ${res.city}`)}
              />
            </div>

            <div className="form-group mb-4">
              <textarea
                className="input-field" rows="6"
                value={form.content}
                onChange={(e) => updateForm('content', e.target.value)}
                placeholder="Write your story here..."
                required
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            
            <div className="form-group mb-4">
              <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Photos & Videos</label>
              <input 
                type="file" 
                className="input-field" 
                multiple 
                accept="image/*,video/*"
                onChange={handleMediaChange}
                disabled={isEditing} // Disable for now during edits
              />
              {mediaFiles.length > 0 && (
                <div style={{ fontSize: '0.8rem', marginTop: '4px', color: 'var(--primary)' }}>
                  {mediaFiles.length} file(s) selected
                </div>
              )}
            </div>
            
            <div className="form-group mb-4">
              <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Visibility</label>
              <select 
                className="input-field"
                value={form.visibility}
                onChange={(e) => updateForm('visibility', e.target.value)}
              >
                <option value="private">Private (Only you can see)</option>
                <option value="public">Public (Community can see)</option>
              </select>
            </div>

            {/* Star Rating */}
            <div className="form-group mb-4">
              <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Overall Rating</label>
              <div className="star-rating-row">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star} type="button"
                    className={`star-btn ${form.rating >= star ? 'active' : ''}`}
                    onClick={() => updateForm('rating', star)}
                  >
                    ★
                  </button>
                ))}
                <span className="star-value">{form.rating}/5</span>
              </div>
            </div>

            {/* Mood */}
            <div className="form-group mb-4">
              <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mood</label>
              <div className="d-flex gap-2">
                {['amazing', 'good', 'okay', 'bad'].map(m => (
                  <button
                    key={m} type="button"
                    className={`chip ${form.mood === m ? 'active' : ''}`}
                    onClick={() => updateForm('mood', m)}
                  >
                    {m === 'amazing' ? '🤩' : m === 'good' ? '😊' : m === 'okay' ? '😐' : '😞'} {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle structured ratings */}
            <button
              type="button"
              className="btn-outline btn-sm mb-4"
              onClick={() => setShowSliders(!showSliders)}
              style={{ width: '100%' }}
            >
              {showSliders ? 'Hide Detailed Ratings' : '📊 Add Detailed Ratings (helps other travellers)'}
            </button>

            {/* Layer 3 — Structured Review Sliders */}
            <AnimatePresence>
              {showSliders && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="structured-ratings"
                >
                  <div className="ratings-header">
                    <span>QUICK RATINGS</span>
                  </div>

                  {RATING_FIELDS.map(({ key, label }) => (
                    <div key={key} className="slider-group">
                      <div className="slider-label-row">
                        <span>{label}</span>
                        <span className="slider-value">{form[key]}/5</span>
                      </div>
                      <input
                        type="range" min={1} max={5} step={1}
                        value={form[key]}
                        onChange={(e) => updateForm(key, parseInt(e.target.value))}
                        className="rating-slider"
                      />
                    </div>
                  ))}

                  {/* Would return */}
                  <div className="slider-group">
                    <div className="slider-label-row">
                      <span>Would you return?</span>
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" className={`chip ${form.ratingWouldReturn === true ? 'active' : ''}`}
                        onClick={() => updateForm('ratingWouldReturn', true)}>👍 Yes</button>
                      <button type="button" className={`chip ${form.ratingWouldReturn === false ? 'active' : ''}`}
                        onClick={() => updateForm('ratingWouldReturn', false)}>👎 No</button>
                    </div>
                  </div>

                  {/* Actual spend */}
                  <div className="spend-grid">
                    <div>
                      <label className="ratings-header">ACTUAL SPEND/DAY (₹)</label>
                      <input className="input-field" type="number" placeholder="e.g. 2200"
                        value={form.actualSpendPerDay}
                        onChange={(e) => updateForm('actualSpendPerDay', e.target.value)} />
                    </div>
                    <div>
                      <label className="ratings-header">DAYS STAYED</label>
                      <input className="input-field" type="number" placeholder="e.g. 5"
                        value={form.actualDaysStayed}
                        onChange={(e) => updateForm('actualDaysStayed', e.target.value)} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="d-flex gap-3">
              <button type="submit" className="btn-primary flex-1">
                {isEditing ? 'Update Entry' : 'Save Entry'}
              </button>
              {isEditing && (
                <button type="button" className="btn-outline flex-1" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ======= Entries List ======= */}
        <div className="journal-list-section">
          <div className="journal-tabs">
            <button 
              className={`tab-btn ${activeTab === 'my_journals' ? 'active' : ''}`}
              onClick={() => setActiveTab('my_journals')}
            >
              My Journals
            </button>
            <button 
              className={`tab-btn ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              Community Feed
            </button>
          </div>
          
          <div className="journal-list-header mt-3">
            <h2>{activeTab === 'my_journals' ? 'Your Entries' : 'Public Explorer Feed'}</h2>
            {activeTab === 'my_journals' && (
              <select
                className="input-field sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Most Recent</option>
                <option value="relevance">Most Relevant</option>
                <option value="rating">Highest Rated</option>
                <option value="budget">Budget Friendly</option>
              </select>
            )}
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : displayedJournals.length === 0 ? (
            <div className="glass-card text-center p-5">
              <span style={{ fontSize: '3rem' }}>{activeTab === 'my_journals' ? '✍️' : '🌍'}</span>
              <p className="mt-3 text-muted">
                {activeTab === 'my_journals' 
                  ? "You haven't written any entries yet. Start writing!" 
                  : "No public journals available."}
              </p>
            </div>
          ) : (
            <div className="entries-list">
              {displayedJournals.map((journal, i) => {
                const isSaved = journal.savedBy?.includes(user._id);
                return (
                  <motion.div
                    key={journal._id}
                    className="entry-card glass-card"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="entry-header">
                      <div>
                        <h3>{journal.title}</h3>
                        <div className="entry-meta">
                          {activeTab === 'community' && journal.userId && (
                            <span className="author-badge">By {journal.userId.name}</span>
                          )}
                          <small className="text-muted">{new Date(journal.createdAt).toLocaleDateString()}</small>
                          {journal.location && <span className="entry-location">📍 {journal.location}</span>}
                          {journal.isVerifiedTrip && (
                            <span className="verified-badge">✓ Verified Trip</span>
                          )}
                        </div>
                      </div>
                      {journal.rating > 0 && (
                        <div className="entry-stars">{'★'.repeat(journal.rating)}{'☆'.repeat(5 - journal.rating)}</div>
                      )}
                    </div>
                    
                    {/* Media Render */}
                    {journal.media && journal.media.length > 0 && (
                      <div className="entry-media-gallery">
                        {journal.media.map((m, idx) => (
                          m.type === 'video' ? 
                            <video key={idx} src={api.defaults.baseURL.replace('/api', '') + m.url} controls className="journal-media" /> :
                            <img key={idx} src={api.defaults.baseURL.replace('/api', '') + m.url} alt="Journal media" className="journal-media" />
                        ))}
                      </div>
                    )}

                    <p className="entry-content">{journal.content}</p>

                    {/* Show structured ratings if present */}
                    {(journal.ratingValueForMoney > 0 || journal.ratingSafetyFelt > 0) && (
                      <div className="entry-ratings-row">
                        {journal.ratingValueForMoney > 0 && <span className="mini-rating">💰 Value: {journal.ratingValueForMoney}/5</span>}
                        {journal.ratingCleanliness > 0 && <span className="mini-rating">🧹 Clean: {journal.ratingCleanliness}/5</span>}
                        {journal.ratingSafetyFelt > 0 && <span className="mini-rating">🛡️ Safety: {journal.ratingSafetyFelt}/5</span>}
                        {journal.ratingCrowds > 0 && <span className="mini-rating">👥 Crowds: {journal.ratingCrowds}/5</span>}
                        {journal.actualSpendPerDay > 0 && <span className="mini-rating">₹{journal.actualSpendPerDay}/day</span>}
                      </div>
                    )}
                    
                    {/* Comments Section */}
                    {journal.comments && journal.comments.length > 0 && (
                      <div className="journal-comments">
                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', marginTop: '1rem' }}>Comments</h4>
                        {journal.comments.map((c, idx) => (
                          <div key={idx} className="comment-item">
                            💬 <span className="comment-text">{c.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeCommentId === journal._id && (
                      <div className="comment-input-area mt-3 d-flex gap-2">
                        <input 
                          type="text" 
                          className="input-field" 
                          placeholder="Write a comment..." 
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button className="btn-primary btn-sm" onClick={() => handleComment(journal._id)}>Post</button>
                      </div>
                    )}

                    <div className="entry-footer mt-3">
                      <span className={`mood-tag mood-${journal.mood}`}>
                        {journal.mood === 'amazing' ? '🤩' : journal.mood === 'good' ? '😊' : journal.mood === 'okay' ? '😐' : '😞'} {journal.mood}
                      </span>
                      <div className="entry-actions">
                        {activeTab === 'community' && (
                          <>
                            <button className={`btn-outline btn-sm ${isSaved ? 'active-saved' : ''}`} onClick={() => handleToggleSave(journal._id)}>
                              {isSaved ? '❤️ Saved' : '🤍 Save'}
                            </button>
                            <button className="btn-outline btn-sm" onClick={() => setActiveCommentId(activeCommentId === journal._id ? null : journal._id)}>
                              Comment
                            </button>
                          </>
                        )}
                        {activeTab === 'my_journals' && (
                          <>
                            <button className="btn-outline btn-sm" onClick={() => handleEdit(journal)}>Edit</button>
                            <button className="btn-outline btn-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleDelete(journal._id)}>Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .journal-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start; }
        .journal-editor { padding: 2rem; position: sticky; top: 100px; }
        .journal-list-section h2, .journal-editor h2 { margin-bottom: 0; color: var(--primary); }
        .entries-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .entry-card { padding: 1.5rem; }
        .entry-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
        .entry-content { white-space: pre-wrap; line-height: 1.6; }
        .flex-1 { flex: 1; }
        .d-flex { display: flex; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .mt-3 { margin-top: 1rem; }

        .journal-tabs { display: flex; gap: 1rem; border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1)); padding-bottom: 0; position: relative; }
        .journal-tabs .tab-btn { background: none; border: none; border-bottom: 3px solid transparent; font-size: 1.1rem; color: var(--text-muted); font-weight: 600; cursor: pointer; transition: color 0.3s ease, border-color 0.3s ease; padding: 0.5rem 1rem; margin-bottom: -1px; position: relative; box-shadow: none; outline: none; }
        .journal-tabs .tab-btn::before, .journal-tabs .tab-btn::after { display: none !important; content: none !important; }
        .journal-tabs .tab-btn.active { color: var(--primary); border-bottom: 3px solid var(--primary); background: transparent; box-shadow: none; }
        
        .journal-list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .sort-select { max-width: 180px; font-size: 0.82rem; padding: 6px 12px; }

        .entry-meta { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.3rem; flex-wrap: wrap; }
        .entry-location { font-size: 0.78rem; color: var(--text-secondary); }
        .entry-stars { color: #f5a623; font-size: 1.1rem; letter-spacing: 2px; }
        .author-badge { font-size: 0.75rem; background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 2px 8px; border-radius: 12px; font-weight: 600; }

        /* Media */
        .entry-media-gallery { display: flex; gap: 0.5rem; overflow-x: auto; margin-bottom: 1rem; padding-bottom: 0.5rem; }
        .journal-media { height: 150px; border-radius: 8px; object-fit: cover; }

        /* Autocomplete */
        .autocomplete-dropdown { position: absolute; top: 100%; left: 0; right: 0; z-index: 10; max-height: 200px; overflow-y: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px; padding: 0.5rem; }
        .autocomplete-item { padding: 0.5rem 1rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; font-size: 0.9rem; }
        .autocomplete-item:hover { background: rgba(255,255,255,0.1); }

        /* Comments */
        .journal-comments { background: rgba(255,255,255,0.02); padding: 0.5rem 1rem; border-radius: 8px; border-left: 3px solid var(--border-light); }
        .comment-item { font-size: 0.85rem; margin-bottom: 0.3rem; color: var(--text-secondary); }
        .comment-text { font-style: italic; }
        .active-saved { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; color: #ef4444; }

        /* Layer 2 — Verified Badge */
        .verified-badge {
          font-size: 0.68rem; padding: 2px 8px; border-radius: 100px;
          background: rgba(45,204,112,0.12); color: #2dcc70;
          border: 1px solid rgba(45,204,112,0.25);
          font-family: monospace; display: inline-flex; align-items: center; gap: 3px;
          font-weight: 600;
        }

        /* Star rating */
        .star-rating-row { display: flex; align-items: center; gap: 4px; }
        .star-btn { background: none; border: none; font-size: 1.5rem; color: var(--border-color); cursor: pointer; transition: color 0.15s; }
        .star-btn.active { color: #f5a623; }
        .star-btn:hover { color: #f5a623; }
        .star-value { font-size: 0.82rem; color: var(--text-secondary); margin-left: 8px; font-family: monospace; }

        /* Structured ratings (Layer 3) */
        .structured-ratings { overflow: hidden; margin-bottom: 1rem; padding: 1rem; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); }
        .ratings-header { font-size: 0.68rem; color: var(--text-secondary); font-family: monospace; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.8rem; display: block; }
        .slider-group { margin-bottom: 0.8rem; }
        .slider-label-row { display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.3rem; }
        .slider-value { color: var(--primary); font-family: monospace; font-weight: 600; }
        .rating-slider { width: 100%; accent-color: var(--primary); }
        .spend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-top: 1rem; }

        /* Entry ratings row */
        .entry-ratings-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid var(--border-color); }
        .mini-rating { font-size: 0.72rem; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 8px; color: var(--text-secondary); }

        /* Footer */
        .entry-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 0.5rem; }
        .entry-actions { display: flex; gap: 0.5rem; }
        .mood-tag { font-size: 0.78rem; padding: 3px 10px; border-radius: 12px; background: rgba(255,255,255,0.05); }

        @media (max-width: 900px) { .journal-layout { grid-template-columns: 1fr; } .journal-editor { position: static; } }
      `}</style>
    </div>
  );
};

export default Journal;
