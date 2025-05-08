// @ts-ignore
import express from 'express';
import * as store from '../data/store.js';
import { validate } from '../utils/helpers.js';
import {
  createStepValidation,
  listStepsValidation,
} from '../validators/stepsValidators.js';

function getBestStreak(entries) {
  if (!entries || entries.length === 0) return 0;
  // Reverse to chronological (oldest → newest)
  const sorted = [...entries].reverse().map(e => ({
    date: new Date(e.date),
    steps: e.steps,
  }));
  let bestStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].date;
    const curr = sorted[i].date;
    // @ts-ignore
    const daysDiff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (daysDiff === 1) {
      currentStreak++;
    } else {
      bestStreak = Math.max(bestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  return Math.max(bestStreak, currentStreak);
}

// needed to allow /profiles/:userId/steps
const router = express.Router({ mergeParams: true });

// GET /profiles/:userId/steps - this endpoint is used to list daily steps
// GET /profiles/:userId/steps
router.get('/', validate(listStepsValidation), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { start, end } = req.query;

    if (!(await store.profileExistsById(userId))) {
      return res
        .status(404)
        .json({ success: false, message: 'User profile not found' });
    }

    // 1) load the raw entries
    const steps = await store.findStepsByUserAndDateRange(userId, start, end);

    // 2) compute the all‐time record
    const record = steps.reduce((max, e) => Math.max(max, e.steps), 0);

    // 3) compute the longest consecutive‐day streak
    const bestStreak = getBestStreak(steps);

    // 4) send back everything
    res.status(200).json({
      entries: steps,
      record,
      bestStreak,
    });
  } catch (err) {
    next(err);
  }
});


// POST /profiles/:userId/steps - this endpoint is used to record or update daily steps
router.post('/', validate(createStepValidation), async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!(await store.profileExistsById(userId))) {
      return res
        .status(404)
        .json({ success: false, message: 'User profile not found' });
    }

    const { date, steps } = req.body;
    const record = await store.upsertSteps(userId, { date, steps });
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// DELETE /profiles/:userId/steps/:stepId - this endpoint is used to delete a step record
router.delete('/:stepId', async (req, res, next) => {
  try {
    const { userId, stepId } = req.params;

    if (!(await store.profileExistsById(userId))) {
      return res
        .status(404)
        .json({ success: false, message: 'User profile not found' });
    }

    const step = await store.findStepById(stepId);

    if (!step) {
      return res
        .status(404)
        .json({ success: false, message: 'Step record not found' });
    }

    if (step.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this step record',
      });
    }

    const deleted = await store.removeStepById(stepId);

    if (deleted) {
      return res
        .status(200)
        .json({ success: true, message: 'Step record deleted successfully' });
    } else {
      return res
        .status(500)
        .json({ success: false, message: 'Failed to delete step record' });
    }
  } catch (err) {
    next(err);
  }
});

router.put(
  '/:stepId',
  validate(createStepValidation),
  async (req, res, next) => {
    try {
      const { userId, stepId } = req.params;
      if (!(await store.profileExistsById(userId))) {
        return res
          .status(404)
          .json({ success: false, message: 'User profile not found' });
      }
      const existing = await store.findStepById(stepId);
      if (!existing) {
        return res
          .status(404)
          .json({ success: false, message: 'Step record not found' });
      }
      if (existing.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this step record',
        });
      }
      const updated = await store.updateStepById(stepId, {
        date: req.body.date,
        steps: req.body.steps,
      });
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: 'Step record not found' });
      }
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
