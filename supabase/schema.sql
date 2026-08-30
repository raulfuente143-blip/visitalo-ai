BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.agency_role AS ENUM ('owner', 'admin', 'manager', 'member');
CREATE TYPE public.subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused'
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  brand_primary_color text NOT NULL DEFAULT '#0F172A',
  brand_secondary_color text NOT NULL DEFAULT '#F59E0B',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.agency_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, user_id)
);

CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  monthly_price_cents integer NOT NULL CHECK (monthly_price_cents >= 0),
  currency text NOT NULL DEFAULT 'eur',
  is_active boolean NOT NULL DEFAULT true,
  video_limit integer NOT NULL DEFAULT 0 CHECK (video_limit >= 0),
  photo_limit integer NOT NULL DEFAULT 0 CHECK (photo_limit >= 0),
  credit_limit integer NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  stripe_price_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  status public.subscription_status NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.usage_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.plans(id),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  videos_used integer NOT NULL DEFAULT 0 CHECK (videos_used >= 0),
  photos_used integer NOT NULL DEFAULT 0 CHECK (photos_used >= 0),
  credits_used integer NOT NULL DEFAULT 0 CHECK (credits_used >= 0),
  credits_available integer NOT NULL DEFAULT 0 CHECK (credits_available >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, period_start, period_end)
);

CREATE TABLE public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  amount_cents integer NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'eur',
  stripe_payment_intent_id text,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agency_members_user_id
  ON public.agency_members (user_id);

CREATE INDEX idx_agency_members_agency_id
  ON public.agency_members (agency_id);

CREATE INDEX idx_subscriptions_agency_id
  ON public.subscriptions (agency_id);

CREATE INDEX idx_usage_periods_agency_id
  ON public.usage_periods (agency_id);

CREATE INDEX idx_credit_purchases_agency_id
  ON public.credit_purchases (agency_id);

CREATE OR REPLACE FUNCTION public.is_agency_member(p_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_members am
    WHERE am.agency_id = p_agency_id
      AND am.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_agency(p_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_members am
    WHERE am.agency_id = p_agency_id
      AND am.user_id = auth.uid()
      AND am.role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.create_agency_for_user(
  p_name text,
  p_slug text,
  p_logo_url text DEFAULT NULL,
  p_primary_color text DEFAULT '#0F172A',
  p_secondary_color text DEFAULT '#F59E0B'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.agencies (name, slug, logo_url, brand_primary_color, brand_secondary_color)
  VALUES (p_name, p_slug, p_logo_url, p_primary_color, p_secondary_color)
  RETURNING id INTO v_agency_id;

  INSERT INTO public.agency_members (agency_id, user_id, role)
  VALUES (v_agency_id, auth.uid(), 'owner');

  RETURN v_agency_id;
END;
$$;

CREATE TRIGGER set_agencies_updated_at
BEFORE UPDATE ON public.agencies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_agency_members_updated_at
BEFORE UPDATE ON public.agency_members
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_usage_periods_updated_at
BEFORE UPDATE ON public.usage_periods
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies are visible to members"
ON public.agencies
FOR SELECT
USING (public.is_agency_member(id));

CREATE POLICY "Agencies can be updated by agency members"
ON public.agencies
FOR UPDATE
USING (public.is_agency_member(id))
WITH CHECK (public.is_agency_member(id));

CREATE POLICY "Agencies can be created by authenticated users"
ON public.agencies
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Agency members are visible to current agency members"
ON public.agency_members
FOR SELECT
USING (public.is_agency_member(agency_id));

CREATE POLICY "Agency members can be created by authorized members"
ON public.agency_members
FOR INSERT
WITH CHECK (
  public.is_agency_member(agency_id)
  OR auth.uid() = user_id
);

CREATE POLICY "Agency members can be updated by managers"
ON public.agency_members
FOR UPDATE
USING (public.can_manage_agency(agency_id))
WITH CHECK (public.can_manage_agency(agency_id));

CREATE POLICY "Agency members can be deleted by managers"
ON public.agency_members
FOR DELETE
USING (public.can_manage_agency(agency_id));

CREATE POLICY "Plans are readable by authenticated users"
ON public.plans
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Plans are not writable by app users"
ON public.plans
FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "Subscriptions are visible to agency members"
ON public.subscriptions
FOR SELECT
USING (public.is_agency_member(agency_id));

CREATE POLICY "Subscriptions can be created by agency members"
ON public.subscriptions
FOR INSERT
WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "Subscriptions can be updated by agency members"
ON public.subscriptions
FOR UPDATE
USING (public.is_agency_member(agency_id))
WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "Subscriptions can be deleted by agency members"
ON public.subscriptions
FOR DELETE
USING (public.is_agency_member(agency_id));

CREATE POLICY "Usage periods are visible to agency members"
ON public.usage_periods
FOR SELECT
USING (public.is_agency_member(agency_id));

CREATE POLICY "Usage periods can be created by agency members"
ON public.usage_periods
FOR INSERT
WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "Usage periods can be updated by agency members"
ON public.usage_periods
FOR UPDATE
USING (public.is_agency_member(agency_id))
WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "Usage periods can be deleted by agency members"
ON public.usage_periods
FOR DELETE
USING (public.is_agency_member(agency_id));

CREATE POLICY "Credit purchases are visible to agency members"
ON public.credit_purchases
FOR SELECT
USING (public.is_agency_member(agency_id));

CREATE POLICY "Credit purchases can be created by agency members"
ON public.credit_purchases
FOR INSERT
WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "Credit purchases can be updated by agency members"
ON public.credit_purchases
FOR UPDATE
USING (public.is_agency_member(agency_id))
WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "Credit purchases can be deleted by agency members"
ON public.credit_purchases
FOR DELETE
USING (public.is_agency_member(agency_id));

INSERT INTO public.plans (code, name, description, monthly_price_cents, currency, is_active, video_limit, photo_limit, credit_limit, stripe_price_id)
VALUES
  ('starter', 'Starter', 'Plan ideal para empezar con pocos videos y fotos.', 2000, 'eur', true, 50, 500, 100, NULL),
  ('pro', 'Pro', 'Para agencias que necesitan más volumen y automatización.', 4500, 'eur', true, 150, 2000, 250, NULL),
  ('agencia', 'Agencia', 'Para equipos con mucha producción y gestión centralizada.', 10000, 'eur', true, 400, 8000, 800, NULL)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  currency = EXCLUDED.currency,
  is_active = EXCLUDED.is_active,
  video_limit = EXCLUDED.video_limit,
  photo_limit = EXCLUDED.photo_limit,
  credit_limit = EXCLUDED.credit_limit,
  stripe_price_id = EXCLUDED.stripe_price_id,
  updated_at = NOW();

COMMIT;
