require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const Flight = require('../models/Flight');

const CSV_FILE = path.join(__dirname, '../../dataset/airlines/flights.csv');

async function seedFlights() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/travelio';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB');

    const count = await Flight.countDocuments();
    if (count > 0) {
      console.log(`[Seed] Flight collection already has ${count} records. Clearing...`);
      await Flight.deleteMany({});
    }

    const flights = [];
    let rowCount = 0;

    console.log('[Seed] Parsing CSV...');
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (data) => {
        // Handle potentially malformed rows
        if (!data.airline || !data.Source || !data.destination || !data.Price) return;

        flights.push({
          airline: data.airline,
          date_of_journey: new Date(data.date_of_journey),
          source: data.Source.toLowerCase(),
          destination: data.destination.toLowerCase(),
          route: data.route,
          dep_time: data.dep_time,
          arrival_time: data.Arrival_time,
          duration: data.Duration,
          total_stops: data.Total_stops,
          additional_info: data.Additional_info,
          price: parseFloat(data.Price)
        });
        rowCount++;
      })
      .on('end', async () => {
        console.log(`[Seed] Successfully parsed ${rowCount} rows.`);
        console.log('[Seed] Inserting into MongoDB in batches...');
        
        // Insert in batches of 1000
        const batchSize = 1000;
        for (let i = 0; i < flights.length; i += batchSize) {
          const batch = flights.slice(i, i + batchSize);
          await Flight.insertMany(batch);
          console.log(`[Seed] Inserted ${Math.min(i + batchSize, flights.length)} / ${flights.length}`);
        }

        console.log('[Seed] Done!');
        mongoose.connection.close();
      })
      .on('error', (error) => {
        console.error('[Seed Error]', error);
        mongoose.connection.close();
      });

  } catch (error) {
    console.error('[Seed Fatal]', error);
    mongoose.connection.close();
  }
}

seedFlights();
