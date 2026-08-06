import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Autocomplete from '../components/common/Autocomplete';
import './Tools.css';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TRAVEL_STYLES = ['Solo', 'Family', 'Friends', 'Couple', 'Business'];
const ACTIVITIES = [
  { id: 'sightseeing', label: '🏛️ Sightseeing' },
  { id: 'trekking', label: '🥾 Trekking' },
  { id: 'beach', label: '🏖️ Beach' },
  { id: 'temple', label: '🛕 Temple Visit' },
  { id: 'adventure', label: '🧗 Adventure Sports' },
  { id: 'shopping', label: '🛍️ Shopping' }
];

const WEATHER_TYPES = [
  { id: 'pleasant', label: '🌤️ Pleasant / Moderate' },
  { id: 'hot', label: '☀️ Hot & Sunny' },
  { id: 'rainy', label: '🌧️ Monsoon / Rainy' },
  { id: 'cold', label: '❄️ Cold / Snow' }
];

// Generates dynamic packing items based on rules
const generatePackingList = ({ city, month, duration, weather, style, activities }) => {
  const categories = {
    essentials: {
      title: '📄 Travel Essentials',
      items: [
        'Government ID / Passport / Driving License',
        'Flight / Train / Hotel Booking Tickets',
        'Wallet with Cash, Credit & Debit Cards',
        'Smartphone & Fast Charger',
        'Power Bank (10,000mAh+)',
        'Emergency Contact Card'
      ]
    },
    clothing: {
      title: '👕 Clothing',
      items: [
        `${Math.min(duration + 1, 8)}x Comfort T-Shirts / Tops`,
        `${Math.min(Math.ceil(duration / 2), 4)}x Jeans / Trousers / Shorts`,
        `${duration + 2}x Undergarments & Socks`,
        'Nightwear / Pyjamas'
      ]
    },
    footwear: {
      title: '👟 Footwear',
      items: [
        'Comfortable Walking Shoes / Sneakers'
      ]
    },
    toiletries: {
      title: '🧴 Toiletries',
      items: [
        'Toothbrush & Travel Toothpaste',
        'Shampoo & Body Wash',
        'Face Wash & Moisturizer',
        'Deodorant / Perfume',
        'Hair Brush / Comb'
      ]
    },
    health: {
      title: '💊 Health & Hygiene',
      items: [
        'Personal Prescription Medicines',
        'First Aid Kit (Band-aids, Painkillers, Antacids)',
        'Hand Sanitizer & Pocket Tissues',
        'ORSL / Electrolyte Hydration Packets'
      ]
    },
    accessories: {
      title: '🎒 Accessories & Electronics',
      items: [
        'Daypack Backpack',
        'Reusable Water Bottle',
        'Earphones / Headphones',
        'Sunglasses'
      ]
    }
  };

  // Weather-based rules
  if (weather === 'rainy') {
    categories.clothing.items.push('Quick-dry Polyester Shirts', 'Lightweight Raincoat / Poncho');
    categories.footwear.items.push('Waterproof Sandals / Crocs');
    categories.accessories.items.push('Sturdy Umbrella', 'Waterproof Phone Case / Dry Bag');
    categories.health.items.push('Anti-Mosquito Spray / Odomos');
  } else if (weather === 'cold') {
    categories.clothing.items.push('Heavy Thermal Innerwear Sets', 'Puffer Jacket / Fleece Sweater', 'Woolen Socks', 'Beanie Cap & Muffler');
    categories.toiletries.items.push('Lip Balm / Vaseline', 'Cold Cream / Body Lotion');
  } else if (weather === 'hot') {
    categories.clothing.items.push('Breathable Cotton Tops', 'Wide-brim Sun Hat / Cap');
    categories.toiletries.items.push('Sunscreen Lotion (SPF 50+)');
    categories.footwear.items.push('Open Slip-on Sandals');
  }

  // Activity-based rules
  if (activities.includes('beach')) {
    categories.clothing.items.push('Swimwear / Beach Shorts', 'Light Cover-up Towel');
    categories.footwear.items.push('Flip-flops / Beach Slides');
    categories.accessories.items.push('Beach Mat / Waterproof Pouch', 'High-SPF Waterproof Sunscreen');
  }

  if (activities.includes('trekking')) {
    categories.footwear.items.push('High-traction Hiking Boots');
    categories.accessories.items.push('Trekking Poles', 'LED Torch / Headlamp', 'Energy Bars & Trail Mix');
    categories.health.items.push('Crepe Bandage & Pain Relief Spray');
  }

  if (activities.includes('temple')) {
    categories.clothing.items.push('Modest Attire (Shoulder & Knee Covered Kurta/Saree/Pants)');
    categories.accessories.items.push('Small Cotton Handcloth / Handkerchief');
  }

  if (activities.includes('adventure')) {
    categories.clothing.items.push('Stretchy Activewear');
    categories.accessories.items.push('Action Camera / GoPro', 'Extra Socks');
  }

  if (activities.includes('shopping')) {
    categories.accessories.items.push('Foldable Shopping Tote Bag', 'Extra Cash');
  }

  // Travel Style rules
  if (style === 'Family') {
    categories.essentials.items.push('Family Member ID Copies');
    categories.health.items.push('Pediatric Medicines & Extra Wipes');
    categories.accessories.items.push('Snack Box for Travel');
  } else if (style === 'Business') {
    categories.clothing.items.push('Formal Suit / Blazer', 'Ironed Dress Shirts');
    categories.accessories.items.push('Laptop & Charger', 'Business Cards & Pen', 'Portable Garment Steamer');
  }

  return categories;
};

const PackingAssistant = () => {
  const location = useLocation();
  
  // Input State
  const [city, setCity] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [duration, setDuration] = useState(3);
  const [weather, setWeather] = useState('pleasant');
  const [style, setStyle] = useState('Solo');
  const [selectedActivities, setSelectedActivities] = useState(['sightseeing']);

  // Checked items state
  const [checkedItems, setCheckedItems] = useState({});
  const [packingData, setPackingData] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Auto-prefill if coming from Itinerary / Trip Planner
  useEffect(() => {
    if (location.state) {
      const { city: stateCity, days, month: stateMonth, weather: stateWeather, vibes } = location.state;
      if (stateCity) setCity(stateCity);
      if (days) setDuration(days);
      if (stateMonth) setMonth(stateMonth);
      if (stateWeather) {
        const wLower = stateWeather.toLowerCase();
        if (wLower.includes('rain') || wLower.includes('monsoon')) setWeather('rainy');
        else if (wLower.includes('cold') || wLower.includes('snow') || wLower.includes('chill')) setWeather('cold');
        else if (wLower.includes('hot') || wLower.includes('sun')) setWeather('hot');
        else setWeather('pleasant');
      }
      if (vibes && Array.isArray(vibes)) {
        const matched = [];
        if (vibes.some(v => v.toLowerCase().includes('beach'))) matched.push('beach');
        if (vibes.some(v => v.toLowerCase().includes('trek') || v.toLowerCase().includes('nature'))) matched.push('trekking');
        if (vibes.some(v => v.toLowerCase().includes('temple') || v.toLowerCase().includes('spiritual'))) matched.push('temple');
        if (vibes.some(v => v.toLowerCase().includes('adventure'))) matched.push('adventure');
        if (matched.length > 0) setSelectedActivities(matched);
      }
    } else {
      // Try restoring saved list from localStorage
      const saved = localStorage.getItem('travelio_saved_packing');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.city) setCity(parsed.city);
          if (parsed.data) setPackingData(parsed.data);
          if (parsed.checked) setCheckedItems(parsed.checked);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [location.state]);

  const toggleActivity = (id) => {
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // Reset packing list when any input changes
  useEffect(() => {
    if (packingData) {
      setPackingData(null);
      setCheckedItems({});
      setSavedSuccess(false);
    }
  }, [city, month, duration, weather, style, selectedActivities]);

  const handleGenerate = (e) => {
    if (e) e.preventDefault();
    const data = generatePackingList({
      city: city || 'Your Destination',
      month,
      duration,
      weather,
      style,
      activities: selectedActivities
    });
    setPackingData(data);
    setCheckedItems({});
    setSavedSuccess(false);
  };

  const handleToggleCheck = (catKey, index) => {
    const key = `${catKey}_${index}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Calculate statistics
  let totalItems = 0;
  let packedItems = 0;

  if (packingData) {
    Object.keys(packingData).forEach(catKey => {
      packingData[catKey].items.forEach((_, idx) => {
        totalItems++;
        if (checkedItems[`${catKey}_${idx}`]) {
          packedItems++;
        }
      });
    });
  }

  const packedPercent = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    if (!packingData) return;
    let content = `TravelIO AI Packing Checklist\nDestination: ${city || 'Trip'} | Duration: ${duration} Days | Style: ${style}\nProgress: ${packedItems}/${totalItems} Packed (${packedPercent}%)\n\n`;

    Object.keys(packingData).forEach(catKey => {
      const cat = packingData[catKey];
      content += `=== ${cat.title} ===\n`;
      cat.items.forEach((item, idx) => {
        const isPacked = checkedItems[`${catKey}_${idx}`] ? '[x]' : '[ ]';
        content += `${isPacked} ${item}\n`;
      });
      content += '\n';
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Packing_Checklist_${(city || 'Trip').replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToDashboard = () => {
    if (!packingData) return;
    const saveObj = {
      city: city || 'Trip',
      duration,
      style,
      data: packingData,
      checked: checkedItems,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('travelio_saved_packing', JSON.stringify(saveObj));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="page-container container tool-page">
      <div className="tool-header text-center">
        <h1 className="gradient-text">AI Packing Assistant</h1>
        <p className="text-muted">Smart, weather-aware packing lists tailored to your trip destination and style.</p>
      </div>

      <div className="tool-content mt-4">
        {/* LEFT PANEL — CONTROLS */}
        <div className="glass-card tool-form-card" style={{ height: 'fit-content' }}>
          <h3 className="mb-4" style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>🧳 Trip Details</h3>

          <form onSubmit={handleGenerate}>
            <div className="form-group mb-3">
              <label>Destination City</label>
              <Autocomplete
                placeholder="e.g. Manali, Goa, Mumbai"
                initialValue={city}
                onSelect={(res) => {
                  const cityName = res.is_city ? res.name : (res.city || res.name);
                  setCity(cityName);
                }}
              />
            </div>

            <div className="row">
              <div className="col-md-6 form-group mb-3">
                <label>Travel Month</label>
                <select className="input-field" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 form-group mb-3">
                <label>Duration (Days)</label>
                <input
                  type="number"
                  className="input-field"
                  min="1"
                  max="45"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                  required
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <label>Expected Weather</label>
              <select className="input-field" value={weather} onChange={(e) => setWeather(e.target.value)}>
                {WEATHER_TYPES.map(w => (
                  <option key={w.id} value={w.id}>{w.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group mb-3">
              <label className="d-block mb-2">Travel Style</label>
              <div className="d-flex flex-wrap gap-2">
                {TRAVEL_STYLES.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`btn btn-sm ${style === s ? 'btn-primary' : 'btn-outline-primary'}`}
                    style={{ borderRadius: '20px', padding: '4px 14px', fontSize: '0.85rem' }}
                    onClick={() => setStyle(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group mb-4">
              <label className="d-block mb-2">Planned Activities</label>
              <div className="d-flex flex-wrap gap-2">
                {ACTIVITIES.map(act => {
                  const isSelected = selectedActivities.includes(act.id);
                  return (
                    <button
                      key={act.id}
                      type="button"
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                      style={{ borderRadius: '20px', padding: '4px 12px', fontSize: '0.85rem' }}
                      onClick={() => toggleActivity(act.id)}
                    >
                      {act.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn-primary w-100 py-2">
              ✨ Generate Packing Checklist
            </button>
          </form>
        </div>

        {/* RIGHT PANEL — CHECKLIST */}
        <div>
          {!packingData ? (
            <div className="glass-card tool-result-card text-center p-5 d-flex flex-column align-items-center justify-content-center">
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.8 }}>🎒</div>
              <h3 className="mb-2">Your Smart Checklist Awaits</h3>
              <p className="text-muted" style={{ maxWidth: '400px' }}>
                Fill in your trip details on the left and click <strong>Generate Packing Checklist</strong> to build your customized packing guide.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass-card p-4 p-md-4"
              style={{ borderRadius: '16px' }}
            >
              {/* Header & Stats */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center border-bottom pb-3 mb-4">
                <div>
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }}>
                    {city ? `${city} Trip` : 'Travel'} Packing List
                  </h2>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {duration} Days · {style} · {WEATHER_TYPES.find(w => w.id === weather)?.label}
                  </span>
                </div>
                  <div className="d-flex gap-2 align-items-center">
                    <button className="btn btn-sm btn-outline-primary" onClick={handlePrint} title="Print Checklist" style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span role="img" aria-label="Print">🖨️</span> Print
                    </button>
                    <button className="btn btn-sm btn-outline-success" onClick={handleDownloadTxt} title="Download Text" style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span role="img" aria-label="Download">⬇️</span> Download
                    </button>
                  </div>
              </div>

              {savedSuccess && (
                <div className="alert alert-success py-2 px-3 mb-3 text-center" style={{ fontSize: '0.9rem', borderRadius: '8px' }}>
                  ✅ Packing list saved successfully!
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-4 p-3 glass-card" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Packing Progress</span>
                  <span style={{ fontWeight: 700, color: packedPercent === 100 ? '#10b981' : 'var(--primary)' }}>
                    {packedItems} / {totalItems} Packed ({packedPercent}%)
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${packedPercent}%` }}
                    transition={{ duration: 0.5 }}
                    style={{ height: '100%', background: packedPercent === 100 ? '#10b981' : 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {/* Category Accordion / List */}
              <div className="packing-categories-list">
                {Object.keys(packingData).map(catKey => {
                  const cat = packingData[catKey];
                  if (!cat.items || cat.items.length === 0) return null;

                  return (
                    <div key={catKey} className="category-section mb-4">
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '0.75rem', fontWeight: 600 }}>
                        {cat.title}
                      </h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {cat.items.map((item, idx) => {
                          const itemKey = `${catKey}_${idx}`;
                          const isChecked = !!checkedItems[itemKey];

                          return (
                            <li
                              key={itemKey}
                              onClick={() => handleToggleCheck(catKey, idx)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                marginBottom: '4px',
                                cursor: 'pointer',
                                background: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                                transition: 'all 0.2s ease',
                                textDecoration: isChecked ? 'line-through' : 'none',
                                opacity: isChecked ? 0.7 : 1
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                style={{ width: '1.1rem', height: '1.1rem', accentColor: '#10b981', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '0.95rem', color: isChecked ? 'var(--text-muted)' : 'var(--text-main)' }}>
                                {item}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackingAssistant;
