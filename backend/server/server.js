require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const cron = require('node-cron');

// Import routes
const authRoutes = require('./routes/auth.routes');
const tripRoutes = require('./routes/trip.routes');
const budgetRoutes = require('./routes/budget.routes');
const safetyRoutes = require('./routes/safety.routes');
const landmarkRoutes = require('./routes/landmark.routes');
const journalRoutes = require('./routes/journal.routes');
const emailRoutes = require('./routes/email.routes');
const newsRoutes = require('./routes/news.routes');
const routeGraphRoutes = require('./routes/routeGraph.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const adminRoutes = require('./routes/admin.routes');
const locationsRoutes = require('./routes/locations.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const flightRoutes = require('./routes/flight.routes');
const apiLogger = require('./middleware/apiLogger');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// EJS for admin views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API Logging Middleware
app.use(apiLogger);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/landmark', landmarkRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/route', routeGraphRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/flights', flightRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TravelIO API Gateway',
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO setup
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Cron job: daily trip email alerts (every day at 8 AM IST)
cron.schedule('0 8 * * *', async () => {
  console.log('[Cron] Running daily trip alert check...');
  // This would fetch active trips and send daily alerts
  // Implementation depends on trip storage schema
}, { timezone: 'Asia/Kolkata' });

// Cron job: Reset AI credits (every day at midnight IST)
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Resetting user AI credits...');
  try {
    const User = require('./models/User');
    const result = await User.updateMany({}, [
      { $set: { credits: "$maxCredits" } } // use aggregation pipeline syntax in updateMany to set credits = maxCredits
    ]);
    console.log(`[Cron] Credits reset for ${result.modifiedCount} users.`);
  } catch (err) {
    console.error('[Cron Error] Failed to reset credits:', err.message);
  }
}, { timezone: 'Asia/Kolkata' });

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n  ✈️  TravelIO API Gateway`);
  console.log(`  ├─ Server:     http://localhost:${PORT}`);
  console.log(`  ├─ Health:     http://localhost:${PORT}/api/health`);
  console.log(`  ├─ WebSockets: enabled`);
  console.log(`  └─ Cron:       daily alerts at 8:00 AM IST\n`);
});

// Force restart
