import { spawnSync, spawn } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

// Deliberately local only. Never accepts a remote host or a production connection URL.
const psql = process.env.LOCAL_PSQL ?? 'C:/Program Files/PostgreSQL/17/bin/psql.exe';
const port = process.env.LOCAL_PG_PORT ?? '55459';
const user = process.env.LOCAL_PG_USER ?? 'expo_audit';
const db = `expo59_${Date.now()}`;
const args = (database) => ['-X','-h','127.0.0.1','-p',port,'-U',user,'-d',database,'-v','ON_ERROR_STOP=1','-A','-t'];
function sql(input, database = db) {
  const result = spawnSync(psql,args(database),{input,encoding:'utf8'});
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'psql failed');
  return result.stdout.trim();
}
const projectRoot = fileURLToPath(new URL('../..', import.meta.url));
function file(name) { return readFileSync(resolve(projectRoot, 'backend', name),'utf8'); }
function concurrent(input, database = db) {
  return new Promise((done) => {
    const child=spawn(psql,args(database)); let stdout='',stderr='';
    child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);
    child.on('error',error=>done({status:-1,stderr:error.message}));
    child.on('close',status=>done({status,stdout,stderr}));child.stdin.end(input);
  });
}
sql(`CREATE DATABASE ${db};`,'postgres');
try {
  // Roles are cluster-wide; the fixture remains unchanged on disk.
  sql(file('test/renewal036.fixture.sql').replace('CREATE ROLE authenticated NOLOGIN;',() => "DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;").replace('CREATE ROLE anon NOLOGIN;',() => "DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;"));
  sql(file('migrations/036_confirm_subscription_renewal_idempotent.sql'));
  console.log(sql(file('test/renewal036.assert.sql')).split('\n').at(-1));
  const jwt="SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);";
  const renewal=`${jwt} SELECT confirm_subscription_renewal_idempotent('concurrent-renewal-key','10000000-0000-0000-0000-000000000003',(now() AT TIME ZONE 'Europe/Istanbul')::date-1,(now() AT TIME ZONE 'Europe/Istanbul')::date+1,(now() AT TIME ZONE 'Europe/Istanbul')::date);`;
  const renewals = await Promise.all(Array.from({length:10},()=>concurrent(renewal)));
  assert(renewals.every(r=>r.status===0),JSON.stringify(renewals));
  assert.equal(sql("SELECT count(*) FROM payment_events WHERE subscription_id='10000000-0000-0000-0000-000000000003';"),'1');
  console.log('036 ten concurrent repeats committed once');
  // Remove the extra concurrency history so the unchanged sequential RLS fixture is exact.
  sql("DELETE FROM payment_events WHERE subscription_id='10000000-0000-0000-0000-000000000003';");
  sql(file('test/subscriptions038.fixture.sql'));
  sql(file('migrations/038_subscription_soft_delete.sql'));
  console.log(sql(file('test/subscriptions038.assert.sql')).split('\n').at(-1));
  const deletion=`${jwt} SELECT soft_delete_subscriptions_idempotent('concurrent-delete-key',ARRAY['10000000-0000-0000-0000-000000000003']::uuid[]);`;
  const deletes=await Promise.all(Array.from({length:10},()=>concurrent(deletion)));
  assert(deletes.every(r=>r.status===0),JSON.stringify(deletes));
  assert.equal(sql("SELECT count(*) FROM idempotency_keys WHERE idempotency_key='concurrent-delete-key';"),'1');
  console.log('038 ten concurrent deletes committed once');
  sql("INSERT INTO subscriptions(id,user_id,amount,currency,status,next_renewal_date) SELECT gen_random_uuid(),'00000000-0000-0000-0000-000000000004',1,'TRY','active',current_date FROM generate_series(1,999);");
  const insert="INSERT INTO subscriptions(id,user_id,amount,currency,status,next_renewal_date) VALUES(gen_random_uuid(),'00000000-0000-0000-0000-000000000004',1,'TRY','active',current_date);";
  const additions=await Promise.all(Array.from({length:10},()=>concurrent(insert)));
  assert.equal(additions.filter(r=>r.status===0).length,1,JSON.stringify(additions));
  assert.equal(sql("SELECT count(*) FROM subscriptions WHERE user_id='00000000-0000-0000-0000-000000000004' AND deleted_at IS NULL;"),'1000');
  console.log('038 quota: ten parallel inserts at 999 accepted exactly one');
  sql(file('migrations/039_profile_timezone_mode.sql'));
  assert.equal(sql("SELECT count(*) FROM profiles WHERE timezone_mode='fixed';"),'2');
  sql("INSERT INTO profiles(user_id,timezone) VALUES('00000000-0000-0000-0000-000000000005','UTC');");
  assert.equal(sql("SELECT timezone_mode FROM profiles WHERE user_id='00000000-0000-0000-0000-000000000005';"),'device');
  console.log('039 existing fixed / new device defaults passed');
  sql(file('test/profile039.assert.sql'));
  console.log('039 timezone-aware renewal validation passed');
  const deferredDb = `${db}_deferred`;
  sql(`CREATE DATABASE ${deferredDb};`, 'postgres');
  try {
    sql(file('test/deferred037.fixture.sql'), deferredDb);
    sql(file('migrations/037_record_deferred_payment_idempotent.sql'), deferredDb);
    const forwards = resolve(projectRoot, 'supabase/migrations');
    for (const name of readdirSync(forwards).filter(name => name.endsWith('_deferred_payment_serialization.sql')).sort()) {
      sql(readFileSync(resolve(forwards, name), 'utf8'), deferredDb);
    }
    console.log(sql(file('test/deferred037.assert.sql'), deferredDb).split('\n').at(-1));
    const deferred = `${jwt} SELECT record_deferred_payment_idempotent('parallel-deferred-key','10000000-0000-0000-0000-000000000001',10,'TRY','2026-10-22T09:00:00Z','2026-11-22');`;
    const repeats = await Promise.all(Array.from({length:10},()=>concurrent(deferred, deferredDb)));
    assert(repeats.every(result => result.status === 0), JSON.stringify(repeats));
    assert.equal(new Set(repeats.map(result => result.stdout.trim())).size, 1);
    assert.equal(sql("SELECT count(*) FROM idempotency_keys WHERE idempotency_key='parallel-deferred-key';", deferredDb), '1');
    console.log('037 forward fix: ten concurrent deferred repeats returned one result');
    sql(`CREATE FUNCTION fail_deferred_result() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.idempotency_key='rollback-deferred-key' THEN RAISE EXCEPTION 'injected result failure'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER fail_deferred_result BEFORE INSERT ON idempotency_keys FOR EACH ROW EXECUTE FUNCTION fail_deferred_result();
      ${jwt}
      DO $$ DECLARE before_count bigint; BEGIN
        SELECT count(*) INTO before_count FROM payment_events;
        BEGIN PERFORM record_deferred_payment_idempotent('rollback-deferred-key','10000000-0000-0000-0000-000000000001',11,'TRY','2026-10-22T09:00:00Z','2026-11-22');
          RAISE EXCEPTION 'expected failure did not occur' USING ERRCODE='P0004';
        EXCEPTION WHEN raise_exception THEN NULL; END;
        IF (SELECT count(*) FROM payment_events) <> before_count THEN RAISE EXCEPTION 'partial payment survived'; END IF;
      END $$;`, deferredDb);
    console.log('037 forward fix: result failure rolled back payment');
  } finally { sql(`DROP DATABASE ${deferredDb} WITH (FORCE);`, 'postgres'); }
} finally { sql(`DROP DATABASE ${db} WITH (FORCE);`,'postgres'); }
