import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import mainRouter from "./routes/index.js";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

const app = express();

// ✅ ADD THIS: Trust proxy for Koyeb/Vercel (needed for req.secure)
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://asian-footware-clone.vercel.app",
  "https://*.vercel.app",
  process.env.FRONTEND_URL, // Add from .env
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check against allowedOrigins array
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Check for Vercel preview deployments
    if (origin.endsWith(".vercel.app")) return callback(null, true);

    console.log("🚫 CORS Blocked Origin:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve static files BEFORE routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ ADD THIS: Debug logging for static files
app.use("/uploads", (req, res, next) => {
  console.log("📁 Static file requested:", req.originalUrl);
  next();
});

app.get("/", (req, res) => {
  res.json({
    message: "Server is running!",
    allowedOrigins: allowedOrigins,
  });
});

app.use("/api/v1", mainRouter);

try {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("Connected to MongoDB");
} catch (error) {
  console.log("Error connecting to MongoDB", error);
}

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
