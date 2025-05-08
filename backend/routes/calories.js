import express from 'express';
import * as store from '../data/store.js';
import { validate } from '../utils/helpers.js';
import {
  createCalorieValidation,
  listCaloriesValidation,
} from '../validators/caloriesValidators.js';

// needed to allow /profiles/:userId/calories
const router = express.Router({ mergeParams: true });

// GET /profiles/:userId/calories - this endpoint is used to list daily calories
router.get('/', validate(listCaloriesValidation), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { start, end } = req.query;

    if (!(await store.profileExistsById(userId))) {
      return res
        .status(404)
        .json({ success: false, message: 'User profile not found' });
    }

    const calories = await store.findCaloriesByUserAndDateRange(
      userId,
      start,
      end,
    );
    res.status(200).json(calories);
  } catch (err) {
    next(err);
  }
});

// POST /profiles/:userId/calories - this endpoint is used to record or update daily calories
router.post('/', validate(createCalorieValidation), async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!(await store.profileExistsById(userId))) {
      return res
        .status(404)
        .json({ success: false, message: 'User profile not found' });
    }

    const { date, calories } = req.body;
    const record = await store.upsertCalories(userId, { date, calories });
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// DELETE /profiles/:userId/calories/:calorieId - this endpoint is used to delete a calorie record
router.delete('/:calorieId', async (req, res, next) => {
  try {
    const { userId, calorieId } = req.params;

    if (!store.profileExistsById(userId)) {
      return res
        .status(404)
        .json({ success: false, message: 'User profile not found' });
    }

    const calorie = await store.findCalorieById(calorieId);

    if (!calorie) {
      return res
        .status(404)
        .json({ success: false, message: 'Calorie record not found' });
    }

    if (calorie.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this step record',
      });
    }

    const deleted = await store.removeCalorieById(calorieId);

    if (deleted) {
      return res.status(200).json({
        success: true,
        message: 'Calorie record deleted successfully',
      });
    } else {
      return res
        .status(500)
        .json({ success: false, message: 'Failed to delete calorie record' });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
