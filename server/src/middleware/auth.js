import { HttpError } from '../utils/httpError.js';
import { verifyToken } from '../utils/jwt.js';

export function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new HttpError(401, 'Authentication required'));
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return next(new HttpError(401, 'Invalid or expired token'));
  }
}
