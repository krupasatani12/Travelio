import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import './LandmarkDetector.css';

// Animated loading step list
const ANALYSIS_STEPS = [
  'Uploading image to Gemini Vision...',
  'Detecting visual features...',
  'Matching landmark database...',
  'Extracting location data...',
  'Generating description...',
];

const LandmarkDetector = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  const stepTimer = useRef(null);

  // Cycle through loading steps while analyzing
  useEffect(() => {
    if (loading) {
      setActiveStep(0);
      let idx = 0;
      stepTimer.current = setInterval(() => {
        idx = (idx + 1) % ANALYSIS_STEPS.length;
        setActiveStep(idx);
      }, 1100);
    } else {
      clearInterval(stepTimer.current);
    }
    return () => clearInterval(stepTimer.current);
  }, [loading]);

  const handleFileChange = (selected) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
  };

  const handleInputChange = (e) => handleFileChange(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('image/')) handleFileChange(dropped);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const clearImage = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDetect = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/landmark/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to connect to the server.';
      setResult({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const mapsUrl = result?.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.location)}`
    : null;

  const confidence = result?.confidence ?? 0;
  const confidenceColor =
    confidence >= 75 ? '#10b981' : confidence >= 45 ? '#f59e0b' : '#ef4444';

  return (
    <div className="page-container container landmark-page">
      {/* ── Header ─────────────────────────────── */}
      <div className="landmark-page-header">
        <h1 className="gradient-text">AI Landmark Scanner</h1>
        <p>Upload a photo of any Indian monument — Gemini Vision will identify it instantly.</p>
      </div>

      {/* ── Two-column grid ─────────────────────── */}
      <div className="landmark-grid">

        {/* ═══ LEFT — Upload Card ═══════════════ */}
        <div className="glass-card lm-card">
          <p className="lm-card-title">📸 Upload Image</p>

          {/* Drag & Drop zone / preview */}
          <div
            className={`lm-dropzone${dragging ? ' dragging' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {preview ? (
              <div className="lm-preview-wrapper" onClick={(e) => e.stopPropagation()}>
                <img src={preview} alt="Selected landmark" className="lm-preview-img" />
                <button className="lm-clear-btn" onClick={clearImage} title="Remove image">✕</button>
              </div>
            ) : (
              <>
                <span className="lm-dropzone-icon">🏛️</span>
                <p className="lm-dropzone-text">Drag & drop an image here</p>
                <p className="lm-dropzone-hint">or click to browse files</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              style={{ display: 'none' }}
              id="landmark-img"
            />
          </div>

          {/* Scan button */}
          <button
            className="btn-scan"
            onClick={handleDetect}
            disabled={loading || !file}
          >
            {loading ? (
              <>
                <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                Analyzing…
              </>
            ) : (
              <>✨ Scan Landmark</>
            )}
          </button>
        </div>

        {/* ═══ RIGHT — Result Card ══════════════ */}
        <div className="glass-card lm-card">
          <p className="lm-card-title">🤖 AI Analysis Result</p>

          {/* Empty state */}
          {!result && !loading && (
            <div className="lm-empty">
              <span className="lm-empty-icon">🔍</span>
              <p>Upload a landmark image and click <strong>Scan Landmark</strong> to get AI analysis.</p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="lm-loading">
              <div className="lm-spinner" />
              <p className="lm-loading-title">Analyzing with Gemini Vision…</p>
              <ul className="lm-loading-steps">
                {ANALYSIS_STEPS.map((step, i) => (
                  <li key={i} className={i === activeStep ? 'active-step' : ''}>
                    <span className="step-dot" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Error state */}
          {result && result.error && !loading && (
            <div className="lm-result">
              <div className="lm-result-badge">⚠️ Gemini Vision Error</div>
              <div className="lm-error">
                <strong>Could not process image:</strong>
                <br />
                {result.error}
              </div>
            </div>
          )}

          {/* Success state */}
          {result && !result.error && !loading && (
            <div className="lm-result">
              <div className="lm-result-badge">✅ Gemini Vision · Identified</div>

              <h2 className="lm-landmark-name">{result.landmark_name || 'Unknown Landmark'}</h2>

              <p className="lm-landmark-location">
                📍 {result.location || 'Location unavailable'}
              </p>

              {/* Confidence meter */}
              <div className="lm-confidence">
                <div className="lm-confidence-header">
                  <span className="lm-confidence-label">AI Confidence Score</span>
                  <span className="lm-confidence-value" style={{ color: confidenceColor }}>
                    {confidence}%
                  </span>
                </div>
                <div className="lm-bar-bg">
                  <div
                    className="lm-bar-fill"
                    style={{ width: `${confidence}%`, background: `linear-gradient(90deg, #6366f1, ${confidenceColor})` }}
                  />
                </div>
              </div>

              {/* Description */}
              {result.description && (
                <div className="lm-info-block">
                  <h4>Description</h4>
                  <p>{result.description}</p>
                </div>
              )}

              {/* Best time to visit (if returned by API) */}
              {result.best_time && (
                <div className="lm-info-block">
                  <h4>Best Time to Visit</h4>
                  <p>{result.best_time}</p>
                </div>
              )}

              {/* Google Maps button */}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lm-btn-maps"
                >
                  🗺️ Open in Google Maps
                </a>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default LandmarkDetector;
