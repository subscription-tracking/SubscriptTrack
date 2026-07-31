import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { Errors } from '../lib/errors.js';

const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return next(Errors.unauthorized());
    }

    const token = authHeader.slice(7);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return next(Errors.unauthorized());
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email;
    next();
  } catch {
    next(Errors.unauthorized());
  }
}
