import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { nowMs, recordMetric, snapshotMetrics } from './utils/metrics.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: false
    })
  );
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 }));
  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    const start = nowMs();
    res.on('finish', () => {
      recordMetric('requestMs', nowMs() - start);
    });
    next();
  });

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/metrics', (_req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: 'Not found' });
    }
    return res.json(snapshotMetrics());
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/resume', resumeRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/ai', aiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
