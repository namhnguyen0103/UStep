import { body, param, query } from 'express-validator';

export const createMetricValidation = [
  body('metricType')
    .isIn(['weight', 'height'])
    .withMessage('Invalid metric type. Must be "weight" or "height"'),
  body('value')
    .isNumeric()
    .toFloat()
    .withMessage('Metric value must be a number'),
];

export const listMetricsValidation = [
  param('userId')
    .isUUID()
    .withMessage('Valid Profile ID (UUID) is required in URL'),
  query('type')
    .optional()
    .isIn(['weight', 'height'])
    .withMessage('Invalid metric type filter'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be an integer between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .toInt()
    .withMessage('Offset must be a non-negative integer'),
];
