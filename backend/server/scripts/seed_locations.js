require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const Location = require('../models/Location');

const CSV_PATH = path.join(__dirname, '../../dataset/destinations/locations_rows.csv');

// Simple CSV parser for lines (handles basic quoted commas, not robust but okay for this dataset)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && line[i+1] === '"') {
            current += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

async function seedLocations() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travelio');
        console.log('Connected.');
        
        console.log('Clearing existing locations...');
        await Location.deleteMany({});
        
        console.log(`Reading from ${CSV_PATH}...`);
        
        const fileStream = fs.createReadStream(CSV_PATH);
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
        
        let headers = null;
        let count = 0;
        
        for await (const line of rl) {
            const row = parseCSVLine(line);
            if (!headers) {
                headers = row;
                continue;
            }
            
            // Map columns
            const doc = {};
            headers.forEach((h, i) => doc[h.trim()] = row[i]);
            
            if (!doc.id || !doc.name) continue;
            
            // Extract teaser (first 300 chars of wikipedia content)
            let teaser = '';
            if (doc.wikipedia_content) {
                teaser = doc.wikipedia_content.substring(0, 300);
                if (teaser.length === 300) teaser += '...';
            }
            
            // Extract single image from Unsplash URLs or fallback to images
            let heroImage = '';
            try {
                if (doc.unsplash_images) {
                    const urls = JSON.parse(doc.unsplash_images.replace(/'/g, '"'));
                    if (urls.length > 0) heroImage = urls[0];
                }
            } catch (e) {}
            
            if (!heroImage) {
                try {
                    if (doc.images) {
                        const urls = JSON.parse(doc.images.replace(/'/g, '"'));
                        if (urls.length > 0) heroImage = urls[0];
                    }
                } catch(e) {}
            }
            
            // Extract Airbnb URL
            let airbnbUrl = '';
            try {
                if (doc.airbnb_url) {
                    airbnbUrl = doc.airbnb_url;
                }
            } catch(e) {}

            try {
                await Location.create({
                    locationId: doc.id,
                    name: doc.name,
                    state: doc.state || '',
                    latitude: parseFloat(doc.latitude) || 0,
                    longitude: parseFloat(doc.longitude) || 0,
                    heroImage: heroImage,
                    teaserText: teaser,
                    airbnbUrl: airbnbUrl,
                    googleMapsUrl: doc.google_maps_url || ''
                });
                count++;
                if (count % 1000 === 0) console.log(`Seeded ${count} locations...`);
            } catch (err) {
                // Ignore duplicates or parse errors on single lines
            }
        }
        
        console.log(`✅ Success! Seeded ${count} locations to MongoDB.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedLocations();
