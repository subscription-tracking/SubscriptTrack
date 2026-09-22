-- Support tickets and a small server-owned service catalog.
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  message text NOT NULL CHECK (length(trim(message)) BETWEEN 1 AND 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_tickets_own_read ON public.support_tickets;
CREATE POLICY support_tickets_own_read ON public.support_tickets FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS support_tickets_own_insert ON public.support_tickets;
CREATE POLICY support_tickets_own_insert ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
REVOKE ALL ON public.support_tickets FROM anon;
GRANT SELECT, INSERT ON public.support_tickets TO authenticated;

CREATE TABLE IF NOT EXISTS public.service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'other',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_catalog_public_read ON public.service_catalog;
CREATE POLICY service_catalog_public_read ON public.service_catalog FOR SELECT TO anon, authenticated USING (is_active = true);
GRANT SELECT ON public.service_catalog TO anon, authenticated;

INSERT INTO public.service_catalog (name, category, sort_order) VALUES
 ('Netflix','streaming',10),('Disney+','streaming',20),('Spotify','music',30),
 ('YouTube Premium','streaming',40),('ChatGPT','software',50),('Canva','software',60),
 ('Dropbox','cloud',70),('iCloud','cloud',80),('Xbox Game Pass','gaming',90)
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, sort_order = EXCLUDED.sort_order;
