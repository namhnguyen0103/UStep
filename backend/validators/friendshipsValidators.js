import { body, param } from 'express-validator';

export const createFriendshipValidation = [
  body('userId').isUUID().withMessage('Valid userId (UUID) is required'),
  body('friendId')
    .isUUID()
    .withMessage('Valid friendId (UUID) is required')
    .custom((value, { req }) => value !== req.body.userId)
    .withMessage('Cannot friend yourself'),
];

export const userIdParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid Profile ID (UUID) is required in URL'),
];

export const friendshipIdParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid Friendship Record ID (UUID) is required in URL'),
];
