\set ON_ERROR_STOP on
ALTER TABLE public.subscriptions ADD COLUMN is_archived boolean NOT NULL DEFAULT false;
CREATE TABLE public.savings_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, subscription_id uuid NOT NULL, amount numeric NOT NULL);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_subscription ON public.subscriptions FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY own_payment ON public.payment_events FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY own_savings ON public.savings_events FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
GRANT USAGE ON SCHEMA public,auth TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.subscriptions,public.payment_events,public.savings_events TO authenticated;
INSERT INTO public.savings_events(user_id,subscription_id,amount) VALUES('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',120);
