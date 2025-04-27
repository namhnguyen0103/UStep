import express from "express";
import * as store from "../data/store.js";
import { validate } from "../utils/helpers.js";
import {
  createMetricValidation,
  listMetricsValidation,
} from "../validators/metricsValidators.js";

// needed to allow /profiles/:userId/metrics
const router = express.Router({ mergeParams: true });

// GET /profiles/:userId/metrics - this endpoint is used to list metrics for a user
router.get("/", validate(listMetricsValidation), (req, res, next) => {
  try {
    const { userId } = req.params;
    const { type, limit, offset } = req.query;

    if (!store.profileExistsById(userId)) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }

    const metrics = store.findMetricsByUserId(userId, {
      metricType: type,
      limit: limit,
      offset: offset,
    });
    res.status(200).json(metrics);
  } catch (err) {
    next(err);
  }
});

// POST /profiles/:userId/metrics - this endpoint is used to record a new metric
router.post("/", validate(createMetricValidation), (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!store.profileExistsById(userId)) {
      return res
        .status(404)
        .json({ success: false, message: "User profile not found" });
    }

    const { metricType, value } = req.body;
    const newMetric = store.addMetric(userId, { metricType, value });
    res.status(201).json(newMetric);
  } catch (err) {
    next(err);
  }
});

// DELETE /profiles/:userId/metrics/:id - this endpoint is used to delete a metric by id
router.delete("/:id", (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = store.removeMetricById(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Metric not found" });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;

router.put(
  "/:id",
  validate(createMetricValidation),
  (req, res, next) => {
    try {
      const { userId, id } = req.params;
      if (!store.profileExistsById(userId)) {
        return res.status(404).json({ success: false, message: "User profile not found" });
      }
      const updated = store.updateMetricById(id, {
        metricType: req.body.metricType,
        value: req.body.value
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: "Metric not found" });
      }
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

