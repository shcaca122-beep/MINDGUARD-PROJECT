CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_record_id uuid UNIQUE REFERENCES public.users(id) ON DELETE SET NULL,
  legacy_admin_id bigint UNIQUE REFERENCES public.admin_roles(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('admin', 'bk', 'piket', 'osis', 'mpk', 'siswa')),
  display_name text,
  kelas text,
  email text
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_profiles FROM anon, authenticated;
GRANT SELECT ON public.user_profiles TO authenticated;

CREATE POLICY "Users can read their own profile"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.user_profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_student_record_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT student_record_id
  FROM public.user_profiles
  WHERE user_id = auth.uid() AND role = 'siswa'
$$;

REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_student_record_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_student_record_id() TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.users FROM anon, authenticated;
GRANT SELECT (id, email, role, nama, nisn, kelas) ON public.users TO authenticated;

CREATE POLICY "Students and authorized staff can read student directory"
  ON public.users FOR SELECT TO authenticated
  USING (
    id = public.current_student_record_id()
    OR public.current_app_role() IN ('admin', 'osis', 'mpk', 'piket')
  );

CREATE POLICY "Administrators manage student accounts"
  ON public.users FOR ALL TO authenticated
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

ALTER TABLE public.admin_roles ADD COLUMN IF NOT EXISTS nip text;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_roles FROM anon, authenticated;
GRANT SELECT (id, email, role, nama, nip) ON public.admin_roles TO authenticated;

CREATE POLICY "Administrators manage admin roles"
  ON public.admin_roles FOR ALL TO authenticated
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

ALTER TABLE public.pelanggaran_siswa
  ADD COLUMN IF NOT EXISTS siswa_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.pelanggaran_siswa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pelanggaran_siswa FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pelanggaran_siswa TO authenticated;

CREATE POLICY "Students can read only their own violations"
  ON public.pelanggaran_siswa FOR SELECT TO authenticated
  USING (
    siswa_id = public.current_student_record_id()
    OR public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket')
  );

CREATE POLICY "Authorized staff can record violations"
  ON public.pelanggaran_siswa FOR INSERT TO authenticated
  WITH CHECK (public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket'));

CREATE POLICY "Administrators and counselors can update violations"
  ON public.pelanggaran_siswa FOR UPDATE TO authenticated
  USING (public.current_app_role() IN ('admin', 'bk'))
  WITH CHECK (public.current_app_role() IN ('admin', 'bk'));

CREATE POLICY "Administrators can delete violations"
  ON public.pelanggaran_siswa FOR DELETE TO authenticated
  USING (public.current_app_role() = 'admin');

ALTER TABLE public.laporan_pelanggaran ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.laporan_pelanggaran FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.laporan_pelanggaran TO authenticated;

CREATE POLICY "Staff can manage violation reports"
  ON public.laporan_pelanggaran FOR ALL TO authenticated
  USING (public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket'))
  WITH CHECK (public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket'));

ALTER TABLE public.keterlambatan ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.keterlambatan FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.keterlambatan TO authenticated;

CREATE POLICY "Staff can manage lateness records"
  ON public.keterlambatan FOR ALL TO authenticated
  USING (public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket'))
  WITH CHECK (public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket'));

ALTER TABLE public.konseling ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.konseling FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.konseling TO authenticated;

CREATE POLICY "Administrators and counselors manage counseling records"
  ON public.konseling FOR ALL TO authenticated
  USING (public.current_app_role() IN ('admin', 'bk'))
  WITH CHECK (public.current_app_role() IN ('admin', 'bk'));

ALTER TABLE public.home_visit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.home_visit FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_visit TO authenticated;

CREATE POLICY "Administrators and counselors manage home visits"
  ON public.home_visit FOR ALL TO authenticated
  USING (public.current_app_role() IN ('admin', 'bk'))
  WITH CHECK (public.current_app_role() IN ('admin', 'bk'));

ALTER TABLE public.panggilan_ortu ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.panggilan_ortu FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.panggilan_ortu TO authenticated;

CREATE POLICY "Administrators and counselors manage parent calls"
  ON public.panggilan_ortu FOR ALL TO authenticated
  USING (public.current_app_role() IN ('admin', 'bk'))
  WITH CHECK (public.current_app_role() IN ('admin', 'bk'));

ALTER TABLE public.master_foto_siswa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.master_foto_siswa FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_foto_siswa TO authenticated;

CREATE POLICY "Authorized staff can access student reference photos"
  ON public.master_foto_siswa FOR ALL TO authenticated
  USING (public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket'))
  WITH CHECK (public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket'));

ALTER TABLE public.master_pelanggaran ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.master_pelanggaran FROM anon;
GRANT SELECT ON public.master_pelanggaran TO authenticated;

CREATE POLICY "Authenticated staff can read violation categories"
  ON public.master_pelanggaran FOR SELECT TO authenticated
  USING (public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket'));

ALTER TABLE public.jenis_layanan ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.jenis_layanan FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jenis_layanan TO authenticated;

CREATE POLICY "Administrators manage service types"
  ON public.jenis_layanan FOR ALL TO authenticated
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

ALTER TABLE public.profil_sekolah ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profil_sekolah FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profil_sekolah TO authenticated;

CREATE POLICY "Administrators manage school profile"
  ON public.profil_sekolah FOR ALL TO authenticated
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

ALTER TABLE public.layanan_siswa ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.layanan_siswa FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.layanan_siswa TO authenticated;

CREATE POLICY "Students can read their own counseling requests"
  ON public.layanan_siswa FOR SELECT TO authenticated
  USING (
    lower(email_siswa) = lower(auth.jwt() ->> 'email')
    OR public.current_app_role() IN ('admin', 'bk')
  );

CREATE POLICY "Students and counselors can create counseling requests"
  ON public.layanan_siswa FOR INSERT TO authenticated
  WITH CHECK (
    lower(email_siswa) = lower(auth.jwt() ->> 'email')
    OR public.current_app_role() IN ('admin', 'bk')
  );

CREATE POLICY "Counselors can manage counseling requests"
  ON public.layanan_siswa FOR UPDATE TO authenticated
  USING (public.current_app_role() IN ('admin', 'bk'))
  WITH CHECK (public.current_app_role() IN ('admin', 'bk'));

ALTER TABLE public.pelanggaran ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pelanggaran FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pelanggaran TO authenticated;

CREATE POLICY "Staff can access legacy violations"
  ON public.pelanggaran FOR ALL TO authenticated
  USING (public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket'))
  WITH CHECK (public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket'));

UPDATE storage.buckets SET public = false WHERE id IN ('bukti-pelanggaran', 'foto-siswaq');

CREATE POLICY "Staff can access violation evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('bukti-pelanggaran', 'foto-siswaq')
    AND public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket')
  );

CREATE POLICY "Authorized staff can upload violation evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'bukti-pelanggaran'
    AND public.current_app_role() IN ('admin', 'bk', 'osis', 'mpk', 'piket')
  );

CREATE POLICY "Administrators can delete stored evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('bukti-pelanggaran', 'foto-siswaq')
    AND public.current_app_role() = 'admin'
  );

DO $$
DECLARE
  v_table_name text;
BEGIN
  FOREACH v_table_name IN ARRAY ARRAY['perizinan_siswa', 'izin_siswa']
  LOOP
    IF to_regclass(format('public.%I', v_table_name)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS siswa_id uuid REFERENCES public.users(id) ON DELETE SET NULL',
      v_table_name
    );
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon', v_table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', v_table_name);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table_name || '_grant_authenticated', v_table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table_name || '_read_privacy', v_table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table_name || '_insert_privacy', v_table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table_name || '_update_privacy', v_table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table_name || '_delete_privacy', v_table_name);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS PERMISSIVE FOR ALL TO authenticated
        USING (true) WITH CHECK (true)',
      v_table_name || '_grant_authenticated',
      v_table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (
        siswa_id = public.current_student_record_id()
        OR public.current_app_role() IN (''admin'', ''bk'', ''piket'')
      )',
      v_table_name || '_read_privacy',
      v_table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (
        (siswa_id = public.current_student_record_id() AND public.current_app_role() = ''siswa'')
        OR public.current_app_role() IN (''admin'', ''bk'', ''piket'')
      )',
      v_table_name || '_insert_privacy',
      v_table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated
        USING (public.current_app_role() IN (''admin'', ''bk'', ''piket''))
        WITH CHECK (public.current_app_role() IN (''admin'', ''bk'', ''piket''))',
      v_table_name || '_update_privacy',
      v_table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated
        USING (public.current_app_role() = ''admin'')',
      v_table_name || '_delete_privacy',
      v_table_name
    );
  END LOOP;
END;
$$;
