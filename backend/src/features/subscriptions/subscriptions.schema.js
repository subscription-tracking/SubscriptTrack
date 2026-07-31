import { z } from 'zod';

export const BILLING_CYCLES = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM'];
export const STATUSES = ['TRIAL', 'ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'ARCHIVED'];
export const CANCEL_REASONS = ['NOT_USED', 'TOO_EXPENSIVE', 'FOUND_ALTERNATIVE', 'TEMPORARY', 'OTHER'];

export const CreateSubscriptionSchema = z.object({
  serviceId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(160),
  categoryCode: z.string().min(1).max(32),
  amount: z.string().regex(/^\d+(\.\d{1,4})?$/),
  currency: z.string().length(3),
  billingCycle: z.enum(BILLING_CYCLES),
  intervalCount: z.number().int().min(1).optional(),
  nextRenewalAt: z.string().datetime(),
  timezone: z.string().max(64),
  status: z.enum(['TRIAL', 'ACTIVE']).default('ACTIVE'),
  trialEndAt: z.string().datetime().optional().nullable(),
  regularAmount: z.string().regex(/^\d+(\.\d{1,4})?$/).optional().nullable(),
  notifyDays: z.number().int().min(0).max(30).optional(),
  websiteUrl: z.string().url().optional().nullable(),
  accountUrl: z.string().url().optional().nullable(),
  cancellationUrl: z.string().url().optional().nullable(),
  paymentMethodLabel: z.string().max(80).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
});

export const PatchSubscriptionSchema = CreateSubscriptionSchema.partial().omit({ status: true });

export const PauseSchema = z.object({
  effectiveAt: z.string().datetime(),
});

export const CancelSchema = z.object({
  cancelledAt: z.string().datetime(),
  accessEndsAt: z.string().datetime().optional().nullable(),
  reason: z.enum(CANCEL_REASONS).optional(),
});
