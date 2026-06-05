ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_type text NOT NULL DEFAULT 'walkin';
CREATE INDEX IF NOT EXISTS sales_customer_id_idx ON public.sales(customer_id);