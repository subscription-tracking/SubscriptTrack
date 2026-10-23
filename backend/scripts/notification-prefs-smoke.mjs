/** Temporary profile notification preference round-trip on the test account. */
const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_ANON_KEY;
const email = process.env.S31_TEST_EMAIL;
const password = process.env.S31_TEST_PASSWORD;
if (!base || !key || !email || !password) throw new Error('Test account configuration is required.');
if (process.env.S31_SMOKE_CONFIRM !== 'run') throw new Error('Refusing remote mutation without S31_SMOKE_CONFIRM=run.');

async function request(path, token, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token ?? key}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json', Prefer: 'return=representation' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(`${method} returned HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}

const session = await request('/auth/v1/token?grant_type=password', null, 'POST', { email, password });
const token = session.access_token;
const userId = session.user?.id;
if (!token || !userId) throw new Error('Test account login failed.');
const path = `/rest/v1/profiles?user_id=eq.${encodeURIComponent(userId)}`;
const rows = await request(`${path}&select=user_id,push_enabled,default_notify_days`, token);
if (!Array.isArray(rows) || rows.length !== 1 || rows[0].user_id !== userId) throw new Error('Test profile missing.');
const original = { push_enabled: rows[0].push_enabled, default_notify_days: rows[0].default_notify_days };
const next = {
  push_enabled: original.push_enabled !== true,
  default_notify_days: original.default_notify_days === 3 ? 7 : 3,
};
let changed = false;
try {
  const updated = await request(path, token, 'PATCH', next);
  changed = true;
  if (!Array.isArray(updated) || updated.length !== 1) throw new Error('Profile preference update failed.');
  const readback = await request(`${path}&select=push_enabled,default_notify_days`, token);
  if (readback[0]?.push_enabled !== next.push_enabled || readback[0]?.default_notify_days !== next.default_notify_days) {
    throw new Error('Profile preference readback mismatch.');
  }
  console.log('PASS notification-profile-write-read');
} finally {
  if (changed) {
    const restored = await request(path, token, 'PATCH', original);
    if (!Array.isArray(restored) || restored.length !== 1 || restored[0].push_enabled !== original.push_enabled || restored[0].default_notify_days !== original.default_notify_days) {
      throw new Error('Profile preference restore failed.');
    }
    console.log('PASS notification-profile-restore');
  }
}

const user = await request('/auth/v1/user', token);
const originalHour = user.user_metadata?.reminder_hour;
if (Number.isInteger(originalHour) && originalHour >= 0 && originalHour <= 23) {
  const nextHour = (originalHour + 1) % 24;
  let changedHour = false;
  try {
    const updated = await request('/auth/v1/user', token, 'PUT', { data: { reminder_hour: nextHour } });
    changedHour = true;
    if (updated.user_metadata?.reminder_hour !== nextHour) throw new Error('Reminder hour update failed.');
    const readback = await request('/auth/v1/user', token);
    if (readback.user_metadata?.reminder_hour !== nextHour) throw new Error('Reminder hour readback mismatch.');
    console.log('PASS notification-hour-write-read');
  } finally {
    if (changedHour) {
      const restored = await request('/auth/v1/user', token, 'PUT', { data: { reminder_hour: originalHour } });
      if (restored.user_metadata?.reminder_hour !== originalHour) throw new Error('Reminder hour restore failed.');
      console.log('PASS notification-hour-restore');
    }
  }
} else {
  console.log('SKIP notification-hour-roundtrip: no preexisting hour to restore');
}
