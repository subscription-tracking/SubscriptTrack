import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
if(process.env.CLOSURE_LIVE_CONFIRM!=='disposable-accounts-only') throw new Error('Disposable confirmation required');
const account=JSON.parse(readFileSync(process.env.CLOSURE_ACCOUNTS_FILE,'utf8')).find(account=>account.label==='DELETE');
assert(account?.email.endsWith('@example.invalid'));
const base=process.env.EXPO_PUBLIC_SUPABASE_URL;
const key=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
async function login(){
  const response=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:account.email,password:account.password}),signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200);
  const result=await response.json();assert.equal(result.user.id,account.id);return result.access_token;
}
async function remove(token){return fetch(base+'/functions/v1/delete-account',{method:'POST',headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(20000)});}
let fresh;
try{
  const token=await login();
  console.log('PASS disposable session established; waiting for real five-minute recent-login boundary');
  await new Promise(accept=>setTimeout(accept,305000));
  const old=await remove(token);assert.equal(old.status,403);
  console.log('PASS real stale session rejected with HTTP 403');
  fresh=await login();
  const removed=await remove(fresh);assert.equal(removed.status,200);assert.equal((await removed.json()).success,true);
  fresh=null;
  writeFileSync('docs/quality/backend-closure-recent-login-2026-10-22.json',JSON.stringify({generatedAt:new Date().toISOString(),staleSessionStatus:403,freshDeletionStatus:200,waitMilliseconds:305000},null,2)+'\n');
  console.log('PASS fresh reauthentication allowed disposable account deletion');
}catch(error){
  try{fresh=await login();await remove(fresh);}catch{console.error('Disposable DELETE fixture requires admin cleanup');}
  throw error;
}
