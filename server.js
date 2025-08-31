import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";
import { connectDB, isDBConnected } from "./config/database.js";
import corsMiddleware from "./middleware/cors.js";
import websocketServer from "./websocket.js";

// Import routes
import citizenRoutes from "./routes/citizens.js";
import policeRoutes from "./routes/police.js";
import judgeRoutes from "./routes/judges.js";
import lawyerRoutes from "./routes/lawyers.js";
import blockchainRoutes from "./routes/blockchain.js";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001; // Add fallback value

// Initialize WebSocket server
websocketServer.initialize(server);

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    // Connect to database
    await connectDB();

    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(
        `📊 Health check available at: http://localhost:${PORT}/health`
      );
      console.log(`🔌 WebSocket server ready for connections`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
