import express from 'express';
import * as store from '../data/store.js';
import { validate } from '../utils/helpers.js';
import { userIdParamValidation, dateRangeValidation } from '../validators/leaderboardValidators.js';

const router = express.Router();

// GET /leaderboard/:userId - Get weekly leaderboard for user and their friends
router.get('/:userId', validate(userIdParamValidation), async (req, res, next) => {
    console.log('Leaderboard route hit:', req.params);
    try {
        const { userId } = req.params;
        console.log('Processing leaderboard for userId:', userId);

        // Validate user exists
        if (!(await store.profileExistsById(userId))) {
            console.log('User not found:', userId);
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        // Calculate date range for current week (Sunday to Saturday)
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay()); // Set to Sunday
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Set to Saturday
        endDate.setHours(23, 59, 59, 999);

        console.log('Date range:', {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        // Get leaderboard data
        const leaderboardData = await store.getLeaderboardData(
            userId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );

        console.log('Leaderboard data retrieved:', leaderboardData);

        res.status(200).json({
            success: true,
            data: leaderboardData
        });
    } catch (err) {
        console.error('Error in leaderboard route:', err);
        next(err);
    }
});

// GET /leaderboard/:userId/custom - Get leaderboard for custom date range
router.get('/:userId/custom',
    validate(userIdParamValidation),
    validate(dateRangeValidation),
    async (req, res, next) => {
        console.log('Custom leaderboard route hit:', { params: req.params, query: req.query });
        try {
            const { userId } = req.params;
            const { startDate, endDate } = req.query;
            console.log('Processing custom leaderboard:', { userId, startDate, endDate });

            if (!(await store.profileExistsById(userId))) {
                console.log('User not found:', userId);
                return res.status(404).json({
                    success: false,
                    message: 'User profile not found'
                });
            }

            const leaderboardData = await store.getLeaderboardData(
                userId,
                startDate,
                endDate
            );

            console.log('Custom leaderboard data retrieved:', leaderboardData);

            res.status(200).json({
                success: true,
                data: leaderboardData
            });
        } catch (err) {
            console.error('Error in custom leaderboard route:', err);
            next(err);
        }
    }
);

export default router; 