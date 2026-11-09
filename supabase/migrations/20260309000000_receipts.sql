-- Receipts for an exempt dealer (עוסק פטור): immutable, sequential, one per issue.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS receipt_footer text;

ALTER TABLE public.businesses ALTER COLUMN receipt_prefix SET DEFAULT '';
ALTER TABLE public.businesses ALTER COLUMN receipt_next_number SET DEFAULT 1;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS address text;

CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  seq integer NOT NULL,
  receipt_number text NOT NULL,
  issue_date date NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_tax_id text,
  client_address text,
  client_email text,
  description text NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL,
  payment_details text,
  -- snapshot of the issuer at issue time
  issuer_name text NOT NULL,
  issuer_owner text,
  issuer_tax_id text,
  issuer_address text,
  issuer_phone text,
  issuer_email text,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'cancelled')),
  cancelled_at timestamptz,
  cancel_reason text,
  income_transaction_id uuid REFERENCES public.income_transactions(id) ON DELETE SET NULL,
  pdf_path text,
  pdf_sha256 text,
  emailed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, seq),
  UNIQUE (business_id, receipt_number)
);

CREATE INDEX idx_receipts_business_date ON public.receipts(business_id, issue_date DESC);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY receipts_select ON public.receipts FOR SELECT
  USING (public.user_owns_business(business_id));
CREATE POLICY receipts_update ON public.receipts FOR UPDATE
  USING (public.user_owns_business(business_id))
  WITH CHECK (public.user_owns_business(business_id));
-- No insert policy (rows are created by issue_receipt) and no delete policy.

-- Only allow: set pdf once, record emailed_at, cancel once. Everything else is frozen.
CREATE OR REPLACE FUNCTION public.receipts_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Receipts cannot be deleted';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.business_id IS DISTINCT FROM OLD.business_id
     OR NEW.seq IS DISTINCT FROM OLD.seq OR NEW.receipt_number IS DISTINCT FROM OLD.receipt_number
     OR NEW.issue_date IS DISTINCT FROM OLD.issue_date OR NEW.client_name IS DISTINCT FROM OLD.client_name
     OR NEW.client_tax_id IS DISTINCT FROM OLD.client_tax_id OR NEW.client_address IS DISTINCT FROM OLD.client_address
     OR NEW.client_email IS DISTINCT FROM OLD.client_email
     OR NEW.description IS DISTINCT FROM OLD.description OR NEW.amount IS DISTINCT FROM OLD.amount
     OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
     OR NEW.payment_details IS DISTINCT FROM OLD.payment_details
     OR NEW.issuer_name IS DISTINCT FROM OLD.issuer_name OR NEW.issuer_owner IS DISTINCT FROM OLD.issuer_owner
     OR NEW.issuer_tax_id IS DISTINCT FROM OLD.issuer_tax_id OR NEW.issuer_address IS DISTINCT FROM OLD.issuer_address
     OR NEW.issuer_phone IS DISTINCT FROM OLD.issuer_phone OR NEW.issuer_email IS DISTINCT FROM OLD.issuer_email
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Issued receipts are immutable';
  END IF;
  IF OLD.pdf_path IS NOT NULL AND (NEW.pdf_path IS DISTINCT FROM OLD.pdf_path OR NEW.pdf_sha256 IS DISTINCT FROM OLD.pdf_sha256) THEN
    RAISE EXCEPTION 'Stored PDF is immutable';
  END IF;
  IF OLD.status = 'cancelled' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at OR NEW.cancel_reason IS DISTINCT FROM OLD.cancel_reason) THEN
    RAISE EXCEPTION 'Receipt already cancelled';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER receipts_guard_trg BEFORE UPDATE OR DELETE ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.receipts_guard();

-- Issue a receipt atomically: allocate the next number + insert the receipt + insert income row.
CREATE OR REPLACE FUNCTION public.issue_receipt(
  p_business_id uuid,
  p_issue_date date,
  p_client_id uuid,
  p_client_name text,
  p_client_tax_id text,
  p_client_address text,
  p_client_email text,
  p_description text,
  p_amount numeric,
  p_payment_method text,
  p_payment_details text
) RETURNS public.receipts AS $$
DECLARE
  b public.businesses%ROWTYPE;
  v_seq integer;
  v_income uuid;
  r public.receipts%ROWTYPE;
BEGIN
  IF NOT public.user_owns_business(p_business_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.businesses
     SET receipt_next_number = receipt_next_number + 1
   WHERE id = p_business_id
  RETURNING * INTO b;
  IF NOT FOUND THEN RAISE EXCEPTION 'Business not found'; END IF;
  v_seq := b.receipt_next_number - 1;

  INSERT INTO public.income_transactions
    (business_id, client_id, transaction_date, payment_received_at, amount, description, status, receipt_number)
  VALUES
    (p_business_id, p_client_id, p_issue_date, now(), p_amount, p_description, 'received', b.receipt_prefix || v_seq::text)
  RETURNING id INTO v_income;

  INSERT INTO public.receipts
    (business_id, seq, receipt_number, issue_date, client_id, client_name, client_tax_id, client_address, client_email,
     description, amount, payment_method, payment_details,
     issuer_name, issuer_owner, issuer_tax_id, issuer_address, issuer_phone, issuer_email, income_transaction_id)
  VALUES
    (p_business_id, v_seq, b.receipt_prefix || v_seq::text, p_issue_date, p_client_id, p_client_name,
     NULLIF(p_client_tax_id, ''), NULLIF(p_client_address, ''), NULLIF(p_client_email, ''),
     p_description, p_amount, p_payment_method, NULLIF(p_payment_details, ''),
     b.name, b.owner_name, b.tax_id, b.address, b.phone, b.email, v_income)
  RETURNING * INTO r;

  RETURN r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Cancel a receipt (keeps the number in the sequence) and mark its income row cancelled.
CREATE OR REPLACE FUNCTION public.cancel_receipt(p_receipt_id uuid, p_reason text)
RETURNS public.receipts AS $$
DECLARE r public.receipts%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.receipts WHERE id = p_receipt_id;
  IF NOT FOUND OR NOT public.user_owns_business(r.business_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF r.status = 'cancelled' THEN RAISE EXCEPTION 'Receipt already cancelled'; END IF;
  UPDATE public.receipts SET status = 'cancelled', cancelled_at = now(), cancel_reason = p_reason
   WHERE id = p_receipt_id RETURNING * INTO r;
  IF r.income_transaction_id IS NOT NULL THEN
    UPDATE public.income_transactions SET status = 'cancelled' WHERE id = r.income_transaction_id;
  END IF;
  RETURN r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Storage: an upload may not overwrite (no UPDATE policy) and no deletes for receipts.
DROP POLICY IF EXISTS storage_documents_delete ON storage.objects;
CREATE POLICY storage_documents_delete ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] IS DISTINCT FROM 'receipts'
  );
