
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import dns from "dns";

// Fix for Node.js c-ares DNS resolver failing SRV lookups on certain networks
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import { apiLimiter } from "./middlewares/rateLimits.js";
import { verifyCsrfToken } from "./middlewares/csrf.middleware.js";


import apiRouter from "./routes/index.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const authAnomalyCounts = { 401: 0, 403: 0, 429: 0 };

const rawOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const normalizeOrigin = (origin = "") => origin.replace(/\/+$/, "");
const clientOrigins = rawOrigins.map(normalizeOrigin);
const wildcardOrigins = clientOrigins
  .filter((o) => o.startsWith("*."))
  .map((o) => o.slice(1).toLowerCase());
const strictOrigins = clientOrigins
  .filter((o) => !o.startsWith("*."))
  .map((o) => o.toLowerCase());


const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin).toLowerCase();
  if (strictOrigins.includes(normalized)) return true;
  return wildcardOrigins.some((suffix) => normalized.endsWith(suffix));
};

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use((req, res, next) => {
  res.on("finish", () => {
    const code = res.statusCode;
    if (code === 401 || code === 403 || code === 429) {
      authAnomalyCounts[code] += 1;
      const total =
        authAnomalyCounts[401] + authAnomalyCounts[403] + authAnomalyCounts[429];
      if (total % 25 === 0) {
        console.warn("[auth-monitor]", {
          reqId: req.headers["x-request-id"] || null,
          path: req.originalUrl,
          method: req.method,
          counts: authAnomalyCounts,
        });
      }
    }
  });
  next();
});


app.use(verifyCsrfToken);
app.use("/api", apiLimiter);
app.get("/api", (req, res) => {
  res.status(200).json({ message: "Server is live" });
});

app.use("/api", apiRouter);

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

start();
