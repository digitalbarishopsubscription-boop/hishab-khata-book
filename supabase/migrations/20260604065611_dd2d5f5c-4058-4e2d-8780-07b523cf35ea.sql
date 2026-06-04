
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own customers" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own customers" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own customers" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own customers" ON public.customers FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.khata_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'due',
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.khata_transactions TO authenticated;
GRANT ALL ON public.khata_transactions TO service_role;
ALTER TABLE public.khata_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own khata" ON public.khata_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own khata" ON public.khata_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own khata" ON public.khata_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own khata" ON public.khata_transactions FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_khata_updated_at BEFORE UPDATE ON public.khata_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_customers_user ON public.customers(user_id);
CREATE INDEX idx_khata_user ON public.khata_transactions(user_id);
CREATE INDEX idx_khata_customer ON public.khata_transactions(customer_id);
