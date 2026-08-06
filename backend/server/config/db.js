const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travelio');
    console.log(`[TravelIO] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn('[TravelIO] MongoDB connection failed. Running without database. Error:', error.message);
    // process.exit(1); // Removed so server can start for Chatbot testing
  }
};

module.exports = connectDB;
