-- 020: Export worker result fields.
ALTER TABLE public.exports
  ADD COLUMN IF NOT EXISTS download_url text,
  ADD COLUMN IF NOT EXISTS error_message text;
