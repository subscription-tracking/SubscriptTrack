import 'dotenv/config';

export const env = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

const required = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}
