ALTER TABLE public.home_visit
  ADD COLUMN IF NOT EXISTS catatan text,
  ADD COLUMN IF NOT EXISTS alasan text;

UPDATE public.home_visit
SET catatan = alasan
WHERE catatan IS NULL AND alasan IS NOT NULL;
