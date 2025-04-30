import { body, param } from 'express-validator';

export const createRequestValidation = [
  body('addresseeId')
    .isUUID()
    .withMessage('Valid addresseeId (UUID) is required'),
];

export const userIdParamValidation = [
  param('userId')
    .isUUID()
    .withMessage('Valid Profile ID (UUID) is required in URL'),
];

export const requestIdParamValidation = [
  param('requestId')
    .isUUID()
    .withMessage('Valid Friend Request ID (UUID) is required in URL'),
];
