import express from 'express';
import profileRoutes from './profiles.js';
import friendshipRoutes from './friendships.js';
import metricRoutes from './metrics.js';
import stepRoutes from './steps.js';
import deviceRoutes from './devices.js';
import calorieRoutes from './calories.js';
import leaderboardRoutes from './leaderboard.js';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Ustep Express API is running!' });
});

router.use('/profiles', profileRoutes);
router.use('/friendships', friendshipRoutes);
router.use('/metrics', metricRoutes);
router.use('/steps', stepRoutes);
router.use('/devices', deviceRoutes);
router.use('/calories', calorieRoutes);
router.use('/leaderboard', leaderboardRoutes);

export default router;
export { metricRoutes, stepRoutes, deviceRoutes, calorieRoutes, leaderboardRoutes };
