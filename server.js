import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";
import { connectDB, isDBConnected } from "./config/database.js";
import corsMiddleware from "./middleware/cors.js";
import websocketServer from "./websocket.js";
import { blockchainSyncJob } from "./utils/blockchainSync.js";

// Import routes
import citizenRoutes from "./routes/citizens.js";
import policeRoutes from "./routes/police.js";
import judgeRoutes from "./routes/judges.js";
import lawyerRoutes from "./routes/lawyers.js";
import blockchainRoutes from "./routes/blockchain.js";
import otpRoutes from "./routes/otp.js";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001; // Add fallback value

// Initialize WebSocket server
websocketServer.initialize(server);

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend dist
app.use(express.static('frontend/dist'));

// Simple health check endpoint
app.get("/health", (req, res) => {
  const dbConnected = isDBConnected();
  const wsConnectedUsers = websocketServer.getConnectedUsersCount();

  if (dbConnected) {
    res.status(200).json({
      status: "OK",
      message: "Server and database are running",
      websocket: {
        status: "OK",
        connectedUsers: wsConnectedUsers,
      },
    });
  } else {
    res.status(503).json({
      status: "Error",
      message: "Database not connected",
      websocket: {
        status: "OK",
        connectedUsers: wsConnectedUsers,
      },
    });
  }
});

// API Routes
app.use("/api/citizens", citizenRoutes);
app.use("/api/police", policeRoutes);
app.use("/api/judges", judgeRoutes);
app.use("/api/lawyers", lawyerRoutes);
app.use("/api/blockchain", blockchainRoutes);
app.use("/api/otp", otpRoutes);

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'frontend/dist' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
    timestamp: new Date().toISOString(),
  });
});

// Start server function
const startServer = async () => {
  try {
    // Connect to database first
    console.log("🔌 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected successfully");

    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(
        `📊 Health check available at: http://localhost:${PORT}/health`
      );
      console.log(`🔌 WebSocket server ready for connections`);
      
      // Start the blockchain sync job after server is running
      console.log("🔄 Starting blockchain sync job...");
      setTimeout(() => {
        blockchainSyncJob.start(30000); // Run every 30 seconds
        console.log(`🔄 Blockchain sync job started (30 second interval)`);
      }, 2000); // Wait 2 seconds for everything to be ready
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
