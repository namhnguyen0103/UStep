import { body, param } from 'express-validator';

export const createDeviceValidation = [
  body('deviceName').notEmpty().withMessage('Device name is required'),
  body('deviceType').notEmpty().withMessage('Device type is required'),
];

export const listDevicesValidation = [
  param('userId')
    .isUUID()
    .withMessage('Valid Profile ID (UUID) is required in URL'),
];

export const deleteDeviceValidation = [
  param('userId')
    .isUUID()
    .withMessage('Valid Profile ID (UUID) is required in URL'),
  param('deviceId')
    .isUUID()
    .withMessage('Valid Device ID (UUID) is required in URL'),
];
