import { body, param, query } from 'express-validator';

export const createProfileValidation = [
  body('first_name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('last_name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
];

export const profileIdParamValidation = [
  param('id').isUUID().withMessage('Valid Profile ID (UUID) is required'),
];

export const searchQueryValidation = [
  query('query')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Search query is required'),
];
