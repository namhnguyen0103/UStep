import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import pinoHttp from "pino-http";

dotenv.config();

import mainRouter, { metricRoutes, stepRoutes, calorieRoutes } from "./routes/index.js";
import { errorHandler } from "./utils/helpers.js";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS
app.use(
  cors({
    origin: "*", // allow all origins
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  })
);

const logger = pinoHttp({
  customProps: (req, res) => ({ context: "HTTP" }),
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: { singleLine: true },
        }
      : undefined,
  level: process.env.LOG_LEVEL || "info",
});
app.use(logger);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", mainRouter);

app.use("/api/profiles/:userId/metrics", metricRoutes);
app.use("/api/profiles/:userId/steps", stepRoutes);
app.use("/api/profiles/:userId/calories", calorieRoutes);

app.use(errorHandler);

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Not Found" });
});

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
