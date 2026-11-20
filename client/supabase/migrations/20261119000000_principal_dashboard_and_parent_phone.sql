ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS parent_phone text;

ALTER TABLE public.panggilan_ortu
  ADD COLUMN IF NOT EXISTS parent_phone text;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin', 'bk', 'piket', 'osis', 'mpk', 'siswa', 'kepala_sekolah'));

DROP POLICY IF EXISTS "Students and authorized staff can read student directory" ON public.users;
CREATE POLICY "Students and authorized staff can read student directory"
  ON public.users FOR SELECT TO authenticated
  USING (
    id = public.current_student_record_id()
    OR public.current_app_role() IN ('admin', 'osis', 'mpk', 'piket', 'kepala_sekolah')
  );

DROP POLICY IF EXISTS "Students can read only their own violations" ON public.pelanggaran_siswa;
CREATE POLICY "Students can read only their own violations"
  ON public.pelanggaran_siswa FOR SELECT TO authenticated
  USING (
    siswa_id = public.current_student_record_id()
    OR public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket', 'kepala_sekolah')
  );

DROP POLICY IF EXISTS "Principal can read legacy violation activity" ON public.pelanggaran;
CREATE POLICY "Principal can read legacy violation activity"
  ON public.pelanggaran FOR SELECT TO authenticated
  USING (public.current_app_role() = 'kepala_sekolah');

DROP POLICY IF EXISTS "Principal can read school counseling activity" ON public.layanan_siswa;
CREATE POLICY "Principal can read school counseling activity"
  ON public.layanan_siswa FOR SELECT TO authenticated
  USING (public.current_app_role() = 'kepala_sekolah');

DROP POLICY IF EXISTS "Principal can read parent call activity" ON public.panggilan_ortu;
CREATE POLICY "Principal can read parent call activity"
  ON public.panggilan_ortu FOR SELECT TO authenticated
  USING (public.current_app_role() = 'kepala_sekolah');

DROP POLICY IF EXISTS "Principal can read home visit activity" ON public.home_visit;
CREATE POLICY "Principal can read home visit activity"
  ON public.home_visit FOR SELECT TO authenticated
  USING (public.current_app_role() = 'kepala_sekolah');

DROP POLICY IF EXISTS "Principal can read lateness activity" ON public.keterlambatan;
CREATE POLICY "Principal can read lateness activity"
  ON public.keterlambatan FOR SELECT TO authenticated
  USING (public.current_app_role() = 'kepala_sekolah');

DO $$
DECLARE
  v_table_name text;
BEGIN
  FOREACH v_table_name IN ARRAY ARRAY['perizinan_siswa', 'izin_siswa']
  LOOP
    IF to_regclass(format('public.%I', v_table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table_name || '_read_privacy', v_table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (
        siswa_id = public.current_student_record_id()
        OR public.current_app_role() IN (''admin'', ''bk'', ''piket'', ''kepala_sekolah'')
      )',
      v_table_name || '_read_privacy',
      v_table_name
    );
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';

CREATE OR REPLACE FUNCTION public.get_student_parent_phone(p_student_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT parent_phone
  FROM public.users
  WHERE id = p_student_id
    AND public.current_app_role() IN ('admin', 'bk')
$$;

REVOKE ALL ON FUNCTION public.get_student_parent_phone(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_parent_phone(uuid)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.get_student_parent_contacts()
RETURNS TABLE(student_id uuid, parent_phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT id, parent_phone
  FROM public.users
  WHERE public.current_app_role() = 'admin'
$$;

REVOKE ALL ON FUNCTION public.get_student_parent_contacts()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_parent_contacts()
  TO authenticated;

DO $$
DECLARE
  v_table_name text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RETURN;
  END IF;

  FOREACH v_table_name IN ARRAY ARRAY[
    'layanan_siswa',
    'pelanggaran',
    'panggilan_ortu',
    'home_visit',
    'keterlambatan',
    'perizinan_siswa'
  ]
  LOOP
    IF to_regclass(format('public.%I', v_table_name)) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = v_table_name
      )
    THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table_name);
    END IF;
  END LOOP;
END;
$$;
