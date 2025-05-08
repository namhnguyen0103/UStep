import { param, query } from 'express-validator';

export const userIdParamValidation = [
    param('userId')
        .isUUID()
        .withMessage('Valid userId (UUID) is required in URL'),
];

export const dateRangeValidation = [
    query('startDate')
        .isISO8601()
        .withMessage('Valid startDate (ISO8601) is required'),
    query('endDate')
        .isISO8601()
        .withMessage('Valid endDate (ISO8601) is required')
        .custom((value, { req }) => {
            if (new Date(value) < new Date(req.query.startDate)) {
                throw new Error('endDate must be after startDate');
            }
            return true;
        }),
]; 