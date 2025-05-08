import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import pinoHttp from 'pino-http';

dotenv.config();

import mainRouter, {
  metricRoutes,
  stepRoutes,
  calorieRoutes,
  leaderboardRoutes,
} from './routes/index.js';
import { errorHandler } from './utils/helpers.js';
import { initDatabase } from './data/config/init.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Move these to the top with other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*', // allow all origins
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
}));

// @ts-ignore
const logger = pinoHttp({
  customProps: (req, res) => ({ context: 'HTTP' }),
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
        target: 'pino-pretty',
        options: { singleLine: true },
      }
      : undefined,
  level: process.env.LOG_LEVEL || 'info',
});
app.use(logger);

// Register all routes
app.use('/api', mainRouter);
app.use('/api/profiles/:userId/metrics', metricRoutes);
app.use('/api/profiles/:userId/steps', stepRoutes);
app.use('/api/profiles/:userId/calories', calorieRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Error handlers should be last
app.use(errorHandler);
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Not Found' });
});

const server = http.createServer(app);

const startServer = async () => {
  try {
    await initDatabase();
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1); // Exit if DB initialization fails
  }
};

startServer();
