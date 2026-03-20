import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import patientRoutes from './routes/patients';
import sessionRoutes from './routes/sessions';
import scheduleRoutes from './routes/schedule';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // Routes
  app.use('/api/patients', patientRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use('/api/schedule', scheduleRoutes);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}
