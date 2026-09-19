-- 025: Allow idempotency RPCs to resolve pgcrypto from Supabase's extensions schema.
ALTER FUNCTION public.create_subscription_idempotent(text,text,numeric,text,text,date,date,text,text,text,date,numeric)
  SET search_path TO public, extensions;

ALTER FUNCTION public.update_subscription_idempotent(text,uuid,text,numeric,text,text,date,date,text,text,text,date,numeric,jsonb,text)
  SET search_path TO public, extensions;
