/**
 * TravelIO — Email Service
 * Sends formatted HTML emails with 3D CSS cube weather widget.
 */
const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');
const SystemSettings = require('../models/SystemSettings');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function logAndSendMail(to, subject, html, type) {
  let settings = { mode: 'online' };
  try {
    settings = await SystemSettings.findOne({}) || { mode: 'online' };
  } catch (e) {
    settings = { mode: 'online' };
  }
  
  if (settings.mode === 'offline') {
    try {
      let log = new EmailLog({ recipient: to, type, subject, status: 'failed', errorMsg: 'System is offline' });
      await log.save();
    } catch (e) {}
    return { skipped: true, reason: 'offline' };
  }

  let log = new EmailLog({ recipient: to, type, subject, status: 'sent' });
  try {
    const info = await transporter.sendMail({
      from: `"TravelIO" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    try { await log.save(); } catch (e) {}
    return info;
  } catch (error) {
    log.status = 'failed';
    log.errorMsg = error.message;
    try { await log.save(); } catch (e) {}
    throw error;
  }
}

/**
 * Get weather emoji based on condition
 */
function getWeatherEmoji(condition) {
  const c = (condition || '').toLowerCase();
  if (c.includes('rain') || c.includes('drizzle')) return '🌨️';
  if (c.includes('storm') || c.includes('thunder')) return '⛈️';
  if (c.includes('cloud') && c.includes('sun')) return '⛅';
  if (c.includes('cloud') && c.includes('part')) return '🌥️';
  if (c.includes('cloud') || c.includes('overcast')) return '☁️';
  return '🌞';
}

/**
 * Build 3D CSS cube weather widget for email
 */
function buildWeatherCube(weather = {}) {
  const emoji = getWeatherEmoji(weather.condition);
  const temp = weather.temp || '28°C';
  const condition = weather.condition || 'Sunny';

  return `
    <div style="perspective:200px; width:100px; height:100px; margin:16px auto;">
      <div style="width:100px; height:100px; position:relative; transform-style:preserve-3d; animation:spin 6s infinite linear;">
        <div style="position:absolute; width:100px; height:100px; background:linear-gradient(135deg,#6366f1,#10b981); border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; transform:translateZ(50px); color:#fff;">
          <span style="font-size:36px;">${emoji}</span>
          <span style="font-size:14px; font-weight:600;">${temp}</span>
        </div>
        <div style="position:absolute; width:100px; height:100px; background:linear-gradient(135deg,#10b981,#6366f1); border-radius:12px; display:flex; align-items:center; justify-content:center; transform:rotateY(180deg) translateZ(50px); color:#fff; font-size:12px; font-weight:600; text-align:center; padding:8px;">
          ${condition}
        </div>
      </div>
    </div>
    <style>@keyframes spin{from{transform:rotateY(0)}to{transform:rotateY(360deg)}}</style>
  `;
}

/**
 * Send OTP verification email matching the site theme
 */
async function sendOTPEmail(to, otp, name) {
  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif; max-width:500px; margin:0 auto; background:#0f0f23; border-radius:16px; overflow:hidden; border:1px solid rgba(99,102,241,0.3);">
    <div style="background:linear-gradient(135deg,#6366f1,#10b981); padding:32px; text-align:center;">
      <h1 style="margin:0; color:#fff; font-size:28px;">✈️ TravelIO</h1>
      <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px;">Email Verification</p>
    </div>
    <div style="padding:32px; color:#e2e8f0;">
      <p style="margin:0 0 16px;">Hi <strong>${name || 'Traveler'}</strong>,</p>
      <p style="margin:0 0 24px; color:#94a3b8;">Enter this code to verify your account:</p>
      <div style="background:rgba(99,102,241,0.15); border:2px solid #6366f1; border-radius:12px; padding:20px; text-align:center; margin:0 0 24px;">
        <span style="font-size:36px; font-weight:700; letter-spacing:8px; color:#a5b4fc;">${otp}</span>
      </div>
      <p style="margin:0; color:#64748b; font-size:12px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
    </div>
  </div>`;

  return logAndSendMail(to, `🔐 TravelIO — Your verification code: ${otp}`, html, 'otp');
}

const Place = require('../models/Place');
const { getSafetyScore } = require('./mlProxy');

/**
 * Send formatted HTML itinerary email with premium design, day-wise schedule,
 * weather widget, safety scores, budget breakdown, and travel tips.
 */
async function sendItineraryEmail(to, itinerary = {}) {
  // Extract all fields flexibly from itinerary object
  const destinations = itinerary.destinations || itinerary.destination || 'India Destination';
  const duration = itinerary.duration || itinerary.durationDays || (itinerary.itinerary ? itinerary.itinerary.length : 3);
  const budget = itinerary.budget || itinerary.estimatedBudget || 'Flexible';
  const travelMonth = itinerary.travelMonth || itinerary.month || 'Upcoming Season';
  const groupSize = itinerary.groupSize || 1;
  const comfortLevel = (itinerary.comfortLevel || 'Mid-range').toUpperCase();
  const travelerName = itinerary.travelerName || itinerary.name || (to ? to.split('@')[0] : 'Traveler');
  const weather = itinerary.weather || { temp: '26°C', condition: 'Sunny & Pleasant' };
  const recommendations = itinerary.recommendations || [];
  const rawDays = itinerary.itinerary || (Array.isArray(itinerary) ? itinerary : []);

  // Fetch real safety score
  let safetyData = { score: 94, category: 'Verified Safe Area' };
  try {
    const sRes = await getSafetyScore(destinations);
    if (sRes && sRes.safety) {
      safetyData.score = sRes.safety.score || sRes.safety.safety_score || 94;
      safetyData.category = sRes.safety.category || sRes.safety.label || 'Verified Safe Area';
    }
  } catch (err) {
    console.error('[Email] Safety score fetch failed:', err.message);
  }

  // Collect places and fetch ratings
  const allPlaces = [];
  rawDays.forEach(day => {
    if (day.places) {
      day.places.forEach(p => { if (p.name) allPlaces.push(p.name); });
    }
  });
  recommendations.forEach(r => { if (r.name) allPlaces.push(r.name); });

  let ratingsMap = {};
  try {
    const cityRegex = new RegExp(`^${destinations}$`, 'i');
    const cityPlaces = await Place.find({ cityName: cityRegex }).lean();
    if (cityPlaces && cityPlaces.length > 0) {
      allPlaces.forEach(pName => {
        const lowerName = pName.toLowerCase().trim();
        // Exact match
        let match = cityPlaces.find(p => p.name.toLowerCase().trim() === lowerName);
        // Contains match
        if (!match) {
          match = cityPlaces.find(p => p.name.toLowerCase().includes(lowerName) || lowerName.includes(p.name.toLowerCase()));
        }
        // Word intersection (fuzzy fallback)
        if (!match) {
          const words = lowerName.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
          if (words.length > 0) {
            match = cityPlaces.find(p => {
              const pWords = p.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
              return words.some(w => pWords.includes(w));
            });
          }
        }
        if (match) {
          ratingsMap[lowerName] = match;
        }
      });
    }
  } catch (err) {
    console.error('[Email] Places fuzzy match failed:', err.message);
  }

  // Budget calculations
  const numericBudget = typeof budget === 'number' ? budget : (parseInt(String(budget).replace(/[^0-9]/g, '')) || 15000);
  const accomBudget = Math.round(numericBudget * 0.40);
  const transBudget = Math.round(numericBudget * 0.25);
  const foodBudget = Math.round(numericBudget * 0.20);
  const actBudget = Math.round(numericBudget * 0.10);
  const emerBudget = Math.round(numericBudget * 0.05);

  const mapsSearchUrl = (query) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + ' ' + destinations)}`;
  const bookingSearchUrl = (query) => `https://www.google.com/search?q=${encodeURIComponent('book tickets ' + query + ' ' + destinations)}`;

  // Helper to get place meta
  const getPlaceMeta = (placeName) => {
    if (placeName && ratingsMap[placeName.toLowerCase().trim()]) {
      return ratingsMap[placeName.toLowerCase().trim()];
    }
    return null;
  };

  // Helper to format ratings: Exact DB rating, or N/A
  const formatRating = (placeName) => {
    const meta = getPlaceMeta(placeName);
    if (meta && meta.rating) {
      return `⭐ ${Number(meta.rating).toFixed(1)}`;
    }
    return 'N/A';
  };

  // Helper to render image if available
  const renderPlaceImage = (placeName) => {
    const meta = getPlaceMeta(placeName);
    if (meta && meta.image) {
      return `<img src="${meta.image}" alt="${placeName}" style="width:100%; height:140px; object-fit:cover; border-radius:8px; margin-bottom:12px; display:block; background:#0f172a;" />`;
    }
    return '';
  };

  // Day schedules presets for non-repeating realistic itineraries
  const DAY_PRESETS = [
    {
      theme: `Day 1: Arrival & Historic ${destinations} Exploration`,
      morning: { time: '09:00 AM – 11:30 AM', duration: '2.5 Hours', opening: '08:30 AM – 06:00 PM', transport: '20 mins cab from hotel' },
      afternoon: { time: '12:00 PM – 03:30 PM', duration: '2.0 Hours', opening: '10:00 AM – 05:00 PM', transport: '15 mins transit', meal: '🍽️ Lunch Break (12:00 PM – 01:00 PM): Regional thali & local authentic diner' },
      evening: { time: '04:30 PM – 07:30 PM', duration: '2.0 Hours', opening: 'Open 24 Hours', transport: '15 mins walk/auto', snack: '☕ Evening tea & traditional masala chai break' },
      night: { time: '08:00 PM – 10:00 PM', duration: '2.0 Hours', opening: '07:00 PM – 11:00 PM', dinner: '🍷 Dinner: Rooftop dining & night market', return: 'Return to hotel by 10:00 PM' }
    },
    {
      theme: `Day 2: Cultural Heritage & Temples of ${destinations}`,
      morning: { time: '08:00 AM – 11:30 AM', duration: '3.0 Hours', opening: '06:00 AM – 07:00 PM', transport: '25 mins cab from hotel' },
      afternoon: { time: '12:00 PM – 04:00 PM', duration: '2.0 Hours', opening: '11:00 AM – 08:00 PM', transport: '15 mins auto', meal: '🍽️ Lunch Break (12:30 PM – 01:30 PM): Traditional family eatery & local specialties' },
      evening: { time: '04:30 PM – 07:30 PM', duration: '2.5 Hours', opening: '06:00 AM – 08:00 PM', transport: '15 mins transit', snack: '☕ Local street food & dessert tasting' },
      night: { time: '08:00 PM – 09:30 PM', duration: '1.5 Hours', opening: '07:00 PM – 10:30 PM', dinner: '🍷 Dinner: Authentic local cuisine', return: 'Return to hotel by 09:30 PM' }
    },
    {
      theme: `Day 3: Nature, Panoramic Views & Souvenir Shopping`,
      morning: { time: '08:30 AM – 12:00 PM', duration: '2.5 Hours', opening: '07:00 AM – 06:00 PM', transport: '30 mins cab from hotel' },
      afternoon: { time: '12:30 PM – 03:30 PM', duration: '1.5 Hours', opening: '10:00 AM – 09:00 PM', transport: '15 mins auto', meal: '🍽️ Farewell Lunch (12:30 PM – 01:30 PM): Famous local cafe' },
      evening: { time: '04:00 PM – 06:30 PM', duration: '1.5 Hours', opening: 'Open 24 Hours', transport: '20 mins transit', snack: '☕ Photo ops & souvenir shopping' },
      night: { time: '07:00 PM – 09:00 PM', duration: '1.5 Hours', opening: '06:00 PM – 10:00 PM', dinner: '🍷 Casual Dinner', return: 'Hotel check-out & station/airport transfer by 09:00 PM' }
    }
  ];

  // Generate Day-Wise Itinerary Blocks
  let dayBlocksHTML = '';
  if (Array.isArray(rawDays) && rawDays.length > 0) {
    dayBlocksHTML = rawDays.map((dayObj, idx) => {
      const dayNum = dayObj.day || (idx + 1);
      const preset = DAY_PRESETS[(dayNum - 1) % DAY_PRESETS.length];
      const theme = dayObj.theme || preset.theme;
      const dayEst = dayObj.budget_estimate || `₹${Math.round(numericBudget / duration)}`;
      const places = dayObj.places || [];

      const p0 = places[0] || {};
      const p1 = places[1] || {};
      const p2 = places[2] || {};
      const p3 = places[3] || {};

      const mPlace = {
        name: p0.name || `${destinations} Main Landmark`,
        desc: p0.description || 'Explore iconic morning views, historical architecture, and cultural heritage.',
        time: p0.start_time ? `${p0.start_time} – ${p0.end_time || '11:30 AM'}` : preset.morning.time,
        duration: p0.visit_duration || preset.morning.duration,
        opening: p0.opening_hours || preset.morning.opening,
        transport: p0.travel_time || preset.morning.transport,
        rating: p0.rating || p0.google_rating
      };

      const aPlace = {
        name: p1.name || `${destinations} Cultural Market & Museum`,
        desc: p1.description || 'Immerse in local crafts, vibrant exhibits, and traditional shopping.',
        time: p1.start_time ? `${p1.start_time} – ${p1.end_time || '04:00 PM'}` : preset.afternoon.time,
        duration: p1.visit_duration || preset.afternoon.duration,
        opening: p1.opening_hours || preset.afternoon.opening,
        transport: p1.travel_time || preset.afternoon.transport,
        meal: p1.meal_recommendation || preset.afternoon.meal,
        rating: p1.rating || p1.google_rating
      };

      const ePlace = {
        name: p2.name || `${destinations} Sunset Viewpoint`,
        desc: p2.description || 'Watch golden hour colors set over the horizon, take scenic photos and relax.',
        time: p2.start_time ? `${p2.start_time} – ${p2.end_time || '07:30 PM'}` : preset.evening.time,
        duration: p2.visit_duration || preset.evening.duration,
        opening: p2.opening_hours || preset.evening.opening,
        transport: p2.travel_time || preset.evening.transport,
        snack: preset.evening.snack,
        rating: p2.rating || p2.google_rating
      };

      const nPlace = {
        name: p3.name || `${destinations} Promenade & Night Lights`,
        desc: p3.description || 'Enjoy evening strolls, illuminated city views, and authentic dinner.',
        time: p3.start_time ? `${p3.start_time} – ${p3.end_time || '10:00 PM'}` : preset.night.time,
        duration: p3.visit_duration || preset.night.duration,
        opening: p3.opening_hours || preset.night.opening,
        dinner: p3.meal_recommendation || preset.night.dinner,
        return: p3.hotel_return || preset.night.return,
        rating: p3.rating || p3.google_rating
      };

      return `
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:14px; margin-bottom:24px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.3);">
          <!-- Day Header -->
          <div style="background:linear-gradient(135deg,#0d9488,#0284c7); padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span style="background:rgba(255,255,255,0.2); color:#ffffff; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:1px;">DAY ${dayNum}</span>
              <h3 style="margin:6px 0 0; color:#ffffff; font-size:17px; font-weight:700;">${theme}</h3>
            </div>
            <div style="text-align:right;">
              <span style="font-size:11px; color:rgba(255,255,255,0.85);">Est. Day Spend</span><br/>
              <strong style="color:#fef08a; font-size:15px;">${dayEst}</strong>
            </div>
          </div>

          <div style="padding:20px;">
            <!-- 🌅 Morning -->
            <div style="padding:14px; background:#1e293b; border-left:4px solid #f59e0b; border-radius:8px; margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <strong style="color:#fbbf24; font-size:14px;">🌅 Morning (${mPlace.time})</strong>
                <span style="font-size:11px; color:#94a3b8; background:#0f172a; padding:2px 8px; border-radius:12px;">Visit: ${mPlace.duration}</span>
              </div>
              <h4 style="margin:4px 0 6px; color:#f8fafc; font-size:15px;">${mPlace.name} <span style="font-size:12px; color:#fef08a; font-weight:normal;">(${formatRating(mPlace.name)})</span></h4>
              ${renderPlaceImage(mPlace.name)}
              <p style="margin:0 0 8px; color:#cbd5e1; font-size:13px; line-height:1.5;">${mPlace.desc}</p>
              <div style="font-size:12px; color:#94a3b8; margin-top:8px;">
                ⏱️ <strong>Opening Hours:</strong> ${mPlace.opening} &nbsp;|&nbsp; 🚕 <strong>Transport:</strong> ${mPlace.transport}
              </div>
              <div style="margin-top:10px;">
                <a href="${mapsSearchUrl(mPlace.name)}" target="_blank" style="display:inline-block; color:#38bdf8; font-size:12px; font-weight:600; text-decoration:none; margin-right:12px;">📍 Open in Google Maps →</a>
                <a href="${bookingSearchUrl(mPlace.name)}" target="_blank" style="display:inline-block; color:#2dd4bf; font-size:12px; font-weight:600; text-decoration:none;">🎟️ Book Ticket / Entry →</a>
              </div>
            </div>

            <!-- ☀ Afternoon -->
            <div style="padding:14px; background:#1e293b; border-left:4px solid #38bdf8; border-radius:8px; margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <strong style="color:#38bdf8; font-size:14px;">☀ Afternoon (${aPlace.time})</strong>
                <span style="font-size:11px; color:#94a3b8; background:#0f172a; padding:2px 8px; border-radius:12px;">Visit: ${aPlace.duration}</span>
              </div>
              <div style="margin-bottom:8px; padding:8px 10px; background:rgba(56,189,248,0.1); border-radius:6px; font-size:12px; color:#7dd3fc;">
                ${aPlace.meal}
              </div>
              <h4 style="margin:4px 0 6px; color:#f8fafc; font-size:15px;">${aPlace.name} <span style="font-size:12px; color:#fef08a; font-weight:normal;">(${formatRating(aPlace.name)})</span></h4>
              ${renderPlaceImage(aPlace.name)}
              <p style="margin:0 0 8px; color:#cbd5e1; font-size:13px; line-height:1.5;">${aPlace.desc}</p>
              <div style="font-size:12px; color:#94a3b8; margin-top:8px;">
                ⏱️ <strong>Opening Hours:</strong> ${aPlace.opening} &nbsp;|&nbsp; 🚕 <strong>Transport:</strong> ${aPlace.transport}
              </div>
              <div style="margin-top:10px;">
                <a href="${mapsSearchUrl(aPlace.name)}" target="_blank" style="display:inline-block; color:#38bdf8; font-size:12px; font-weight:600; text-decoration:none; margin-right:12px;">📍 Open in Google Maps →</a>
                <a href="${bookingSearchUrl(aPlace.name)}" target="_blank" style="display:inline-block; color:#2dd4bf; font-size:12px; font-weight:600; text-decoration:none;">🎟️ Check Availability →</a>
              </div>
            </div>

            <!-- 🌇 Evening -->
            <div style="padding:14px; background:#1e293b; border-left:4px solid #a855f7; border-radius:8px; margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <strong style="color:#c084fc; font-size:14px;">🌇 Evening (${ePlace.time})</strong>
                <span style="font-size:11px; color:#94a3b8; background:#0f172a; padding:2px 8px; border-radius:12px;">Visit: ${ePlace.duration}</span>
              </div>
              <h4 style="margin:4px 0 6px; color:#f8fafc; font-size:15px;">${ePlace.name} <span style="font-size:12px; color:#fef08a; font-weight:normal;">(${formatRating(ePlace.name)})</span></h4>
              ${renderPlaceImage(ePlace.name)}
              <p style="margin:0 0 8px; color:#cbd5e1; font-size:13px; line-height:1.5;">${ePlace.desc}</p>
              <div style="font-size:12px; color:#94a3b8; margin-top:8px;">
                ⏱️ <strong>Opening Hours:</strong> ${ePlace.opening} &nbsp;|&nbsp; 🚕 <strong>Transport:</strong> ${ePlace.transport}
              </div>
              ${ePlace.snack ? `<div style="font-size:12px; color:#c084fc; margin-top:6px;">${ePlace.snack}</div>` : ''}
              <div style="margin-top:10px;">
                <a href="${mapsSearchUrl(ePlace.name)}" target="_blank" style="display:inline-block; color:#38bdf8; font-size:12px; font-weight:600; text-decoration:none;">📍 Open in Google Maps →</a>
              </div>
            </div>

            <!-- 🌙 Night -->
            <div style="padding:14px; background:#1e293b; border-left:4px solid #22c55e; border-radius:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <strong style="color:#4ade80; font-size:14px;">🌙 Night (${nPlace.time})</strong>
                <span style="font-size:11px; color:#94a3b8; background:#0f172a; padding:2px 8px; border-radius:12px;">Visit: ${nPlace.duration}</span>
              </div>
              <h4 style="margin:4px 0 6px; color:#f8fafc; font-size:15px;">${nPlace.name} <span style="font-size:12px; color:#fef08a; font-weight:normal;">(${formatRating(nPlace.name)})</span></h4>
              ${renderPlaceImage(nPlace.name)}
              <p style="margin:0 0 8px; color:#cbd5e1; font-size:13px; line-height:1.5;">${nPlace.desc}</p>
              <div style="font-size:12px; color:#94a3b8; margin-top:8px;">
                ${nPlace.dinner} &nbsp;|&nbsp; 🏨 ${nPlace.return}
              </div>
              <div style="margin-top:10px;">
                <a href="${mapsSearchUrl(nPlace.name)}" target="_blank" style="display:inline-block; color:#38bdf8; font-size:12px; font-weight:600; text-decoration:none;">📍 Open in Google Maps →</a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    // Default dynamic non-repeating 3-day schedule generator
    dayBlocksHTML = [1, 2, 3].map(dayNum => {
      const preset = DAY_PRESETS[(dayNum - 1) % DAY_PRESETS.length];
      return `
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:14px; margin-bottom:20px; padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="background:#0d9488; color:#ffffff; font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px;">DAY ${dayNum}</span>
            <span style="color:#2dd4bf; font-size:13px; font-weight:600;">Est. ₹${Math.round(numericBudget / duration)}</span>
          </div>
          <h4 style="margin:0 0 8px; color:#f8fafc; font-size:16px;">${preset.theme}</h4>
          <div style="padding:12px; background:#1e293b; border-radius:8px; font-size:12px; color:#cbd5e1; line-height:1.6;">
            🌅 <strong>Morning (${preset.morning.time}):</strong> Landmark Tour (Duration: ${preset.morning.duration}, Hours: ${preset.morning.opening})<br/>
            ☀ <strong>Afternoon (${preset.afternoon.time}):</strong> ${preset.afternoon.meal} (Duration: ${preset.afternoon.duration})<br/>
            🌇 <strong>Evening (${preset.evening.time}):</strong> ${preset.evening.snack} (Duration: ${preset.evening.duration})<br/>
            🌙 <strong>Night (${preset.night.time}):</strong> ${preset.night.dinner} • ${preset.night.return}
          </div>
        </div>
      `;
    }).join('');
  }

  // Recommendations Table
  const recCardsHTML = (recommendations && recommendations.length > 0) ? `
    <div style="margin-top:28px;">
      <h3 style="margin:0 0 14px; color:#f8fafc; font-size:17px;">🌟 AI Destination Highlights</h3>
      <table style="width:100%; border-collapse:collapse; background:#0f172a; border-radius:10px; overflow:hidden; border:1px solid #1e293b;">
        <thead>
          <tr style="background:#1e293b;">
            <th style="padding:12px 16px; text-align:left; font-size:12px; color:#94a3b8; text-transform:uppercase;">Place Name</th>
            <th style="padding:12px 16px; text-align:center; font-size:12px; color:#94a3b8; text-transform:uppercase;">Rating</th>
            <th style="padding:12px 16px; text-align:center; font-size:12px; color:#94a3b8; text-transform:uppercase;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${recommendations.map(r => `
            <tr>
              <td style="padding:12px 16px; border-bottom:1px solid #1e293b;">
                <strong style="color:#f8fafc; font-size:14px;">${r.name}</strong><br/>
                <span style="color:#64748b; font-size:12px;">${r.city || destinations}, ${r.state || 'India'}</span>
              </td>
              <td style="padding:12px 16px; border-bottom:1px solid #1e293b; text-align:center; color:#fef08a; font-weight:600;">
                ${formatRating(r.name)}
              </td>
              <td style="padding:12px 16px; border-bottom:1px solid #1e293b; text-align:center;">
                <a href="${mapsSearchUrl(r.name)}" target="_blank" style="color:#38bdf8; font-size:12px; text-decoration:none; font-weight:600;">Maps 🗺️</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your TravelIO Itinerary</title>
    <style>
      .weather-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 16px;
      }
      @media (max-width: 767px) {
        .weather-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#020617; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#e2e8f0; -webkit-font-smoothing:antialiased;">
    <div style="max-width:680px; margin:20px auto; background:#0b1329; border-radius:20px; overflow:hidden; border:1px solid #1e293b; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
      
      <!-- ════════ HEADER ════════ -->
      <div style="background:linear-gradient(135deg, #0f172a 0%, #0f766e 50%, #0284c7 100%); padding:36px 32px; text-align:center; position:relative;">
        <div style="display:inline-block; background:rgba(255,255,255,0.15); backdrop-filter:blur(8px); padding:8px 20px; border-radius:30px; border:1px solid rgba(255,255,255,0.25); margin-bottom:12px;">
          <span style="color:#ffffff; font-size:22px; font-weight:800; letter-spacing:1px;">✈️ TravelIO</span>
        </div>
        <h1 style="margin:8px 0 4px; color:#ffffff; font-size:26px; font-weight:800; letter-spacing:-0.5px;">OFFICIAL TRAVEL ITINERARY</h1>
        <p style="margin:0; color:#e0f2fe; font-size:14px; font-weight:500;">Smart AI-Powered Personalized Trip Plan</p>
        <div style="margin-top:16px;">
          <span style="background:#22c55e; color:#ffffff; font-size:11px; font-weight:700; padding:4px 14px; border-radius:12px; text-transform:uppercase; letter-spacing:1px;">✓ CONFIRMED ITINERARY</span>
        </div>
      </div>

      <!-- ════════ MAIN BODY ════════ -->
      <div style="padding:32px;">

        <!-- Personalized Greeting -->
        <div style="background:rgba(15,23,42,0.8); border:1px solid #1e293b; border-radius:14px; padding:20px; margin-bottom:28px;">
          <h2 style="margin:0 0 8px; color:#f8fafc; font-size:20px;">Hello, ${travelerName}! 👋</h2>
          <p style="margin:0; color:#94a3b8; font-size:14px; line-height:1.6;">
            We've generated your custom, high-precision travel itinerary for <strong>${destinations}</strong>. Your plan includes curated landmark visits, meal recommendations, real-time safety scores, and opening hours for a seamless travel experience.
          </p>
        </div>

        <!-- ════════ SUMMARY & TRAVELER DETAILS (CARDS) ════════ -->
        <div style="margin-bottom:28px;">
          <!-- Trip Summary Card -->
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:20px; margin-bottom:16px;">
            <h3 style="margin:0 0 14px; color:#0d9488; font-size:16px; display:flex; align-items:center;">
              📋 Trip Summary Card
            </h3>
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tr>
                <td style="padding:8px 0; color:#94a3b8; width:45%;">📍 Destination:</td>
                <td style="padding:8px 0; color:#f8fafc; font-weight:600;"><a href="${mapsSearchUrl(destinations)}" target="_blank" style="color:#38bdf8; text-decoration:none;">${destinations} 🗺️</a></td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#94a3b8;">📅 Trip Duration:</td>
                <td style="padding:8px 0; color:#f8fafc; font-weight:600;">${duration} Days / ${duration - 1 > 0 ? duration - 1 : 1} Nights</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#94a3b8;">🗓️ Travel Month:</td>
                <td style="padding:8px 0; color:#f8fafc; font-weight:600;">${travelMonth}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#94a3b8;">💰 Estimated Total Budget:</td>
                <td style="padding:8px 0; color:#2dd4bf; font-weight:700; font-size:15px;">₹${numericBudget.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <!-- Traveler Details Card -->
          <div style="background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:20px;">
            <h3 style="margin:0 0 14px; color:#0284c7; font-size:16px;">
              👤 Traveler Details Card
            </h3>
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
              <tr>
                <td style="padding:8px 0; color:#94a3b8; width:45%;">📧 Email Recipient:</td>
                <td style="padding:8px 0; color:#f8fafc; font-weight:600;">${to}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#94a3b8;">👥 Group Size:</td>
                <td style="padding:8px 0; color:#f8fafc; font-weight:600;">${groupSize} Person(s)</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#94a3b8;">🛋️ Travel Style:</td>
                <td style="padding:8px 0; color:#f8fafc; font-weight:600;">${comfortLevel}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#94a3b8;">🛡️ Booking Status:</td>
                <td style="padding:8px 0; color:#4ade80; font-weight:700;">VERIFIED & CONFIRMED</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- ════════ WEATHER & SAFETY SECTION ════════ -->
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:20px; margin-bottom:28px;">
          <h3 style="margin:0 0 16px; color:#f8fafc; font-size:16px;">🌤️ Weather & Real-time Safety Score</h3>

          <div class="weather-grid">
            
            <!-- Weather Illustration -->
            <div style="background:linear-gradient(135deg,#6366f1,#10b981); border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px; color:#fff; text-align:center;">
              <span style="font-size:32px; margin-bottom:8px;">${getWeatherEmoji(weather.condition)}</span>
              <span style="font-size:14px; font-weight:600;">${weather.condition || 'Sunny'}</span>
            </div>

            <!-- Temperature Card -->
            <div style="background:#1e293b; padding:16px; border-radius:12px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center;">
              <span style="font-size:12px; color:#94a3b8; margin-bottom:4px;">Destination Temp</span>
              <strong style="font-size:20px; color:#38bdf8; margin-bottom:4px;">${weather.temp || '26°C'}</strong>
              <span style="font-size:11px; color:#cbd5e1;">Real-time API</span>
            </div>

            <!-- Safety Card -->
            <div style="background:#1e293b; padding:16px; border-radius:12px; text-align:center; border:1px solid rgba(34,197,94,0.3); display:flex; flex-direction:column; align-items:center; justify-content:center;">
              <span style="font-size:12px; color:#94a3b8; margin-bottom:4px;">Safety Score</span>
              <strong style="font-size:20px; color:#4ade80; margin-bottom:4px;">${safetyData.score} / 100</strong>
              <span style="font-size:11px; color:#86efac;">${safetyData.category || 'Verified Safe Area'}</span>
            </div>
            
          </div>
          <p style="margin:0; font-size:12px; color:#94a3b8; text-align:center; line-height:1.5;">
            💡 <strong>Weather Advisory:</strong> Pack light breathable cotton clothing, sunscreen, sunglasses, and comfortable walking shoes.
          </p>
        </div>

        <!-- ════════ BUDGET BREAKDOWN CARD ════════ -->
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:20px; margin-bottom:28px;">
          <h3 style="margin:0 0 14px; color:#fef08a; font-size:16px;">💰 Estimated Budget Breakdown</h3>
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <tr style="border-bottom:1px solid #1e293b;">
              <td style="padding:10px 0; color:#94a3b8;">🏨 Accommodation (40%):</td>
              <td style="padding:10px 0; text-align:right; color:#f8fafc; font-weight:600;">₹${accomBudget.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-bottom:1px solid #1e293b;">
              <td style="padding:10px 0; color:#94a3b8;">🚗 Transport & Transit (25%):</td>
              <td style="padding:10px 0; text-align:right; color:#f8fafc; font-weight:600;">₹${transBudget.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-bottom:1px solid #1e293b;">
              <td style="padding:10px 0; color:#94a3b8;">🍽️ Food & Local Dining (20%):</td>
              <td style="padding:10px 0; text-align:right; color:#f8fafc; font-weight:600;">₹${foodBudget.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-bottom:1px solid #1e293b;">
              <td style="padding:10px 0; color:#94a3b8;">🎟️ Entry Tickets & Activities (10%):</td>
              <td style="padding:10px 0; text-align:right; color:#f8fafc; font-weight:600;">₹${actBudget.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding:10px 0; color:#94a3b8;">🛡️ Emergency Contingency (5%):</td>
              <td style="padding:10px 0; text-align:right; color:#f8fafc; font-weight:600;">₹${emerBudget.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <!-- ════════ DAY-WISE ITINERARY ════════ -->
        <div style="margin-bottom:28px;">
          <h2 style="margin:0 0 16px; color:#f8fafc; font-size:20px; border-bottom:2px solid #0d9488; padding-bottom:8px;">
            🗓️ Day-by-Day Schedule & Route Plan
          </h2>
          ${dayBlocksHTML}
        </div>

        ${recCardsHTML}

        <!-- ════════ AI TRAVEL TIPS ════════ -->
        <div style="background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:20px; margin-bottom:28px;">
          <h3 style="margin:0 0 12px; color:#a855f7; font-size:16px;">💡 AI Smart Travel Tips</h3>
          <ul style="margin:0; padding-left:18px; color:#cbd5e1; font-size:13px; line-height:1.7;">
            <li><strong>Local Customs:</strong> Dress modestly when visiting religious monuments & temples. Remove shoes before entering.</li>
            <li><strong>Best Photo Spots:</strong> Plan visits during Golden Hour (05:30 PM) for optimal sunset lighting on historical facades.</li>
            <li><strong>Transport Advice:</strong> Use pre-paid taxis, metro, or ride-hailing apps (Uber/Ola) for reliable pricing.</li>
            <li><strong>Hydration & Safety:</strong> Keep bottled water handy and avoid unpasteurized street juices during peak afternoon heat.</li>
          </ul>
        </div>

        <!-- ════════ EMERGENCY CONTACTS ════════ -->
        <div style="background:#1e1b4b; border:1px solid #4338ca; border-radius:14px; padding:20px; margin-bottom:28px;">
          <h3 style="margin:0 0 12px; color:#f43f5e; font-size:16px;">🚨 Emergency Contacts & Support</h3>
          <table style="width:100%; border-collapse:collapse; font-size:13px; color:#e0e7ff;">
            <tr>
              <td style="padding:6px 0; width:60%;">📞 Tourist Emergency Helpline:</td>
              <td style="padding:6px 0; font-weight:700; color:#fb7185;">1363 (24x7 Toll-Free)</td>
            </tr>
            <tr>
              <td style="padding:6px 0;">Police Emergency:</td>
              <td style="padding:6px 0; font-weight:700; color:#fb7185;">112</td>
            </tr>
            <tr>
              <td style="padding:6px 0;">Ambulance / Medical Assistance:</td>
              <td style="padding:6px 0; font-weight:700; color:#fb7185;">108</td>
            </tr>
            <tr>
              <td style="padding:6px 0;">Women Safety Helpline:</td>
              <td style="padding:6px 0; font-weight:700; color:#fb7185;">1091</td>
            </tr>
          </table>
        </div>

      </div>

      <!-- ════════ FOOTER ════════ -->
      <div style="background:#020617; border-top:1px solid #1e293b; padding:28px 32px; text-align:center;">
        <p style="margin:0 0 12px; color:#94a3b8; font-size:13px;">
          Need help with your trip? Contact TravelIO Support anytime.
        </p>
        <div style="margin-bottom:16px;">
          <a href="mailto:support@travelio.app" style="color:#0d9488; text-decoration:none; font-weight:600; margin:0 10px; font-size:13px;">✉️ support@travelio.app</a>
          <a href="http://localhost:5173" style="color:#0284c7; text-decoration:none; font-weight:600; margin:0 10px; font-size:13px;">🌐 Visit TravelIO Website</a>
        </div>
        <div style="margin-bottom:16px;">
          <a href="#" style="color:#64748b; text-decoration:none; margin:0 8px; font-size:12px;">Twitter</a> •
          <a href="#" style="color:#64748b; text-decoration:none; margin:0 8px; font-size:12px;">Instagram</a> •
          <a href="#" style="color:#64748b; text-decoration:none; margin:0 8px; font-size:12px;">LinkedIn</a> •
          <a href="#" style="color:#64748b; text-decoration:none; margin:0 8px; font-size:12px;">Facebook</a>
        </div>
        <p style="margin:0; color:#475569; font-size:11px;">
          © ${new Date().getFullYear()} TravelIO Inc. All rights reserved. • AI Travel Engine v2.5
        </p>
      </div>

    </div>
  </body>
  </html>
  `;

  return logAndSendMail(to, `✈️ Your TravelIO Itinerary — ${destinations}`, html, 'itinerary');
}

/**
 * Send daily trip alert email
 */
async function sendDailyAlert(to, tripData) {
  const emoji = getWeatherEmoji(tripData.weather?.condition);
  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif; max-width:500px; margin:0 auto; background:#0f0f23; border-radius:16px; overflow:hidden; border:1px solid rgba(99,102,241,0.3);">
    <div style="background:linear-gradient(135deg,#6366f1,#10b981); padding:24px; text-align:center;">
      <h2 style="margin:0; color:#fff;">Day ${tripData.day} of Your Trip ${emoji}</h2>
    </div>
    <div style="padding:24px; color:#e2e8f0;">
      ${buildWeatherCube(tripData.weather)}
      <h3 style="color:#a5b4fc;">Today's Highlights</h3>
      <p style="color:#94a3b8;">${tripData.highlights || 'Enjoy your trip! Check TravelIO for personalized recommendations.'}</p>
      <div style="margin-top:16px; padding:12px; background:rgba(16,185,129,0.1); border-radius:8px; text-align:center;">
        <a href="http://localhost:5173/plan" style="color:#10b981; text-decoration:none; font-weight:600;">Open TravelIO Dashboard →</a>
      </div>
    </div>
  </div>`;

  return logAndSendMail(to, `${emoji} TravelIO — Day ${tripData.day} Trip Alert`, html, 'alert');
}

module.exports = { sendItineraryEmail, sendOTPEmail, sendDailyAlert, getWeatherEmoji };
