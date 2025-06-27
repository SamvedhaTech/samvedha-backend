// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require("cors");
const app = express();

// Routes
const userRoute = require('./routes/authRoute');
const ticketroute = require('./routes/usersroute');
const amountRoute = require('./routes/amountRoute');

// Enable CORS middleware with more specific configuration
app.use(cors({
  origin: "*", // Allow all origins — change to specific domain in production
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Requested-With", 
    "Accept", 
    "Origin",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Methods"
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webhook route with raw body
app.use('/api/users/webhook', express.raw({ type: 'application/json' }), ticketroute);

// Regular routes
app.use('/api/', userRoute);
app.use('/api/users', ticketroute);
app.use('/api/amount', amountRoute);

// Default route
app.get("/", (req, res) => {
  res.status(200).send("Hello from the server!!");
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).send(err.message);
});

module.exports = app;
