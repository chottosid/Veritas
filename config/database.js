import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE_URL);

    console.log(`MongoDB Connected`);
    return conn;
  } catch (error) {
    console.log(process.env.DATABASE_URL);
    console.log("printed");
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

// Simple function to check if database is connected
const isDBConnected = () => {
  return mongoose.connection.readyState === 1;
};

export { connectDB, isDBConnected };
