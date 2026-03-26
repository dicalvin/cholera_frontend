-- Ensure predicted suspected cases columns exist using lowercase Postgres identifiers.
-- Postgres folds unquoted identifiers to lowercase, so `predicted_sCh` becomes `predicted_sch`.

ALTER TABLE public.cholera_reports
ADD COLUMN IF NOT EXISTS predicted_sch numeric,
ADD COLUMN IF NOT EXISTS predicted_sch_updated_at timestamptz;

