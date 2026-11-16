CREATE INDEX IF NOT EXISTS layanan_siswa_konseling_tanggal_idx
  ON public.layanan_siswa (tanggal)
  WHERE layanan = 'KONSELING';

CREATE OR REPLACE FUNCTION public.book_counseling_slot(
  p_email_siswa text,
  p_nama_siswa text,
  p_kelas text,
  p_tanggal text,
  p_judul_pesan text,
  p_topik text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_tanggal, 0));

  IF EXISTS (
    SELECT 1
    FROM public.layanan_siswa
    WHERE layanan = 'KONSELING'
      AND tanggal = p_tanggal
      AND upper(coalesce(status, '')) NOT IN ('DITOLAK', 'DIBATALKAN')
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.layanan_siswa (
    nama_siswa,
    email_siswa,
    kelas,
    layanan,
    tanggal,
    tujuan_konselor,
    judul_pesan,
    topik,
    status
  ) VALUES (
    p_nama_siswa,
    p_email_siswa,
    p_kelas,
    'KONSELING',
    p_tanggal,
    'Guru BK',
    p_judul_pesan,
    p_topik,
    'MENUNGGU ACC'
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.book_counseling_slot(text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_counseling_slot(text, text, text, text, text, text)
  TO service_role;
