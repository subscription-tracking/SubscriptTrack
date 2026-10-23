import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const psql = process.env.LOCAL_PSQL;
const port = process.env.LOCAL_PG_PORT;
if (!psql || !port || !/^\d+$/.test(port)) throw new Error('Use npm run test:schema (disposable local cluster)');
const db = `schema_${Date.now()}`;
function sql(input, database = db) {
  const result = spawnSync(psql, ['-X','-w','-h','127.0.0.1','-p',port,'-U','expo_audit','-d',database,'-v','ON_ERROR_STOP=1','-A','-t'], { input, encoding:'utf8', windowsHide:true });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'schema acceptance failed');
  return result.stdout.trim();
}
sql(`CREATE DATABASE ${db};`, 'postgres');
try {
  // Auth is a platform prerequisite. This shim only supplies its table and uid(),
  // not a fake claim that GoTrue/Storage/Realtime have been tested locally.
  sql(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA auth,public TO anon,authenticated,service_role;
    GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated,service_role;`);
  sql(`CREATE SCHEMA storage; CREATE TABLE storage.objects(bucket_id text NOT NULL,name text PRIMARY KEY);
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
      SELECT (string_to_array($1,'/'))[1:greatest(array_length(string_to_array($1,'/'),1)-1,0)] $$;
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA storage TO anon,authenticated,service_role;
    GRANT SELECT,INSERT ON storage.objects TO authenticated;`);
  sql(readFileSync(new URL('../schema/public-baseline.sql', import.meta.url), 'utf8'));
  const forwards = new URL('../../supabase/migrations/', import.meta.url);
  for (const name of readdirSync(forwards).filter(name => name.endsWith('.sql')).sort()) sql(readFileSync(new URL(name, forwards), 'utf8'));
  assert.equal(sql("SELECT count(*) FROM pg_tables WHERE schemaname='public';"), '15');
  assert.equal(sql("SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity;"), '0');
  sql('SELECT id,website,is_archived,deleted_at FROM subscriptions LIMIT 0; SELECT timezone,timezone_mode FROM profiles LIMIT 0;');
  console.log('PASS empty database: complete public baseline and forward migrations');
  sql("INSERT INTO auth.users(id) VALUES ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');");
  assert.equal(sql('SELECT count(*) FROM profiles;'), '2');
  const a = "SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);";
  const b = "SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);";
  sql(`${a} SELECT create_subscription_idempotent('baseline-create-key','Audit',49.90,'TRY','monthly',current_date,current_date,'software',NULL,NULL,NULL,NULL);`);
  assert.equal(sql(`${b} SELECT count(*) FROM subscriptions;`).split('\n').at(-1), '0');
  assert.equal(sql(`${a} SELECT count(*) FROM subscriptions;`).split('\n').at(-1), '1');
  const id = sql("SELECT id FROM subscriptions WHERE name='Audit';");
  const refusal = spawnSync(psql, ['-X','-w','-h','127.0.0.1','-p',port,'-U','expo_audit','-d',db,'-v','ON_ERROR_STOP=1'], {
    input: `${b} SELECT record_payment_idempotent('foreign-payment-key','${id}',49.90,'TRY',now());`, encoding:'utf8', windowsHide:true,
  });
  assert.notEqual(refusal.status, 0);
  assert.equal(sql('SELECT count(*) FROM payment_events;'), '0');
  sql(`${a} SELECT soft_delete_subscriptions_idempotent('baseline-delete-key',ARRAY['${id}']::uuid[]);`);
  assert.equal(sql(`${a} SELECT count(*) FROM subscriptions;`).split('\n').at(-1), '0');
  console.log('PASS full public schema: auth profile trigger, owner read, foreign payment rejection, soft-delete visibility');
  sql(`${a} INSERT INTO storage.objects VALUES ('exports','00000000-0000-0000-0000-000000000001/before.csv');`);
  assert.equal(sql(`${b} SELECT count(*) FROM storage.objects;`).split('\n').at(-1),'0');
  sql("DELETE FROM auth.users WHERE id='00000000-0000-0000-0000-000000000001';");
  assert.equal(sql(`${a} SELECT count(*) FROM storage.objects;`).split('\n').at(-1),'0');
  sql(`${a} DO $$ BEGIN
    BEGIN INSERT INTO storage.objects VALUES ('exports','00000000-0000-0000-0000-000000000001/after.csv');
      RAISE EXCEPTION 'deleted owner inserted Storage object' USING ERRCODE='P0004';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  END $$;`);
  console.log('PASS Storage policies: owner allowed, foreign account hidden, deleted-owner JWT cannot read or insert');
} finally { sql(`DROP DATABASE ${db} WITH (FORCE);`, 'postgres'); }
