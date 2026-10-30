import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceRoleKey) {
      throw new Error('Konfigurasi Supabase server belum lengkap.');
    }

    const cookieStore = await cookies();
    const sessionClient = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    });
    const { data: { user }, error: sessionError } = await sessionClient.auth.getUser();
    if (sessionError || !user) {
      return NextResponse.json({ error: 'Sesi administrator tidak valid.' }, { status: 401 });
    }

    const { data: adminProfile, error: adminProfileError } = await sessionClient
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (adminProfileError || adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Data reset password tidak valid.' }, { status: 400 });
    }
    const input = body as Record<string, unknown>;
    const legacyStudentId = typeof input.legacyStudentId === 'string' ? input.legacyStudentId : '';
    const password = typeof input.password === 'string' ? input.password : '';
    if (!legacyStudentId || password.length < 12) {
      return NextResponse.json({ error: 'ID siswa tidak valid atau password sementara kurang dari 12 karakter.' }, { status: 400 });
    }

    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: student, error: studentError } = await adminClient
      .from('users')
      .select('id,nisn,nama,kelas,email,role')
      .eq('id', legacyStudentId)
      .single();
    if (studentError || !student) {
      return NextResponse.json({ error: 'Data siswa tidak ditemukan.' }, { status: 404 });
    }
    const studentRole = String(student.role || '').trim().toLowerCase();
    if (studentRole && !studentRole.includes('siswa')) {
      return NextResponse.json({ error: 'Data ini bukan akun siswa.' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('user_id')
      .eq('student_record_id', legacyStudentId)
      .maybeSingle();
    if (profileError) {
      return NextResponse.json({ error: `Gagal memeriksa profil siswa: ${profileError.message}` }, { status: 500 });
    }

    let authUserId = profile?.user_id;
    let authUser: Awaited<ReturnType<typeof adminClient.auth.admin.getUserById>>['data']['user'] = null;

    if (authUserId) {
      const { data, error } = await adminClient.auth.admin.getUserById(authUserId);
      if (error || !data.user) {
        return NextResponse.json({ error: `Akun Auth siswa tidak dapat ditemukan: ${error?.message || ''}` }, { status: 404 });
      }
      authUser = data.user;
    } else {
      const canonicalEmail = String(student.email || '').trim().toLowerCase();
      const loginEmail = isValidEmail(canonicalEmail)
        ? canonicalEmail
        : `student-${student.id}@students.budibakti.sch.id`;
      const { data: emailOwner, error: emailOwnerError } = await adminClient
        .from('users')
        .select('id')
        .eq('email', loginEmail)
        .neq('id', legacyStudentId)
        .limit(1)
        .maybeSingle();
      if (emailOwnerError) {
        return NextResponse.json({ error: `Gagal memeriksa email login siswa: ${emailOwnerError.message}` }, { status: 500 });
      }
      if (emailOwner) {
        return NextResponse.json({ error: 'Email login siswa dipakai oleh data siswa lain. Perbaiki duplikasi email terlebih dahulu.' }, { status: 409 });
      }

      let matchedAuthUser = null;
      for (let page = 1; ; page += 1) {
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) {
          return NextResponse.json({ error: `Gagal mencari akun Auth siswa: ${error.message}` }, { status: 503 });
        }
        matchedAuthUser = data.users.find((candidate) => candidate.email?.toLowerCase() === loginEmail) || null;
        if (matchedAuthUser || data.users.length < 1000) break;
      }

      if (matchedAuthUser) {
        const { data: linkedProfile, error: linkedProfileError } = await adminClient
          .from('user_profiles')
          .select('student_record_id,legacy_admin_id,role')
          .eq('user_id', matchedAuthUser.id)
          .maybeSingle();
        if (linkedProfileError) {
          return NextResponse.json({ error: `Gagal memeriksa tautan akun Auth: ${linkedProfileError.message}` }, { status: 500 });
        }
        if (
          linkedProfile?.legacy_admin_id ||
          (linkedProfile?.student_record_id && linkedProfile.student_record_id !== legacyStudentId) ||
          (linkedProfile?.role && linkedProfile.role !== 'siswa')
        ) {
          return NextResponse.json({ error: 'Email Auth tersebut sudah tertaut ke data siswa lain.' }, { status: 409 });
        }
        authUserId = matchedAuthUser.id;
      } else {
        const { data, error } = await adminClient.auth.admin.createUser({
          email: loginEmail,
          password,
          email_confirm: true,
          app_metadata: { role: 'siswa', password_reset_required: true },
          user_metadata: { nisn: student.nisn || null },
        });
        if (error || !data.user) {
          return NextResponse.json({ error: `Gagal menyiapkan akun Auth siswa: ${error?.message || ''}` }, { status: 400 });
        }
        authUserId = data.user.id;
        authUser = data.user;
      }

      if (!authUser) {
        const { data, error } = await adminClient.auth.admin.getUserById(authUserId);
        if (error || !data.user) {
          return NextResponse.json({ error: `Akun Auth siswa tidak dapat ditemukan: ${error?.message || ''}` }, { status: 404 });
        }
        authUser = data.user;
      }

      const { error: profileUpsertError } = await adminClient.from('user_profiles').upsert({
        user_id: authUserId,
        role: 'siswa',
        display_name: student.nama || loginEmail,
        kelas: student.kelas || null,
        email: loginEmail,
        student_record_id: student.id,
        legacy_admin_id: null,
      }, { onConflict: 'user_id' });
      if (profileUpsertError) {
        return NextResponse.json({ error: `Akun Auth dibuat, tetapi profil siswa gagal disiapkan: ${profileUpsertError.message}` }, { status: 500 });
      }

      if (canonicalEmail !== loginEmail) {
        const { error: studentEmailError } = await adminClient
          .from('users')
          .update({ email: loginEmail })
          .eq('id', student.id);
        if (studentEmailError) {
          return NextResponse.json({ error: `Profil login dibuat, tetapi email internal siswa gagal disimpan: ${studentEmailError.message}` }, { status: 500 });
        }
      }
    }

    if (!authUserId || !authUser) {
      return NextResponse.json({ error: 'Akun Auth siswa belum siap.' }, { status: 500 });
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(authUserId, {
      password,
      app_metadata: {
        ...authUser.app_metadata,
        role: 'siswa',
        password_reset_required: true,
      },
    });
    if (updateError) {
      return NextResponse.json({ error: `Gagal mereset password: ${updateError.message}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gagal mereset password siswa:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal mereset password siswa.' },
      { status: 500 },
    );
  }
}
