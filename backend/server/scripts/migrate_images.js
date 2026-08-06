require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const City = require('../models/City');
const Place = require('../models/Place');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travelio';

async function migrateImages() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const cachePath = path.join(__dirname, '../../ml-service/cache/image_cache.json');
    if (!fs.existsSync(cachePath)) {
      console.log('image_cache.json not found at', cachePath);
      process.exit(1);
    }

    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

    // Migrate Cities
    const cities = await City.find();
    let cityUpdates = 0;
    for (let city of cities) {
      const key = `${city.name} ${city.state} india tourism`.toLowerCase().trim();
      if (cache[key] && cache[key].length > 0) {
        city.images = cache[key].slice(0, 2);
        city.image = city.images[0];
        await city.save();
        cityUpdates++;
      }
    }
    console.log(`Updated ${cityUpdates} cities with images from cache.`);

    // Migrate Places
    const places = await Place.find();
    let placeUpdates = 0;
    for (let place of places) {
      // Sometimes place cache keys use `place name + city name + india`
      const key1 = `${place.name} ${place.cityName || ''} india`.toLowerCase().trim();
      
      let images = cache[key1];
      
      // Attempt fallback key format
      if (!images) {
          const key2 = `${place.name} ${place.cityName || ''} india tourism`.toLowerCase().trim();
          images = cache[key2];
      }
      
      if (images && images.length > 0) {
        place.images = images.slice(0, 5);
        place.image = place.images[0];
        await place.save();
        placeUpdates++;
      }
    }
    console.log(`Updated ${placeUpdates} places with images from cache.`);

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateImages();
