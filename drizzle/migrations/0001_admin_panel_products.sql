CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  collection text NOT NULL DEFAULT 'STREET',
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  mrp integer NOT NULL DEFAULT 2499,
  price integer NOT NULL DEFAULT 1999,
  size_stock jsonb NOT NULL DEFAULT '{}'::jsonb,
  low_stock_alert integer NOT NULL DEFAULT 5,
  badges text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  front_image text,
  back_image text,
  extra_images text[] NOT NULL DEFAULT '{}',
  fabric text NOT NULL DEFAULT '240GSM Heavyweight Cotton',
  care text NOT NULL DEFAULT 'Cold wash only',
  fit text NOT NULL DEFAULT 'oversized',
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active products" ON public.products FOR SELECT TO anon, authenticated USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.contact_messages ADD COLUMN status text NOT NULL DEFAULT 'new', ADD COLUMN note text NOT NULL DEFAULT '';
GRANT UPDATE ON public.contact_messages TO authenticated;
CREATE POLICY "Admins update messages" ON public.contact_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.orders ADD COLUMN tracking_number text NOT NULL DEFAULT '', ADD COLUMN courier text NOT NULL DEFAULT '';

INSERT INTO public.products (slug, name, collection, description, size_stock, badges) VALUES
('vlxr-heritage-crest-tee','VLXR Heritage Crest Tee','HERITAGE','The Heritage Crest Tee carries the VLXR emblem in a raised matte finish on 240GSM heavyweight cotton. Boxy oversized cut with a ribbed collar that holds its shape wash after wash.','{"S":10,"M":10,"L":10,"XL":10,"XXL":10}','{}'),
('vlxr-genesis-limited-drop','VLXR Genesis Limited Drop','GENESIS','Twenty-five pieces. The Genesis Limited Drop is our first release — numbered print, full back graphic, and a heavyweight 240GSM body. Once it''s gone, it does not return.','{"M":8,"L":9,"XL":8}','{LIMITED}'),
('vlxr-street-urban-tee','VLXR Street Urban Tee','STREET','Built for daily rotation. Minimal chest mark, bold back type, and the same 240GSM heavyweight cotton as the rest of the line. Oversized drop-shoulder fit.','{"XS":10,"S":15,"M":15,"L":15,"XL":10,"XXL":10}','{}');