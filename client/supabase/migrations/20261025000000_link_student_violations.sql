ALTER TABLE public.pelanggaran
  ADD COLUMN IF NOT EXISTS student_record_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.pelanggaran
  ADD COLUMN IF NOT EXISTS nama_siswa text;

ALTER TABLE public.pelanggaran
  ADD COLUMN IF NOT EXISTS keterangan text;

DO $$
DECLARE
  v_name_column text;
BEGIN
  SELECT column_name
  INTO v_name_column
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'pelanggaran'
    AND column_name IN ('nama', 'nama_pelanggar', 'student_name')
  ORDER BY CASE column_name
    WHEN 'nama' THEN 1
    WHEN 'nama_pelanggar' THEN 2
    ELSE 3
  END
  LIMIT 1;

  IF v_name_column IS NOT NULL THEN
    EXECUTE format(
      'UPDATE public.pelanggaran
       SET nama_siswa = NULLIF(trim(%I::text), '''')
       WHERE nama_siswa IS NULL
         AND %I IS NOT NULL',
      v_name_column,
      v_name_column
    );
  END IF;
END;
$$;

WITH uniquely_matched_violations AS (
  SELECT
    violation.id,
    (array_agg(student.id))[1] AS student_id
  FROM public.pelanggaran AS violation
  JOIN public.users AS student
    ON lower(trim(student.nama)) = lower(trim(violation.nama_siswa))
  WHERE violation.student_record_id IS NULL
    AND (student.role IS NULL OR lower(trim(student.role)) LIKE '%siswa%')
  GROUP BY violation.id
  HAVING COUNT(student.id) = 1
)
UPDATE public.pelanggaran AS violation
SET student_record_id = matched.student_id
FROM uniquely_matched_violations AS matched
WHERE violation.id = matched.id;

WITH uniquely_matched_student_violations AS (
  SELECT
    violation.id,
    (array_agg(student.id))[1] AS student_id
  FROM public.pelanggaran_siswa AS violation
  JOIN public.users AS student
    ON lower(trim(student.nama)) = lower(trim(violation.nama_siswa))
   AND regexp_replace(lower(trim(student.kelas)), '[^a-z0-9]', '', 'g') =
       regexp_replace(lower(trim(violation.kelas)), '[^a-z0-9]', '', 'g')
  WHERE violation.siswa_id IS NULL
    AND NULLIF(trim(violation.nama_siswa), '') IS NOT NULL
    AND NULLIF(trim(violation.kelas), '') IS NOT NULL
    AND (student.role IS NULL OR lower(trim(student.role)) LIKE '%siswa%')
  GROUP BY violation.id
  HAVING COUNT(student.id) = 1
)
UPDATE public.pelanggaran_siswa AS violation
SET siswa_id = matched.student_id
FROM uniquely_matched_student_violations AS matched
WHERE violation.id = matched.id;

ALTER TABLE public.pelanggaran ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.pelanggaran TO authenticated;

DROP POLICY IF EXISTS "Students can read their linked legacy violations" ON public.pelanggaran;
CREATE POLICY "Students can read their linked legacy violations"
  ON public.pelanggaran FOR SELECT TO authenticated
  USING (student_record_id = public.current_student_record_id());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'pelanggaran'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.pelanggaran;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'pelanggaran_siswa'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.pelanggaran_siswa;
    END IF;
  END IF;
END;
$$;
