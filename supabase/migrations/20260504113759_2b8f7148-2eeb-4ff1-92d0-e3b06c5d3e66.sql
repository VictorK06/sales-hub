
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Public can delete products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Public can read sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Public can insert sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update sales" ON public.sales FOR UPDATE USING (true);
CREATE POLICY "Public can delete sales" ON public.sales FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.decrement_stock_on_sale()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER sales_decrement_stock
AFTER INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_sale();
