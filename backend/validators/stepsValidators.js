import { body, param, query } from 'express-validator';

export const createStepValidation = [
  body('date')
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('steps')
    .isInt({ min: 0 })
    .toInt()
    .withMessage('Steps must be a non-negative integer'),
];

export const listStepsValidation = [
  param('userId')
    .isUUID()
    .withMessage('Valid Profile ID (UUID) is required in URL'),
  query('start')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Start date must be in YYYY-MM-DD format'),
  query('end')
    .optional()
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('End date must be in YYYY-MM-DD format')
    .custom((value, { req }) => !req.query.start || value >= req.query.start)
    .withMessage('End date must be after or same as start date'),
];
