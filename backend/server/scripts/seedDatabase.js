const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const City = require('../models/City');
const Place = require('../models/Place');

const PLACES_CSV = path.join(__dirname, '../../dataset/destinations/places.csv');

const normalizeName = (name) => {
  if (!name) return '';
  let str = name.trim();
  // Capitalize first letter of each word
  str = str.replace(/\b\w/g, c => c.toUpperCase());
  
  if (str.toLowerCase() === 'ahemdabad') return 'Ahmedabad';
  if (str.toLowerCase() === 'new delhi') return 'New Delhi';
  return str;
};

const stateFixes = {
  'Maharahtra': 'Maharashtra',
  'Maharastra': 'Maharashtra',
  'Andaman And Nicobar': 'Andaman and Nicobar Islands',
  'Andaman And Nicobar Islands': 'Andaman and Nicobar Islands',
  'Nct Of Delhi': 'Delhi',
  'Gujrat': 'Gujarat',
  'Karanataka': 'Karnataka'
};

const normalizeState = (state) => {
  const norm = normalizeName(state);
  return stateFixes[norm] || norm;
};

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    console.log('Clearing old City and Place collections...');
    await City.deleteMany({});
    await Place.deleteMany({});

    console.log('Reading CSV...');
    const places = [];
    const citiesMap = new Map(); // key: "City,State"

    await new Promise((resolve, reject) => {
      fs.createReadStream(PLACES_CSV)
        .pipe(csv())
        .on('data', (row) => {
          const state = normalizeState(row.state);
          let cityName = normalizeName(row.city);
          const placeName = normalizeName(row.popular_destination);
          
          if (!cityName || !state || !placeName) return;

          const cityKey = `${cityName},${state}`;
          if (!citiesMap.has(cityKey)) {
            citiesMap.set(cityKey, {
              name: cityName,
              state: state,
              slug: slugify(`${cityName}-${state}`),
              type: row.interest || 'Destination',
              placesCount: 0
            });
          }
          
          const cityObj = citiesMap.get(cityKey);
          cityObj.placesCount++;

          places.push({
            name: placeName,
            cityName: cityName,
            state: state,
            slug: slugify(`${placeName}-${cityName}-${state}`),
            type: row.interest || 'Point of Interest',
            rating: parseFloat(row.google_rating) || 0,
            entrance_fee: parseFloat(row.price_fare) || 0,
            latitude: parseFloat(row.latitude) || null,
            longitude: parseFloat(row.longitude) || null,
            cityObjKey: cityKey // temporary reference
          });
        })
        .on('end', () => {
          // Fix duplicate slugs
          const slugSet = new Set();
          places.forEach((p, index) => {
            let originalSlug = p.slug;
            let counter = 1;
            while (slugSet.has(p.slug)) {
              p.slug = `${originalSlug}-${counter}`;
              counter++;
            }
            slugSet.add(p.slug);
          });
          resolve();
        })
        .on('error', reject);
    });

    console.log(`Found ${citiesMap.size} cities and ${places.length} places.`);
    
    // Insert Cities
    const cityDocs = Array.from(citiesMap.values());
    const insertedCities = await City.insertMany(cityDocs);
    console.log(`Inserted ${insertedCities.length} cities.`);

    // Build ID map
    const idMap = new Map();
    insertedCities.forEach(c => {
      idMap.set(`${c.name},${c.state}`, c._id);
    });

    // Insert Places
    const placeDocs = places.map(p => {
      const cityId = idMap.get(p.cityObjKey);
      delete p.cityObjKey;
      return { ...p, city: cityId };
    });

    const insertedPlaces = await Place.insertMany(placeDocs);
    console.log(`Inserted ${insertedPlaces.length} places.`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedDB();
