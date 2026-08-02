import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { pool } from './config/db.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

import meRoutes from './features/me/me.routes.js';
import catalogRoutes from './features/catalog/catalog.routes.js';
import subscriptionRoutes from './features/subscriptions/subscriptions.routes.js';
import dashboardRoutes from './features/dashboard/dashboard.routes.js';
import calendarRoutes from './features/calendar/calendar.routes.js';
import notificationRoutes from './features/notifications/notifications.routes.js';
import savingsRoutes from './features/savings/savings.routes.js';
import exportsRoutes from './features/exports/exports.routes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Native mobile requests do not send Origin. Browser requests must be an
    // explicitly configured first-party origin.
    if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(requestIdMiddleware);
app.use(requestLogger);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not_ready' });
  }
});

const api = express.Router();
api.use(authenticate);

api.use('/me', meRoutes);
api.use('/', catalogRoutes);
api.use('/subscriptions', subscriptionRoutes);
api.use('/dashboard', dashboardRoutes);
api.use('/calendar', calendarRoutes);
api.use('/notifications', notificationRoutes);
api.use('/savings', savingsRoutes);
api.use('/exports', exportsRoutes);

app.use('/api/v1', api);

app.use(errorHandler);

export default app;
