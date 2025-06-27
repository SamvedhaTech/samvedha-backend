const mongoose = require("mongoose");

const databaseConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    // Already connected
    return;
  }

  try {
    await mongoose.connect(process.env.DB_URI); // no options needed for new driver

    console.log("✅ Database connected successfully");

    mongoose.connection.on('error', err => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn("MongoDB disconnected");
    });

  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = databaseConnection;
