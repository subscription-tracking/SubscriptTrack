import { query } from '../config/db.js';

const INTERVAL_MS = 60 * 60 * 1000; // run hourly
const LOOKAHEAD_DAYS = 7;

// Notification types produced by this worker.
const TYPE = {
  TODAY: 'renewal_today',
  SOON: 'renewal_soon',     // 1–3 days
  UPCOMING: 'renewal_upcoming', // 4–7 days
};

function typeForDays(days) {
  if (days === 0) return TYPE.TODAY;
  if (days <= 3) return TYPE.SOON;
  return TYPE.UPCOMING;
}

async function run() {
  try {
    // Fetch upcoming renewal occurrences within the lookahead window.
    const { rows: occurrences } = await query(
      `SELECT
         ro.id            AS occurrence_id,
         ro.user_id,
         ro.subscription_id,
         ro.scheduled_at,
         ro.expected_amount,
         ro.currency,
         s.name           AS subscription_name,
         (ro.scheduled_at::date - CURRENT_DATE) AS days_until
       FROM renewal_occurrences ro
       JOIN subscriptions s ON s.id = ro.subscription_id
       WHERE ro.status = 'pending'
         AND ro.scheduled_at::date BETWEEN CURRENT_DATE
             AND (CURRENT_DATE + $1 * INTERVAL '1 day')
         AND s.status = 'active'`,
      [LOOKAHEAD_DAYS],
    );

    if (occurrences.length === 0) return;

    for (const occ of occurrences) {
      const days = Number(occ.days_until);
      const type = typeForDays(days);

      // Dedup: one notification per (occurrence_id, type).
      const { rowCount: existing } = await query(
        `SELECT 1 FROM notifications
         WHERE occurrence_id = $1 AND type = $2
         LIMIT 1`,
        [occ.occurrence_id, type],
      );
      if (existing > 0) continue;

      const titleKey = type;
      const bodyParams = {
        name: occ.subscription_name,
        days,
        amount: occ.expected_amount,
        currency: occ.currency,
      };
      const deepLink = `/subscriptions/${occ.subscription_id}`;

      await query(
        `INSERT INTO notifications
           (id, user_id, subscription_id, occurrence_id, type,
            title_key, body_params, deep_link, created_at)
         VALUES
           (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          occ.user_id,
          occ.subscription_id,
          occ.occurrence_id,
          type,
          titleKey,
          JSON.stringify(bodyParams),
          deepLink,
        ],
      );
    }

    console.log(
      JSON.stringify({
        level: 'info',
        event: 'notification_worker_run',
        processed: occurrences.length,
      }),
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'notification_worker_error',
        message: err.message,
      }),
    );
  }
}

export function startNotificationWorker() {
  // Run once immediately on startup, then on the interval.
  void run();
  return setInterval(() => void run(), INTERVAL_MS);
}
