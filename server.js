import "dotenv/config";
import express from "express";
import { connectDB, isDBConnected } from "./config/database.js";
import corsMiddleware from "./middleware/cors.js";

// Import routes
import citizenRoutes from "./routes/citizens.js";
import policeRoutes from "./routes/police.js";
import judgeRoutes from "./routes/judges.js";
import lawyerRoutes from "./routes/lawyers.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple health check endpoint
app.get("/health", (req, res) => {
  const dbConnected = isDBConnected();

  if (dbConnected) {
    res.status(200).json({
      status: "OK",
      message: "Server and database are running",
    });
  } else {
    res.status(503).json({
      status: "Error",
      message: "Database not connected",
    });
  }
});

// API Routes
app.use("/api/citizens", citizenRoutes);
app.use("/api/police", policeRoutes);
app.use("/api/judges", judgeRoutes);
app.use("/api/lawyers", lawyerRoutes);

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
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(
        `📊 Health check available at: http://localhost:${PORT}/health`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
