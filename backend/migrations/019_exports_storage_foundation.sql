-- 019: Private export storage foundation and authenticated export requests.
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS exports_storage_read_own ON storage.objects;
CREATE POLICY exports_storage_read_own ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS exports_storage_insert_own ON storage.objects;
CREATE POLICY exports_storage_insert_own ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exports' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.request_export_idempotent(p_idempotency_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_user uuid:=auth.uid(); v_existing idempotency_keys%ROWTYPE; v_row exports%ROWTYPE; v_hash text:='export-v1';
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE='42501'; END IF;
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) < 8 THEN RAISE EXCEPTION 'invalid idempotency key' USING ERRCODE='22023'; END IF;
  SELECT * INTO v_existing FROM idempotency_keys WHERE user_id=v_user AND method='POST' AND path='/exports' AND idempotency_key=p_idempotency_key;
  IF FOUND THEN IF v_existing.request_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'idempotency key reused with different payload' USING ERRCODE='23505'; END IF; RETURN v_existing.response_body; END IF;
  INSERT INTO exports(user_id,status) VALUES(v_user,'PENDING') RETURNING * INTO v_row;
  INSERT INTO idempotency_keys(user_id,method,path,idempotency_key,request_hash,status,response_body) VALUES(v_user,'POST','/exports',p_idempotency_key,v_hash,202,to_jsonb(v_row));
  RETURN to_jsonb(v_row);
END; $$;
REVOKE ALL ON FUNCTION public.request_export_idempotent(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_export_idempotent(text) TO authenticated;
