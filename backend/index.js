const express = require("express");
const cors = require("cors");
const http = require("http");
require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const jobRoutes = require("./routes/jobRoutes");
const socketInit = require("./socket");
const connectDB = require("./config/ConnectToDB");

const app = express();
const server = http.createServer(app);
const io = socketInit.init(server);

// Define allowed origins for different environments
const allowedOrigins = [
  process.env.CLIENT_URI, // Your main client URI from env
  "http://localhost:5173", // Local development
  "https://self-ex-job-tracker.vercel.app", // Production domain
  "https://self-ex-job-tracker.vercel.app", // Vercel deployment
  // Add more origins as needed
].filter(Boolean); // Remove any undefined values

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if the origin is in our allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // For development, you might want to be more permissive
      if (process.env.NODE_ENV === "development") {
        return callback(null, true);
      }
      
      // Reject the request
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  })
);

app.use(express.json());

// Connect to MongoDB
connectDB();

// Socket.io connection handling with detailed logging
io.on("connection", (socket) => {
  console.log("🔌 NEW USER CONNECTED:", {
    socketId: socket.id,
    timestamp: new Date().toISOString(),
    clientIP: socket.handshake.address,
  });

  // Join user to their personal room
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log("👤 USER JOINED ROOM:", {
      userId: userId,
      socketId: socket.id,
      rooms: Array.from(socket.rooms),
      timestamp: new Date().toISOString(),
    });

    // Confirm room joining to client
    socket.emit("roomJoined", {
      userId,
      message: "Successfully joined personal room",
    });
  });

  // Debug: List all connected clients
  socket.on("getConnectedUsers", () => {
    const connectedSockets = io.sockets.sockets;
    console.log("📊 CONNECTED USERS DEBUG:", {
      totalConnections: connectedSockets.size,
      socketIds: Array.from(connectedSockets.keys()),
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ USER DISCONNECTED:", {
      socketId: socket.id,
      reason: reason,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("error", (error) => {
    console.error("🚨 SOCKET ERROR:", {
      socketId: socket.id,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);

// Seed route (for development only)
// if (process.env.NODE_ENV !== "production") {
//   app.post("/api/seed", async (req, res) => {
//     try {
//       const { action } = req.body;

//       if (action === "seed") {
//         // Import and run the seed function
//         const { seedDatabase } = require("./seedData");
//         await seedDatabase();
//         res.json({ message: "Database seeded successfully" });
//       } else if (action === "simulate") {
//         // Import and run the simulation function
//         const { simulateRealTimeUpdates } = require("./seedData");
//         await simulateRealTimeUpdates();
//         res.json({ message: "Real-time update simulated successfully" });
//       } else {
//         res
//           .status(400)
//           .json({ message: 'Invalid action. Use "seed" or "simulate"' });
//       }
//     } catch (error) {
//       res
//         .status(500)
//         .json({
//           message: "Error with seeding operation",
//           error: error.message,
//         });
//     }
//   });
// }

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🌐 Allowed origins:`, allowedOrigins);
});