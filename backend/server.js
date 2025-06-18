const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
require('dotenv').config();
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const socketInit = require('./socket');

const app = express();
const server = http.createServer(app);
const io = socketInit.init(server);

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));


  console.log('MongoDB URI:', process.env.MONGODB_URI);

// Socket.io connection handling with detailed logging
io.on('connection', (socket) => {
  console.log('🔌 NEW USER CONNECTED:', {
    socketId: socket.id,
    timestamp: new Date().toISOString(),
    clientIP: socket.handshake.address
  });
  
  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log('👤 USER JOINED ROOM:', {
      userId: userId,
      socketId: socket.id,
      rooms: Array.from(socket.rooms),
      timestamp: new Date().toISOString()
    });
    
    // Confirm room joining to client
    socket.emit('roomJoined', { userId, message: 'Successfully joined personal room' });
  });
  
  // Debug: List all connected clients
  socket.on('getConnectedUsers', () => {
    const connectedSockets = io.sockets.sockets;
    console.log('📊 CONNECTED USERS DEBUG:', {
      totalConnections: connectedSockets.size,
      socketIds: Array.from(connectedSockets.keys()),
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ USER DISCONNECTED:', {
      socketId: socket.id,
      reason: reason,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('error', (error) => {
    console.error('🚨 SOCKET ERROR:', {
      socketId: socket.id,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);

// Seed route (for development only)
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/seed', async (req, res) => {
    try {
      const { action } = req.body;
      
      if (action === 'seed') {
        // Import and run the seed function
        const { seedDatabase } = require('./seedData');
        await seedDatabase();
        res.json({ message: 'Database seeded successfully' });
      } else if (action === 'simulate') {
        // Import and run the simulation function
        const { simulateRealTimeUpdates } = require('./seedData');
        await simulateRealTimeUpdates();
        res.json({ message: 'Real-time update simulated successfully' });
      } else {
        res.status(400).json({ message: 'Invalid action. Use "seed" or "simulate"' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error with seeding operation', error: error.message });
    }
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
});