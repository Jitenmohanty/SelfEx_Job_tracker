let io;

module.exports = {
  init: (httpServer) => {
    console.log('🔧 Initializing Socket.io server...');
    
    io = require('socket.io')(httpServer, {
      cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });
    
    console.log('✅ Socket.io server initialized successfully');
    return io;
  },
  
  getIO: () => {
    if (!io) {
      console.error('❌ Socket.io not initialized!');
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};