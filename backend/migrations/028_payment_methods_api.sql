-- Ödeme yöntemi listesini tek transaction içinde değiştirir.
-- Bu fonksiyon yalnızca backend Edge Function'ın service-role istemcisi
-- tarafından çağrılır; mobil istemci tabloya doğrudan yazmaz.
CREATE OR REPLACE FUNCTION public.replace_payment_methods(
  p_user_id uuid,
  p_names text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.payment_methods WHERE user_id = p_user_id;

  INSERT INTO public.payment_methods (user_id, name)
  SELECT p_user_id, value
  FROM unnest(p_names) AS value;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_payment_methods(uuid, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.replace_payment_methods(uuid, text[]) FROM anon;
REVOKE ALL ON FUNCTION public.replace_payment_methods(uuid, text[]) FROM authenticated;
