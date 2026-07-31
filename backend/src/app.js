import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { requestIdMiddleware } from './middleware/requestId.js';
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
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(requestIdMiddleware);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

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
