-- Retry-safe issue requests and immutable footer snapshot.
ALTER TABLE public.receipts ADD COLUMN request_id uuid, ADD COLUMN issuer_footer text;
CREATE UNIQUE INDEX receipts_request_unique ON public.receipts(business_id,request_id);
CREATE UNIQUE INDEX receipts_income_unique ON public.receipts(income_transaction_id) WHERE income_transaction_id IS NOT NULL;
DROP FUNCTION public.issue_receipt(uuid,date,uuid,text,text,text,text,text,numeric,text,text);
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
  p_payment_details text,
  p_request_id uuid
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

  IF p_request_id IS NULL THEN RAISE EXCEPTION 'Request ID required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_business_id::text || p_request_id::text, 0));
  SELECT * INTO r FROM public.receipts WHERE business_id=p_business_id AND request_id=p_request_id;
  IF FOUND THEN RETURN r; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id=p_business_id AND coalesce(tax_id,'') <> '') THEN RAISE EXCEPTION 'Issuer ID required'; END IF;
  IF p_client_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients WHERE id=p_client_id AND business_id=p_business_id) THEN RAISE EXCEPTION 'Invalid client'; END IF;

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
    (request_id, issuer_footer, business_id, seq, receipt_number, issue_date, client_id, client_name, client_tax_id, client_address, client_email,
     description, amount, payment_method, payment_details,
     issuer_name, issuer_owner, issuer_tax_id, issuer_address, issuer_phone, issuer_email, income_transaction_id)
  VALUES
    (p_request_id, b.receipt_footer, p_business_id, v_seq, b.receipt_prefix || v_seq::text, p_issue_date, p_client_id, p_client_name,
     NULLIF(p_client_tax_id, ''), NULLIF(p_client_address, ''), NULLIF(p_client_email, ''),
     p_description, p_amount, p_payment_method, NULLIF(p_payment_details, ''),
     b.name, b.owner_name, b.tax_id, b.address, b.phone, b.email, v_income)
  RETURNING * INTO r;

  RETURN r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


CREATE FUNCTION public.receipts_snapshot_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.request_id IS DISTINCT FROM OLD.request_id OR NEW.issuer_footer IS DISTINCT FROM OLD.issuer_footer OR NEW.income_transaction_id IS DISTINCT FROM OLD.income_transaction_id THEN RAISE EXCEPTION 'Receipt snapshot is immutable'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER receipts_snapshot_guard_trg BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.receipts_snapshot_guard();
