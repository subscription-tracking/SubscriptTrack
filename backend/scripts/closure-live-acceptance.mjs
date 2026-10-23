import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../../expo/package.json', import.meta.url));
const { createClient } = require('@supabase/supabase-js');

// Explicitly destructive acceptance, only on separately provisioned disposable users.
// Never use the regular S31 account. Provisioning is separate from Auth email acceptance.
if (process.env.CLOSURE_LIVE_CONFIRM !== 'disposable-accounts-only') throw new Error('Explicit disposable-account confirmation required');
const fixturePath = process.env.CLOSURE_ACCOUNTS_FILE;
if (!fixturePath) throw new Error('CLOSURE_ACCOUNTS_FILE required');
const accounts = JSON.parse(readFileSync(fixturePath, 'utf8'));
assert.deepEqual(accounts.map(a => a.label), ['A','B','DELETE']);
assert.equal(new Set(accounts.map(a => a.id)).size, 3);
assert(accounts.every(a => /^closure-[a-z]+-[a-f0-9-]+@example\.invalid$/.test(a.email)));
const base = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!base || !key) throw new Error('Publishable configuration required');
const evidence = { generatedAt: new Date().toISOString(), results: [], limitation: 'Seeded disposable users; does not test email delivery, physical devices or iOS.' };
function pass(name) { evidence.results.push({ name, status: 'PASS' }); console.log(`PASS ${name}`); }
async function request(path, account, { method = 'GET', body, expected = [200], raw = false, contentType } = {}) {
  const response = await fetch(base + path, {
    method, signal: AbortSignal.timeout(20000),
    headers: { apikey:key, Authorization:`Bearer ${account?.token ?? key}`, ...(body !== undefined ? {'Content-Type':contentType ?? 'application/json'} : {}) },
    ...(body !== undefined ? { body: contentType ? body : JSON.stringify(body) } : {}),
  });
  if (!expected.includes(response.status)) throw new Error(`${method} ${path.split('?')[0]} HTTP ${response.status}`);
  if (raw) return response.text();
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
const rpc = (name, account, body, expected) => request(`/rest/v1/rpc/${name}`, account, { method:'POST', body, ...(expected ? {expected} : {}) });
const today = new Date().toISOString().slice(0,10);
const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10);
const marker = randomUUID();
let expiryChecked = false;
async function create(account, name) {
  return rpc('create_subscription_idempotent', account, {
    p_idempotency_key: `closure-create-${randomUUID()}`, p_name:name, p_amount:'49.90', p_currency:'TRY',
    p_billing_cycle:'monthly', p_start_date:today, p_next_renewal_date:today, p_category:'software',
    p_notes:`closure-fixture-${marker}`, p_payment_method:null, p_trial_end_date:null, p_trial_price_after:null,
  });
}
async function exportCsv(account) {
  const job = await rpc('request_export_idempotent', account, {p_idempotency_key:`closure-export-${randomUUID()}`});
  const result = await request('/functions/v1/process-export', account, {method:'POST', body:{export_id:job.id}});
  assert.equal(result.status, 'READY');
  const repeated = await request('/functions/v1/process-export', account, {method:'POST', body:{export_id:job.id}});
  assert.equal(repeated.download_url,result.download_url);
  if (!expiryChecked) {
    await request(`/rest/v1/exports?id=eq.${job.id}`,account,{method:'PATCH',body:{expires_at:'2000-01-01T00:00:00Z'},expected:[204]});
    const refreshed=await request('/functions/v1/process-export',account,{method:'POST',body:{export_id:job.id}});
    assert(Date.parse(refreshed.expires_at)>Date.now());
    assert.equal((await fetch(refreshed.download_url,{signal:AbortSignal.timeout(20000)})).status,200);
    expiryChecked=true;
    pass('expired-export-rebuilt-with-usable-url');
  }
  const response = await fetch(result.download_url, {signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200);
  return { job:result, csv:await response.text() };
}
try {
  for (const account of accounts) {
    const session = await request('/auth/v1/token?grant_type=password', null, {method:'POST', body:{email:account.email,password:account.password}});
    assert.equal(session.user.id,account.id);
    account.token=session.access_token;
    assert.deepEqual(await request('/rest/v1/subscriptions?select=id',account),[]);
    assert.deepEqual(await request('/rest/v1/exports?select=id',account),[]);
  }
  pass('three-distinct-disposable-auth-sessions');
  const [a,b,d] = accounts;
  const formulaName = `=1+1 ${marker}`;
  const sa = await create(a,formulaName);
  const sb = await create(b,`foreign-${marker}`);
  await create(d,`deletion-${marker}`);
  assert.deepEqual(await request(`/rest/v1/subscriptions?id=eq.${sa.id}&select=id`,b),[]);
  await request(`/rest/v1/subscriptions?id=eq.${sa.id}`, b, {method:'PATCH',body:{name:'forbidden'},expected:[204]});
  await request(`/rest/v1/subscriptions?id=eq.${sa.id}`, b, {method:'DELETE',expected:[204]});
  assert.equal((await request(`/rest/v1/subscriptions?id=eq.${sa.id}&select=name`,a))[0].name,formulaName);
  await request(`/rest/v1/subscriptions?id=eq.${sa.id}`,a,{method:'PATCH',body:{user_id:b.id},expected:[400,403]});
  const foreign = await rpc('record_payment_idempotent',b,{p_idempotency_key:`foreign-${marker}`,p_subscription_id:sa.id,p_amount:'1',p_currency:'TRY',p_paid_at:new Date().toISOString()},[400,403,404,500]);
  assert(['P0002','42501'].includes(foreign.code));
  pass('cross-account-read-update-and-foreign-payment-denied');
  const renewal = {p_idempotency_key:`renewal-${marker}`,p_subscription_id:sa.id,p_expected_old_date:today,p_next_date:tomorrow,p_today:today,p_timezone:'Europe/Istanbul'};
  const foreignRenewal=await rpc('confirm_subscription_renewal_in_timezone_idempotent',b,renewal,[400,403,404,500]);
  assert(['P0002','42501'].includes(foreignRenewal.code));
  const foreignDelete=await rpc('soft_delete_subscriptions_idempotent',b,{p_idempotency_key:`foreign-delete-${marker}`,p_subscription_ids:[sa.id]},[400,403,404,500]);
  assert(['P0002','42501'].includes(foreignDelete.code));
  pass('owner-reassignment-foreign-renewal-and-soft-delete-denied');
  const first = await rpc('confirm_subscription_renewal_in_timezone_idempotent',a,renewal);
  const again = await rpc('confirm_subscription_renewal_in_timezone_idempotent',a,renewal);
  assert.deepEqual(first,again);
  const payments = await request(`/rest/v1/payment_events?subscription_id=eq.${sa.id}&select=id,amount`,a);
  assert.equal(payments.length,1);
  assert.equal(Number(payments[0].amount),49.90);
  pass('timezone-renewal-repeat-single-payment');
  await rpc('confirm_subscription_renewal_idempotent',b,{p_idempotency_key:`old-renewal-${marker}`,p_subscription_id:sb.id,p_expected_old_date:today,p_next_date:tomorrow,p_today:today});
  pass('legacy-renewal-contract');
  const deferred = {p_idempotency_key:`deferred-${marker}`,p_subscription_id:sb.id,p_amount:'49.90',p_currency:'TRY',p_paid_at:new Date().toISOString(),p_deferred_until:tomorrow};
  const deferredResults=await Promise.all(Array.from({length:10},()=>rpc('record_deferred_payment_idempotent',b,deferred)));
  assert.equal(new Set(deferredResults.map(result=>result.id)).size,1);
  assert.equal((await request(`/rest/v1/payment_events?subscription_id=eq.${sb.id}&status=eq.DEFERRED&select=id`,b)).length,1);
  pass('ten-concurrent-live-deferred-requests-single-result');
  const exported = await exportCsv(a);
  assert(exported.csv.includes(`'${formulaName}`));
  assert(!exported.csv.includes(`foreign-${marker}`));
  await request('/functions/v1/process-export',b,{method:'POST',body:{export_id:exported.job.id},expected:[404]});
  const foreignObjects = await request('/storage/v1/object/list/exports',b,{method:'POST',body:{prefix:`${a.id}/`,limit:100}});
  assert.deepEqual(foreignObjects,[]);
  await request(`/storage/v1/object/exports/${a.id}/forbidden.csv`,b,{method:'POST',body:'forbidden',contentType:'text/csv',expected:[400,403]});
  pass('export-formula-neutralized-and-other-account-storage-hidden');
  await rpc('soft_delete_subscriptions_idempotent',a,{p_idempotency_key:`soft-delete-${marker}`,p_subscription_ids:[sa.id]});
  assert.deepEqual(await request(`/rest/v1/subscriptions?id=eq.${sa.id}&select=id`,a),[]);
  const afterDelete = await exportCsv(a);
  assert(!afterDelete.csv.includes(marker));
  assert.equal((await request(`/rest/v1/payment_events?subscription_id=eq.${sa.id}&select=id`,a)).length,1);
  const deleted = await rpc('record_payment_idempotent',a,{p_idempotency_key:`deleted-payment-${marker}`,p_subscription_id:sa.id,p_amount:'1',p_currency:'TRY',p_paid_at:new Date().toISOString()},[400,403,404,500]);
  assert(['P0002','42501'].includes(deleted.code));
  pass('soft-delete-hidden-in-export-financial-history-preserved-new-payment-denied');
  await exportCsv(d);
  await request(`/storage/v1/object/exports/${d.id}/archive/older.csv`,d,{method:'POST',body:'name\r\nold\r\n',contentType:'text/csv',expected:[200]});
  pass('account-deletion-fixtures-include-nested-storage-object');
  const observerA=createClient(base,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const observerB=createClient(base,key,{auth:{persistSession:false,autoRefreshToken:false}});
  try {
    for (const [client,account] of [[observerA,a],[observerB,b]]) {
      const signed=await client.auth.signInWithPassword({email:account.email,password:account.password});
      assert.equal(signed.error,null);
    }
    let receivedAt;
    let leaked=false;
    const realtimeName=`realtime-${randomUUID()}`;
    const subscribe=(client,foreign)=>new Promise((accept,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Realtime subscription timeout')),15000);
      client.channel(`closure-${randomUUID()}`).on('postgres_changes',{
        event:'INSERT',schema:'public',table:'subscriptions',filter:`user_id=eq.${a.id}`,
      },change=>{if(change.new.name===realtimeName){if(foreign)leaked=true;else receivedAt=Date.now();}})
        .subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timer);accept();}else if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){clearTimeout(timer);reject(new Error('Realtime channel unavailable'));}});
    });
    await Promise.all([subscribe(observerA,false),subscribe(observerB,true)]);
    const started=Date.now();
    await create(a,realtimeName);
    while(Date.now()-started<5000) await new Promise(accept=>setTimeout(accept,100));
    assert(receivedAt && receivedAt-started<=5000,'Owner Realtime exceeded five seconds');
    assert.equal(leaked,false);
    evidence.realtimeInsertMilliseconds=receivedAt-started;
    pass('same-account-realtime-within-five-seconds-other-account-no-delivery');
  } finally { await Promise.all([observerA.removeAllChannels(),observerB.removeAllChannels()]); }
} finally {
  const errors=[];
  for (const account of accounts) {
    if (!account.token) { errors.push(`missing-session-${account.label}`); continue; }
    try {
      const result=await request('/functions/v1/delete-account',account,{method:'POST',body:{}});
      assert.equal(result.success,true);
      const user=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:`Bearer ${account.token}`},signal:AbortSignal.timeout(20000)});
      assert.notEqual(user.status,200);
      pass(`account-${account.label}-deleted-and-old-token-user-lookup-denied`);
      await request(`/storage/v1/object/exports/${account.id}/after-deletion.csv`,account,{method:'POST',body:'denied',contentType:'text/csv',expected:[400,401,403]});
      const remaining=await request('/storage/v1/object/list/exports',account,{method:'POST',body:{prefix:`${account.id}/`,limit:100},expected:[200,401,403]});
      if(Array.isArray(remaining)) assert.deepEqual(remaining,[]);
      pass(`account-${account.label}-old-token-storage-read-and-insert-denied`);
    } catch { errors.push(`cleanup-${account.label}`); }
  }
  evidence.cleanupErrors=errors;
  writeFileSync(resolve('docs/quality/backend-closure-live-results-2026-10-22.json'),JSON.stringify(evidence,null,2)+'\n');
  if(errors.length) throw new Error(`Disposable cleanup needs admin verification: ${errors.join(',')}`);
}
