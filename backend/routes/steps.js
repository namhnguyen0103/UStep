import express from "express";
import * as store from "../data/store.js";
import { validate } from "../utils/helpers.js";
import {
  createStepValidation,
  listStepsValidation,
} from "../validators/stepsValidators.js";

// needed to allow /profiles/:userId/steps
const router = express.Router({ mergeParams: true });

// GET /profiles/:userId/steps - this endpoint is used to list daily steps
router.get("/", validate(listStepsValidation), (req, res, next) => {
  try {
    const { userId } = req.params;
    const { start, end } = req.query;

    if (!store.profileExistsById(userId)) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }

    const steps = store.findStepsByUserAndDateRange(userId, start, end);
    res.status(200).json(steps);
  } catch (err) {
    next(err);
  }
});

// POST /profiles/:userId/steps - this endpoint is used to record or update daily steps
router.post("/", validate(createStepValidation), (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!store.profileExistsById(userId)) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }

    const { date, steps } = req.body;
    const record = store.upsertSteps(userId, { date, steps });
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
});

// DELETE /profiles/:userId/steps/:stepId - this endpoint is used to delete a step record
router.delete("/:stepId", (req, res, next) => {
  try {
    const { userId, stepId } = req.params;

    if (!store.profileExistsById(userId)) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }

    const step = store.findStepById(stepId);

    if (!step) {
      return res
        .status(404)
        .json({ success: false, message: "Step record not found" });
    }

    if (step.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this step record",
      });
    }

    const deleted = store.removeStepById(stepId);

    if (deleted) {
      return res
        .status(200)
        .json({ success: true, message: "Step record deleted successfully" });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete step record" });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
