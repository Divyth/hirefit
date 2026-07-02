import { validationResult } from 'express-validator';
import { HttpError } from '../utils/httpError.js';

export function validateRequest(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError(400, 'Validation failed', errors.array()));
  }
  return next();
}
