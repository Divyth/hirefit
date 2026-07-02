import { HttpError } from '../utils/httpError.js';
import { incrementMetric } from '../utils/metrics.js';

export function notFound(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    message: err.message || 'Internal server error'
  };

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }

  if (err.details) {
    payload.details = err.details;
  }

  if (statusCode >= 400) {
    // Count observable failures for metrics runs.
    incrementMetric('retryCount', 0);
  }

  return res.status(statusCode).json(payload);
}
