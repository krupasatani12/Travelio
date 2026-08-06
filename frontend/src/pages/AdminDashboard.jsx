import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiMap, FiFlag, FiTag, FiStar, FiFileText, FiX, FiSearch } from 'react-icons/fi';
import api from '../utils/api';
import SpinBadge from '../components/common/SpinBadge';
import DataTable from '../components/admin/DataTable';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data States
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({ llm: {}, mode: 'online' });
  const [users, setUsers] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [places, setPlaces] = useState([]);
  const [cities, setCities] = useState([]);
  const [autocompleteData, setAutocompleteData] = useState({ states: [], cities: [] });

  // CRUD state for Database Manager
  const [activeDbTab, setActiveDbTab] = useState('places'); // 'places' or 'cities'
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [editingCity, setEditingCity] = useState(null);

  const [placeForm, setPlaceForm] = useState({ name: '', cityName: '', state: '', type: '', rating: 4.5, description: '' });
  const [cityForm, setCityForm] = useState({ name: '', state: '', teaser: '', type: '', aiSummary: '' });
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Charts State — now stores raw JSON data with base64 images
  const [charts, setCharts] = useState({
    systemHealth: null,
    safetyByState: null,
    cityComparison: null,
    budgetTrends: null,
    vibesDonut: null
  });
  const [chartsLoading, setChartsLoading] = useState(true);

  // Fetch all chart data as JSON
  const fetchChartsData = useCallback(async () => {
    setChartsLoading(true);
    try {
      const cb = Date.now();
      const [sys, safety, city, budget, vibes] = await Promise.all([
        api.get(`/admin/charts/system-health?theme=${theme}&cb=${cb}`).then(r => r.data).catch(() => null),
        api.get(`/admin/charts/safety-heatmap?theme=${theme}&cb=${cb}`).then(r => r.data).catch(() => null),
        api.get(`/admin/charts/city-comparison?theme=${theme}&cb=${cb}`).then(r => r.data).catch(() => null),
        api.get(`/admin/charts/budget-trends?theme=${theme}&cb=${cb}`).then(r => r.data).catch(() => null),
        api.get(`/admin/charts/vibes-donut?theme=${theme}&cb=${cb}`).then(r => r.data).catch(() => null),
      ]);
      setCharts({
        systemHealth: sys,
        safetyByState: safety?.error ? null : safety,
        cityComparison: city,
        budgetTrends: budget?.error ? null : budget,
        vibesDonut: vibes?.error ? null : vibes
      });
    } catch (e) {
      console.error("Failed to load charts", e);
    } finally {
      setChartsLoading(false);
    }
  }, [theme]);

  // Fetch all data
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, settingsRes, usersRes, logsRes, placesRes, citiesRes, autoRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/settings'),
        api.get('/admin/users'),
        api.get('/admin/logs/emails'),
        api.get('/admin/places'),
        api.get('/admin/cities'),
        api.get('/admin/locations/autocomplete')
      ]);

      setStats(statsRes.data);
      setSettings(settingsRes.data);
      setUsers(usersRes.data.users);
      setEmailLogs(logsRes.data.logs);
      setPlaces(placesRes.data);
      setCities(citiesRes.data);
      setAutocompleteData(autoRes.data);

      await fetchChartsData();
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  }, [fetchChartsData]);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    if (user?.role === 'admin') fetchAll();
  }, [user, navigate, fetchAll]);

  const handleSettingSave = async () => {
    try {
      await api.put('/admin/settings', settings);
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings');
    }
  };

  const handleModeToggle = async (e) => {
    const newMode = e.target.checked ? 'online' : 'offline';
    if (newMode === 'offline' && !window.confirm('Are you sure you want to take the AI system OFFLINE? Users will not be able to use the chatbot or trip planner.')) {
      return;
    }
    const newSettings = { ...settings, mode: newMode };
    setSettings(newSettings);
    try {
      await api.put('/admin/settings', { mode: newMode });
    } catch (err) {
      alert('Failed to update mode');
    }
  };

  const handleUpdateCredits = async (userId, newMax, resetNow = false) => {
    try {
      await api.put(`/admin/users/${userId}/credits`, { maxCredits: newMax, resetNow });
      // Update local state
      setUsers(users.map(u => {
        if (u._id === userId) {
          return { ...u, maxCredits: newMax, credits: resetNow ? newMax : u.credits };
        }
        return u;
      }));
    } catch (err) {
      alert('Failed to update credits');
    }
  };

  const handlePlaceSave = async (e) => {
    e.preventDefault();

    // Check for existing place
    const existingPlace = places.find(
      p => p.name.toLowerCase().trim() === placeForm.name.toLowerCase().trim() &&
        p.cityName.toLowerCase().trim() === placeForm.cityName.toLowerCase().trim()
    );
    if (existingPlace && (!editingPlace || editingPlace._id !== existingPlace._id)) {
      alert('Error: This place already exists in this city!');
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(placeForm).forEach(key => formData.append(key, placeForm[key]));
      files.forEach(f => formData.append('images', f));

      if (editingPlace) {
        const res = await api.put(`/admin/places/${editingPlace._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setPlaces(places.map(p => p._id === editingPlace._id ? res.data : p));
      } else {
        const res = await api.post('/admin/places', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setPlaces([res.data, ...places]);
      }
      setShowPlaceModal(false);
      setFiles([]);
    } catch (err) {
      alert('Failed to save place: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCitySave = async (e) => {
    e.preventDefault();

    // Check for existing city
    const existingCity = cities.find(
      c => c.name.toLowerCase().trim() === cityForm.name.toLowerCase().trim() &&
        c.state.toLowerCase().trim() === cityForm.state.toLowerCase().trim()
    );
    if (existingCity && (!editingCity || editingCity._id !== existingCity._id)) {
      alert('Error: This city already exists in this state!');
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(cityForm).forEach(key => formData.append(key, cityForm[key]));
      files.forEach(f => formData.append('images', f));

      if (editingCity) {
        const res = await api.put(`/admin/cities/${editingCity._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setCities(cities.map(c => c._id === editingCity._id ? res.data : c));
      } else {
        const res = await api.post('/admin/cities', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setCities([res.data, ...cities]);
      }
      setShowCityModal(false);
      setFiles([]);
    } catch (err) {
      alert('Failed to save city: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePlaceDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this place?')) return;
    try {
      await api.delete(`/admin/places/${id}`);
      setPlaces(places.filter(p => p._id !== id));
    } catch (err) {
      alert('Failed to delete place');
    }
  };

  const handleCityDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this city?')) return;
    try {
      await api.delete(`/admin/cities/${id}`);
      setCities(cities.filter(c => c._id !== id));
    } catch (err) {
      alert('Failed to delete city');
    }
  };

  const filteredPlaces = places.filter(p =>
    (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.cityName && p.cityName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.type && p.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCities = cities.filter(c =>
    (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.state && c.state.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-container container admin-page">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="gradient-text">Admin Control Panel</h1>
          <p className="text-muted">Platform analytics and system configuration.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <button className="btn-outline btn-sm" onClick={fetchAll} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <SpinBadge text="SECURE • ADMIN PANEL • " />
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab-btn ${activeTab === 'llm' ? 'active' : ''}`} onClick={() => setActiveTab('llm')}>LLM Settings</button>
        <button className={`tab-btn ${activeTab === 'mode' ? 'active' : ''}`} onClick={() => setActiveTab('mode')}>System Mode</button>
        <button className={`tab-btn ${activeTab === 'credits' ? 'active' : ''}`} onClick={() => setActiveTab('credits')}>Users & Credits</button>
        <button className={`tab-btn ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>Database Manager</button>
        <button className={`tab-btn ${activeTab === 'emails' ? 'active' : ''}`} onClick={() => setActiveTab('emails')}>Email Logs</button>
      </div>

      {loading ? (
        <p>Loading system data...</p>
      ) : (
        <div className="tab-content">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              <div className="admin-grid">
                <div className="glass-card stat-box">
                  <h3>Total Users</h3>
                  <div className="stat-number">{stats?.userCount || 0}</div>
                </div>
                <div className="glass-card stat-box">
                  <h3>Verified Users</h3>
                  <div className="stat-number">{stats?.verifiedCount || 0}</div>
                </div>
                <div className="glass-card stat-box">
                  <h3>Journal Entries</h3>
                  <div className="stat-number">{stats?.journalCount || 0}</div>
                </div>
                <div className="glass-card stat-box">
                  <h3>System Status</h3>
                  <div className="stat-number" style={{ color: settings.mode === 'online' ? 'var(--success)' : 'var(--danger)', fontSize: '2.5rem' }}>
                    {settings.mode.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Live Analytics</h2>
                <button className="btn-outline btn-sm" onClick={fetchChartsData} disabled={chartsLoading}>
                  <i className={`fas fa-sync-alt mr-2 ${chartsLoading ? 'fa-spin' : ''}`}></i> {chartsLoading ? 'Loading...' : 'Refresh Charts'}
                </button>
              </div>
              <div className="charts-grid">
                <div className="glass-card chart-card full-width">
                  {charts.systemHealth?.image ? <img src={charts.systemHealth.image} alt="System Health" className="chart-img" /> : <p className="text-muted">Loading chart...</p>}
                </div>
                <div className="glass-card chart-card">
                  {charts.safetyByState?.image ? <img src={charts.safetyByState.image} alt="Destinations by State" className="chart-img" /> : <p className="text-muted">Loading chart...</p>}
                </div>
                <div className="glass-card chart-card">
                  {charts.cityComparison?.image ? <img src={charts.cityComparison.image} alt="City Comparison" className="chart-img" /> : <p className="text-muted">Loading chart...</p>}
                </div>
                <div className="glass-card chart-card">
                  {charts.budgetTrends?.image ? <img src={charts.budgetTrends.image} alt="Budget Trends" className="chart-img" /> : <p className="text-muted">Loading chart...</p>}
                </div>
                <div className="glass-card chart-card">
                  {charts.vibesDonut?.image ? <img src={charts.vibesDonut.image} alt="Vibes Donut" className="chart-img" /> : <p className="text-muted">Loading chart...</p>}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: LLM SETTINGS */}
          {activeTab === 'llm' && (
            <div className="glass-card p-5">
              <h2 className="mb-4">Mistral AI Configuration</h2>

              <div className="settings-group">
                <label>Model Engine</label>
                <select
                  className="form-select"
                  value={settings.llm?.model || 'mistral-small-latest'}
                  onChange={e => setSettings({ ...settings, llm: { ...settings.llm, model: e.target.value } })}
                >
                  <option value="mistral-small-latest">Mistral Small (Fast & Cheap)</option>
                  <option value="mistral-large-latest">Mistral Large (High Reasoning)</option>
                  <option value="open-mixtral-8x22b">Mixtral 8x22B (Open Weights)</option>
                </select>
              </div>

              <div className="settings-group">
                <label>
                  <span>Temperature (Creativity)</span>
                  <span>{settings.llm?.temperature || 0.7}</span>
                </label>
                <input
                  type="range" min="0" max="1" step="0.05" className="range-slider"
                  value={settings.llm?.temperature || 0.7}
                  onChange={e => setSettings({ ...settings, llm: { ...settings.llm, temperature: parseFloat(e.target.value) } })}
                />
              </div>

              <div className="settings-group">
                <label>
                  <span>Max Tokens (Response Length)</span>
                  <span>{settings.llm?.maxTokens || 1024}</span>
                </label>
                <input
                  type="range" min="256" max="4096" step="128" className="range-slider"
                  value={settings.llm?.maxTokens || 1024}
                  onChange={e => setSettings({ ...settings, llm: { ...settings.llm, maxTokens: parseInt(e.target.value) } })}
                />
              </div>

              <div className="settings-group">
                <label>
                  <span>Top-P (Nucleus Sampling)</span>
                  <span>{settings.llm?.topP || 0.9}</span>
                </label>
                <input
                  type="range" min="0" max="1" step="0.05" className="range-slider"
                  value={settings.llm?.topP || 0.9}
                  onChange={e => setSettings({ ...settings, llm: { ...settings.llm, topP: parseFloat(e.target.value) } })}
                />
              </div>

              <button className="btn-primary mt-4" onClick={handleSettingSave}>Save LLM Settings</button>
            </div>
          )}

          {/* TAB 3: SYSTEM MODE */}
          {activeTab === 'mode' && (
            <div className="glass-card p-5">
              <div className="mode-switch-container">
                <div className="mode-info">
                  <h2>Global AI System Status</h2>
                  <p className="text-muted">Toggle the main AI switch for maintenance.</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={settings.mode === 'online'} onChange={handleModeToggle} />
                  <span className="slider round"></span>
                </label>
              </div>

              <ul className="status-list">
                <li className="status-item">
                  <div className={`status-dot ${settings.mode === 'online' ? 'online' : 'offline'}`}></div>
                  <div>
                    <strong>TravelBot Assistant</strong>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Global site widget</div>
                  </div>
                </li>
                <li className="status-item">
                  <div className={`status-dot ${settings.mode === 'online' ? 'online' : 'offline'}`}></div>
                  <div>
                    <strong>AI Trip Planner</strong>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Itinerary generation</div>
                  </div>
                </li>
                <li className="status-item">
                  <div className={`status-dot ${settings.mode === 'online' ? 'online' : 'offline'}`}></div>
                  <div>
                    <strong>Email Delivery</strong>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>OTPs & Itineraries</div>
                  </div>
                </li>
                <li className="status-item">
                  <div className={`status-dot ${settings.mode === 'online' ? 'online' : 'offline'}`}></div>
                  <div>
                    <strong>Landmark Detection</strong>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>Mistral Vision fallback</div>
                  </div>
                </li>
              </ul>
            </div>
          )}

          {/* TAB 4: USERS & CREDITS */}
          {activeTab === 'credits' && (
            <div className="glass-card p-4">
              <h2 className="mb-4">Credit Management</h2>
              <div className="admin-table-container">
                <DataTable
                  data={users}
                  columns={[
                    {
                      accessorKey: 'name',
                      header: 'Name',
                      cell: (info) => (
                        <span>
                          {info.getValue()}
                          {info.row.original.role === 'admin' && <span className="badge otp" style={{ marginLeft: 8 }}>Admin</span>}
                        </span>
                      )
                    },
                    {
                      accessorKey: 'email',
                      header: 'Email',
                    },
                    {
                      id: 'usage',
                      header: 'Used / Max',
                      cell: (info) => (
                        <span>
                          <span style={{ color: (info.row.original.credits / info.row.original.maxCredits) < 0.2 ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold' }}>
                            {info.row.original.maxCredits - info.row.original.credits}
                          </span> / {info.row.original.maxCredits}
                        </span>
                      )
                    },
                    {
                      id: 'updateMax',
                      header: 'Update Max',
                      cell: (info) => (
                        <input
                          type="number"
                          className="credit-input"
                          defaultValue={info.row.original.maxCredits}
                          onBlur={(e) => {
                            if (e.target.value != info.row.original.maxCredits) {
                              handleUpdateCredits(info.row.original._id, parseInt(e.target.value));
                            }
                          }}
                        />
                      )
                    },
                    {
                      id: 'actions',
                      header: 'Actions',
                      cell: (info) => (
                        <button
                          className="btn-outline btn-sm"
                          onClick={() => handleUpdateCredits(info.row.original._id, info.row.original.maxCredits, true)}
                        >
                          Reset Quota
                        </button>
                      )
                    }
                  ]}
                />
              </div>
            </div>
          )}

          {/* TAB 5: DATABASE MANAGER */}
          {activeTab === 'database' && (
            <div className="glass-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h2>Database Manager</h2>
                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <div className="cool-search-box">
                    <FiSearch className="cool-search-icon" />
                    <input
                      type="text"
                      className="cool-search-input"
                      placeholder={`Search ${activeDbTab}...`}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button className={`btn-sm ${activeDbTab === 'cities' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveDbTab('cities')}>Cities</button>
                    <button className={`btn-sm ${activeDbTab === 'places' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveDbTab('places')}>Places</button>
                  </div>
                </div>
              </div>

              {activeDbTab === 'places' && (
                <>
                  <div className="d-flex justify-content-end mb-3">
                    <button className="btn-primary btn-sm" onClick={() => {
                      setEditingPlace(null);
                      setPlaceForm({ name: '', cityName: '', state: '', type: '', rating: 4.5, description: '' });
                      setFiles([]);
                      setShowPlaceModal(true);
                    }}>+ Add Place</button>
                  </div>
                  <div className="admin-table-container">
                    <DataTable
                      data={filteredPlaces}
                      columns={[
                        { accessorKey: 'name', header: 'Name' },
                        { id: 'location', header: 'City, State', accessorFn: row => `${row.cityName}, ${row.state}` },
                        { accessorKey: 'type', header: 'Type', cell: info => <span className="badge otp">{info.getValue()}</span> },
                        { accessorKey: 'rating', header: 'Rating', cell: info => `${info.getValue()} ⭐` },
                        {
                          id: 'actions', header: 'Actions',
                          cell: info => (
                            <div className="d-flex gap-2">
                              <button className="btn-outline btn-sm" onClick={() => {
                                setEditingPlace(info.row.original);
                                setPlaceForm(info.row.original);
                                setFiles([]);
                                setShowPlaceModal(true);
                              }}>Edit</button>
                              <button className="btn-outline btn-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handlePlaceDelete(info.row.original._id)}>Delete</button>
                            </div>
                          )
                        }
                      ]}
                    />
                  </div>
                </>
              )}

              {activeDbTab === 'cities' && (
                <>
                  <div className="d-flex justify-content-end mb-3">
                    <button className="btn-primary btn-sm" onClick={() => {
                      setEditingCity(null);
                      setCityForm({ name: '', state: '', type: '', teaser: '', aiSummary: '' });
                      setFiles([]);
                      setShowCityModal(true);
                    }}>+ Add City</button>
                  </div>
                  <div className="admin-table-container">
                    <DataTable
                      data={filteredCities}
                      columns={[
                        { accessorKey: 'name', header: 'Name' },
                        { accessorKey: 'state', header: 'State' },
                        { accessorKey: 'type', header: 'Type', cell: info => <span className="badge otp">{info.getValue() || 'CITY'}</span> },
                        {
                          id: 'actions', header: 'Actions',
                          cell: info => (
                            <div className="d-flex gap-2">
                              <button className="btn-outline btn-sm" onClick={() => {
                                setEditingCity(info.row.original);
                                setCityForm(info.row.original);
                                setFiles([]);
                                setShowCityModal(true);
                              }}>Edit</button>
                              <button className="btn-outline btn-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleCityDelete(info.row.original._id)}>Delete</button>
                            </div>
                          )
                        }
                      ]}
                    />
                  </div>
                </>
              )}

              {/* Place Modal (Light Modern UI) */}
              {showPlaceModal && (
                <div className="light-modal-overlay">
                  <div className="light-modal-card">
                    <div className="light-modal-header">
                      <div className="header-icon-container">
                        <FiMapPin className="header-icon" />
                      </div>
                      <h3>{editingPlace ? 'Edit place' : 'Add new place'}</h3>
                      <button type="button" className="close-btn" onClick={() => setShowPlaceModal(false)}><FiX /></button>
                    </div>

                    <form onSubmit={handlePlaceSave} className="light-modal-form">
                      <div className="form-group">
                        <label><FiMapPin className="label-icon" /> Place name</label>
                        <input className="form-control" list="place-names-list" value={placeForm.name} onChange={e => setPlaceForm({ ...placeForm, name: e.target.value })} placeholder="India Gate" required />
                        <datalist id="place-names-list">
                          {[...new Set(places.map(p => p.name))].map((name, i) => <option key={i} value={name} />)}
                        </datalist>
                      </div>

                      <div className="form-row">
                        <div className="form-col">
                          <label><FiMap className="label-icon" /> City</label>
                          <input className="form-control" list="cities-list" value={placeForm.cityName} onChange={e => setPlaceForm({ ...placeForm, cityName: e.target.value })} placeholder="Delhi" required />
                          <datalist id="cities-list">
                            {autocompleteData.cities.map(c => <option key={c._id} value={c.name} />)}
                          </datalist>
                        </div>
                        <div className="form-col">
                          <label><FiFlag className="label-icon" /> State</label>
                          <input className="form-control" list="states-list" value={placeForm.state} onChange={e => setPlaceForm({ ...placeForm, state: e.target.value })} placeholder="Delhi" required />
                          <datalist id="states-list">
                            {autocompleteData.states.map(s => <option key={s} value={s} />)}
                          </datalist>
                        </div>
                      </div>

                      <div className="form-group">
                        <label><FiTag className="label-icon" /> Category</label>
                        <input className="form-control" list="categories-list" value={placeForm.type || ''} onChange={e => setPlaceForm({ ...placeForm, type: e.target.value })} placeholder="Cultural and heritage sites" required />
                        <datalist id="categories-list">
                          <option value="Cultural and heritage sites" />
                          <option value="Nature and wildlife" />
                          <option value="Religious sites" />
                          <option value="Parks and gardens" />
                          <option value="Museum" />
                          <option value="Entertainment" />
                        </datalist>
                      </div>

                      <div className="form-group rating-group">
                        <label><FiStar className="label-icon" /> Rating</label>
                        <div className="rating-input-wrapper">
                          <div className="stars">
                            <FiStar className="star-icon filled" />
                            <FiStar className="star-icon filled" />
                            <FiStar className="star-icon filled" />
                            <FiStar className="star-icon filled" />
                            <FiStar className="star-icon half" />
                          </div>
                          <input type="number" step="0.1" max="5" min="0" className="form-control rating-input" value={placeForm.rating || ''} onChange={e => setPlaceForm({ ...placeForm, rating: e.target.value })} placeholder="4.5" />
                        </div>
                      </div>

                      <div className="form-group">
                        <label><FiFileText className="label-icon" /> Description</label>
                        <textarea className="form-control" rows="3" value={placeForm.teaser || ''} onChange={e => setPlaceForm({ ...placeForm, teaser: e.target.value })} placeholder="A war memorial and one of Delhi's most visited landmarks."></textarea>
                      </div>

                      <div className="form-group">
                        <label>Images (Max 5)</label>
                        <input type="file" multiple accept="image/*" className="form-control" onChange={(e) => {
                          const selected = Array.from(e.target.files);
                          if (selected.length > 5) alert("Maximum 5 images allowed for Places.");
                          setFiles(selected.slice(0, 5));
                        }} />
                      </div>

                      <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={() => setShowPlaceModal(false)}>Cancel</button>
                        <button type="submit" className="btn-save">Save place</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* City Modal */}
              {showCityModal && (
                <div className="light-modal-overlay">
                  <div className="light-modal-card">
                    <div className="light-modal-header">
                      <div className="header-icon-container">
                        <FiMap className="header-icon" />
                      </div>
                      <h3>{editingCity ? 'Edit city' : 'Add new city'}</h3>
                      <button type="button" className="close-btn" onClick={() => setShowCityModal(false)}><FiX /></button>
                    </div>

                    <form onSubmit={handleCitySave} className="light-modal-form">
                      <div className="form-row">
                        <div className="form-col">
                          <label><FiMap className="label-icon" /> City name</label>
                          <input className="form-control" list="city-names-list" value={cityForm.name} onChange={e => setCityForm({ ...cityForm, name: e.target.value })} placeholder="Delhi" required />
                          <datalist id="city-names-list">
                            {[...new Set(cities.map(c => c.name))].map((name, i) => <option key={i} value={name} />)}
                          </datalist>
                        </div>
                        <div className="form-col">
                          <label><FiFlag className="label-icon" /> State</label>
                          <input className="form-control" list="states-list" value={cityForm.state} onChange={e => setCityForm({ ...cityForm, state: e.target.value })} placeholder="Delhi" required />
                          <datalist id="states-list">
                            {autocompleteData.states.map(s => <option key={s} value={s} />)}
                          </datalist>
                        </div>
                      </div>

                      <div className="form-group">
                        <label><FiTag className="label-icon" /> Type / Categories</label>
                        <input type="text" className="form-control" list="city-types-list" value={cityForm.type || ''} onChange={e => setCityForm({ ...cityForm, type: e.target.value })} placeholder="Metropolis, Historical" />
                        <datalist id="city-types-list">
                          <option value="Metropolis" />
                          <option value="Historical" />
                          <option value="Cultural" />
                          <option value="Hill Station" />
                          <option value="Coastal" />
                          <option value="Nature and wildlife" />
                          <option value="Religious" />
                        </datalist>
                      </div>

                      <div className="form-group">
                        <label>Images (Max 2) <small className="text-muted" style={{ marginLeft: 'auto' }}>Leave empty to keep existing images.</small></label>
                        <input type="file" multiple accept="image/*" className="form-control" onChange={(e) => {
                          const selected = Array.from(e.target.files);
                          if (selected.length > 2) alert("Maximum 2 images allowed for Cities.");
                          setFiles(selected.slice(0, 2));
                        }} />
                      </div>

                      <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={() => setShowCityModal(false)}>Cancel</button>
                        <button type="submit" className="btn-save">Save city</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: EMAIL LOGS */}
          {activeTab === 'emails' && (
            <div className="glass-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Email Delivery Logs</h2>
                <span className="text-muted">Last 100 emails</span>
              </div>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Recipient</th>
                      <th>Subject</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailLogs.length === 0 && (
                      <tr><td colSpan="5" className="text-center text-muted">No emails logged yet.</td></tr>
                    )}
                    {emailLogs.map(log => (
                      <tr key={log._id}>
                        <td>
                          <span className={`badge ${log.status}`}>
                            {log.status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${log.type}`}>
                            {log.type}
                          </span>
                        </td>
                        <td>{log.recipient}</td>
                        <td className="text-muted">{log.subject}</td>
                        <td className="text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
