-- Bizly initial schema
SET check_function_bodies = false;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.income_status AS ENUM ('draft', 'received', 'cancelled', 'refunded');
CREATE TYPE public.tax_status AS ENUM ('EXEMPT_DEALER', 'AUTHORIZED_DEALER', 'OTHER');
CREATE TYPE public.income_tax_status AS ENUM ('SMALL_BUSINESS_OWNER', 'STANDARD', 'OTHER');
CREATE TYPE public.accounting_method AS ENUM ('CASH', 'ACCRUAL');
CREATE TYPE public.document_type AS ENUM (
  'receipt', 'invoice', 'expense', 'income', 'client', 'supplier', 'other'
);
CREATE TYPE public.ocr_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.ai_extraction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'skipped');
CREATE TYPE public.notification_type AS ENUM (
  'missing_expense', 'turnover_threshold', 'tax_year_end', 'missing_documents',
  'monthly_review', 'custom'
);
CREATE TYPE public.audit_action AS ENUM (
  'created', 'updated', 'deleted', 'document_uploaded', 'document_removed',
  'receipt_generated', 'settings_changed'
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.user_owns_business(p_business_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = p_business_id AND b.user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Businesses
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_type text,
  tax_status public.tax_status NOT NULL DEFAULT 'EXEMPT_DEALER',
  income_tax_status public.income_tax_status NOT NULL DEFAULT 'SMALL_BUSINESS_OWNER',
  accounting_method public.accounting_method NOT NULL DEFAULT 'CASH',
  default_currency char(3) NOT NULL DEFAULT 'ILS',
  country char(2) NOT NULL DEFAULT 'IL',
  language char(2) NOT NULL DEFAULT 'he',
  tax_year integer NOT NULL DEFAULT 2026,
  address text,
  phone text,
  email text,
  tax_id text,
  receipt_prefix text NOT NULL DEFAULT 'R-',
  receipt_next_number integer NOT NULL DEFAULT 1001,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX idx_businesses_user_id ON public.businesses(user_id);
CREATE TRIGGER businesses_updated_at BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Activities
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_business_id ON public.activities(business_id);
CREATE TRIGGER activities_updated_at BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Clients & suppliers
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_business_id ON public.clients(business_id);

CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  tax_id text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppliers_business_id ON public.suppliers(business_id);

-- Payment methods
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_methods_business_id ON public.payment_methods(business_id);

-- Expense categories
CREATE TABLE public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_expense_categories_business_id ON public.expense_categories(business_id);

-- Documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  document_type public.document_type NOT NULL DEFAULT 'other',
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  ocr_status public.ocr_status NOT NULL DEFAULT 'pending',
  ai_extraction_status public.ai_extraction_status NOT NULL DEFAULT 'pending',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_business_id ON public.documents(business_id);

-- Income transactions
CREATE TABLE public.income_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  transaction_date date NOT NULL,
  payment_received_at timestamptz,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'ILS',
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  description text,
  reference_number text,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  receipt_number text,
  status public.income_status NOT NULL DEFAULT 'received',
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_income_business_id ON public.income_transactions(business_id);
CREATE INDEX idx_income_transaction_date ON public.income_transactions(transaction_date);
CREATE INDEX idx_income_activity_id ON public.income_transactions(activity_id);
CREATE INDEX idx_income_client_id ON public.income_transactions(client_id);

-- Expense transactions
CREATE TABLE public.expense_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  expense_date date NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'ILS',
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  description text,
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_expense_business_id ON public.expense_transactions(business_id);
CREATE INDEX idx_expense_expense_date ON public.expense_transactions(expense_date);
CREATE INDEX idx_expense_supplier_id ON public.expense_transactions(supplier_id);
CREATE INDEX idx_expense_category_id ON public.expense_transactions(category_id);

-- Recurring expenses
CREATE TABLE public.recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL DEFAULT 'ILS',
  frequency text NOT NULL,
  start_date date NOT NULL,
  end_date date,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Business documents (generated)
CREATE TABLE public.business_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  income_transaction_id uuid REFERENCES public.income_transactions(id) ON DELETE SET NULL,
  document_number text NOT NULL,
  document_type public.document_type NOT NULL DEFAULT 'receipt',
  file_path text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, document_number)
);

CREATE TABLE public.document_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sequence_key text NOT NULL DEFAULT 'receipt',
  prefix text NOT NULL DEFAULT 'R-',
  next_number integer NOT NULL DEFAULT 1001,
  UNIQUE (business_id, sequence_key)
);

-- Tax configurations (global, versioned by year)
CREATE TABLE public.tax_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country char(2) NOT NULL DEFAULT 'IL',
  tax_year integer NOT NULL,
  vat_exempt_ceiling numeric(14, 2),
  small_business_turnover_ceiling numeric(14, 2),
  small_business_expense_rate numeric(5, 4),
  training_fund_taxable_deduction_rate numeric(5, 4),
  training_fund_annual_exemption_ceiling numeric(14, 2),
  training_fund_income_ceiling numeric(14, 2),
  effective_from date NOT NULL,
  effective_until date,
  source_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country, tax_year)
);

-- Training fund
CREATE TABLE public.training_fund_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  tax_year integer NOT NULL,
  business_taxable_income numeric(14, 2),
  self_employed_deposits numeric(14, 2) NOT NULL DEFAULT 0,
  employer_deposits numeric(14, 2) NOT NULL DEFAULT 0,
  employee_salary numeric(14, 2),
  current_balance numeric(14, 2),
  target_contribution numeric(14, 2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, tax_year)
);

-- Monthly reviews
CREATE TABLE public.monthly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, year, month)
);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text,
  dismissed_at timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  preferences_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, business_id)
);

-- AI
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  provider text NOT NULL,
  model text,
  feature text NOT NULL,
  tokens_in integer,
  tokens_out integer,
  estimated_cost numeric(10, 6),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- User settings
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'system',
  locale char(2) NOT NULL DEFAULT 'he',
  settings_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, business_id)
);

-- Audit log
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action public.audit_action NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_business_id ON public.audit_logs(business_id);

-- Receipt number allocation (atomic)
CREATE OR REPLACE FUNCTION public.allocate_receipt_number(p_business_id uuid)
RETURNS text AS $$
DECLARE
  v_prefix text;
  v_num integer;
BEGIN
  IF NOT public.user_owns_business(p_business_id) AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.businesses
  SET receipt_next_number = receipt_next_number + 1,
      receipt_prefix = receipt_prefix
  WHERE id = p_business_id
  RETURNING receipt_prefix, receipt_next_number - 1 INTO v_prefix, v_num;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  RETURN v_prefix || v_num::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auth: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_fund_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Businesses
CREATE POLICY businesses_all ON public.businesses FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Generic business-owned tables
CREATE POLICY activities_all ON public.activities FOR ALL
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));

CREATE POLICY clients_all ON public.clients FOR ALL
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));

CREATE POLICY suppliers_all ON public.suppliers FOR ALL
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));

CREATE POLICY payment_methods_all ON public.payment_methods FOR ALL
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));

CREATE POLICY expense_categories_all ON public.expense_categories FOR ALL
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));

CREATE POLICY documents_all ON public.documents FOR ALL
  USING (public.user_owns_business(business_id) AND user_id = auth.uid())
  WITH CHECK (public.user_owns_business(business_id) AND user_id = auth.uid());

CREATE POLICY income_all ON public.income_transactions FOR ALL
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));

CREATE POLICY expense_all ON public.expense_transactions FOR ALL
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));

CREATE POLICY recurring_all ON public.recurring_expenses FOR ALL
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));

CREATE POLICY business_documents_all ON public.business_documents FOR ALL
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));

CREATE POLICY document_sequences_all ON public.document_sequences FOR ALL
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));

CREATE POLICY training_fund_all ON public.training_fund_records FOR ALL
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));

CREATE POLICY monthly_reviews_all ON public.monthly_reviews FOR ALL
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));

CREATE POLICY notifications_all ON public.notifications FOR ALL
  USING (user_id = auth.uid() AND public.user_owns_business(business_id))
  WITH CHECK (user_id = auth.uid() AND public.user_owns_business(business_id));

CREATE POLICY notification_prefs_all ON public.notification_preferences FOR ALL
  USING (user_id = auth.uid() AND public.user_owns_business(business_id))
  WITH CHECK (user_id = auth.uid() AND public.user_owns_business(business_id));

CREATE POLICY ai_conversations_all ON public.ai_conversations FOR ALL
  USING (user_id = auth.uid() AND public.user_owns_business(business_id))
  WITH CHECK (user_id = auth.uid() AND public.user_owns_business(business_id));

CREATE POLICY ai_messages_all ON public.ai_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY ai_usage_all ON public.ai_usage FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY user_settings_all ON public.user_settings FOR ALL
  USING (user_id = auth.uid() AND public.user_owns_business(business_id))
  WITH CHECK (user_id = auth.uid() AND public.user_owns_business(business_id));

CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT
  USING (public.user_owns_business(business_id));

CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT
  WITH CHECK (public.user_owns_business(business_id));

-- Tax config: read-only for authenticated users
CREATE POLICY tax_config_select ON public.tax_configurations FOR SELECT
  TO authenticated USING (true);

-- Seed 2026 IL tax configuration (verified sources in app docs)
INSERT INTO public.tax_configurations (
  country, tax_year, vat_exempt_ceiling, small_business_turnover_ceiling,
  small_business_expense_rate, training_fund_taxable_deduction_rate,
  training_fund_annual_exemption_ceiling, training_fund_income_ceiling,
  effective_from, source_url, notes
) VALUES (
  'IL', 2026, 122833, 120000, 0.30, 0.045, NULL, 293397,
  '2026-01-01',
  'https://www.gov.il/he/service/request-open-exempt-dealer-via-internet',
  'VAT exempt ceiling per Israel Tax Authority service page for 2026. Small business 30% from reform docs. Training fund rates require professional verification.'
);

-- Storage bucket (run via Supabase dashboard or storage migration)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-documents',
  'business-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_documents_select ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'business-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_documents_insert ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY storage_documents_delete ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
