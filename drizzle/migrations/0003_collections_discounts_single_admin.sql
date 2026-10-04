CREATE UNIQUE INDEX IF NOT EXISTS one_admin_only ON public.user_roles (role) WHERE role = 'admin';

CREATE TABLE public.collections (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  banner_image text,
  display_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read visible collections" ON public.collections FOR SELECT TO anon, authenticated
  USING (visible OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage collections" ON public.collections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.collections (id, title, description, display_order) VALUES
 ('HERITAGE','VLXR HERITAGE','Crest work, archive cuts, built to outlive the season.',1),
 ('STREET','VLXR STREET','Everyday armour. Heavy cotton, clean graphics.',2),
 ('GENESIS','VLXR GENESIS','The first drop. Numbered, limited, never restocked.',3);

CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'percent',
  value int NOT NULL DEFAULT 10,
  min_order int NOT NULL DEFAULT 0,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_codes TO authenticated;
GRANT ALL ON public.discount_codes TO service_role;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage discounts" ON public.discount_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount int NOT NULL DEFAULT 0;