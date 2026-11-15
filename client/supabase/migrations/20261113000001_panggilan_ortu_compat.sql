ALTER TABLE public.panggilan_ortu
  ADD COLUMN IF NOT EXISTS nama_siswa text,
  ADD COLUMN IF NOT EXISTS kelas text,
  ADD COLUMN IF NOT EXISTS keperluan text,
  ADD COLUMN IF NOT EXISTS pukul text,
  ADD COLUMN IF NOT EXISTS alasan text,
  ADD COLUMN IF NOT EXISTS ortu text;

UPDATE public.panggilan_ortu
SET keperluan = alasan
WHERE keperluan IS NULL AND alasan IS NOT NULL;

UPDATE public.panggilan_ortu
SET ortu = 'Orang Tua'
WHERE ortu IS NULL;

ALTER TABLE public.panggilan_ortu
  ALTER COLUMN ortu DROP NOT NULL;
