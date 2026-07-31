import { Router } from 'express';
import { idempotency } from '../../middleware/idempotency.js';
import { Errors } from '../../lib/errors.js';
import {
  CreateSubscriptionSchema,
  PatchSubscriptionSchema,
  PauseSchema,
  CancelSchema,
} from './subscriptions.schema.js';
import {
  listSubscriptions,
  getSubscription,
  createSubscription,
  patchSubscription,
  changeStatus,
  deleteSubscription,
} from './subscriptions.service.js';

const router = Router();

// GET /subscriptions
router.get('/', async (req, res, next) => {
  try {
    const result = await listSubscriptions(req.userId, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /subscriptions
router.post('/', idempotency, async (req, res, next) => {
  try {
    const parsed = CreateSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) return next(Errors.validation('Geçersiz abonelik verisi.', parsed.error.errors));
    const sub = await createSubscription(req.userId, parsed.data);
    res.status(201).json(sub);
  } catch (err) {
    next(err);
  }
});

// GET /subscriptions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const sub = await getSubscription(req.params.id, req.userId);
    res.json(sub);
  } catch (err) {
    next(err);
  }
});

// PATCH /subscriptions/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const parsed = PatchSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) return next(Errors.validation('Geçersiz abonelik verisi.', parsed.error.errors));
    const sub = await patchSubscription(req.params.id, req.userId, parsed.data);
    res.json(sub);
  } catch (err) {
    next(err);
  }
});

// POST /subscriptions/:id/pause
router.post('/:id/pause', async (req, res, next) => {
  try {
    const parsed = PauseSchema.safeParse(req.body);
    if (!parsed.success) return next(Errors.validation('Geçersiz veri.', parsed.error.errors));
    const sub = await changeStatus(req.params.id, req.userId, 'PAUSED', parsed.data);
    res.json(sub);
  } catch (err) {
    next(err);
  }
});

// POST /subscriptions/:id/resume
router.post('/:id/resume', async (req, res, next) => {
  try {
    const sub = await changeStatus(req.params.id, req.userId, 'ACTIVE');
    res.json(sub);
  } catch (err) {
    next(err);
  }
});

// POST /subscriptions/:id/cancel
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const parsed = CancelSchema.safeParse(req.body);
    if (!parsed.success) return next(Errors.validation('Geçersiz veri.', parsed.error.errors));
    const sub = await changeStatus(req.params.id, req.userId, 'CANCELLED', parsed.data);
    res.json(sub);
  } catch (err) {
    next(err);
  }
});

// POST /subscriptions/:id/archive
router.post('/:id/archive', async (req, res, next) => {
  try {
    const sub = await changeStatus(req.params.id, req.userId, 'ARCHIVED');
    res.json(sub);
  } catch (err) {
    next(err);
  }
});

// POST /subscriptions/:id/restore
router.post('/:id/restore', async (req, res, next) => {
  try {
    const sub = await changeStatus(req.params.id, req.userId, 'ACTIVE');
    res.json(sub);
  } catch (err) {
    next(err);
  }
});

// DELETE /subscriptions/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await deleteSubscription(req.params.id, req.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
