-- Add predicted suspected cholera cases columns for realtime batch updates.
-- Run via Supabase migrations.

ALTER TABLE public.cholera_reports
ADD COLUMN IF NOT EXISTS predicted_sCh numeric,
ADD COLUMN IF NOT EXISTS predicted_sCh_updated_at timestamptz;

