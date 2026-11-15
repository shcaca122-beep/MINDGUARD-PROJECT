import { randomUUID } from 'node:crypto';
import { createServerClient } from '@supabase/ssr';
import { createClient, type User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type StudentRow = {
  id: string;
  nisn: string | null;
  nama: string | null;
  kelas: string | null;
  email: string | null;
  role: string | null;
  password: string | null;
};

type UserProfile = {
  user_id: string;
  student_record_id: string | null;
  legacy_admin_id: number | null;
  role: string;
};

type StudentPlan = {
  student: StudentRow;
  email: string;
  authUser?: User;
  validLegacyPassword: boolean;
};

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const noStore = { headers: { 'Cache-Control': 'no-store, max-age=0' } };

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
      return NextResponse.json({ error: 'Sesi administrator tidak valid.' }, { status: 401, ...noStore });
    }

    const { data: adminProfile, error: adminProfileError } = await sessionClient
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (adminProfileError || adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403, ...noStore });
    }

    const body: unknown = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Konfirmasi reset massal tidak valid.' }, { status: 400, ...noStore });
    }
    const input = body as Record<string, unknown>;
    const sharedPassword = typeof input.password === 'string' ? input.password : '';
    const confirmation = typeof input.confirmation === 'string' ? input.confirmation : '';
    if (sharedPassword.length < 12 || confirmation !== 'GANTI SEMUA') {
      return NextResponse.json({
        error: 'Masukkan password sementara minimal 12 karakter dan ketik GANTI SEMUA untuk konfirmasi.',
      }, { status: 400, ...noStore });
    }

    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const students: StudentRow[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await adminClient
        .from('users')
        .select('id,nisn,nama,kelas,email,role,password')
        .order('id', { ascending: true })
        .range(offset, offset + 499);
      if (error) throw new Error(`Gagal membaca data siswa: ${error.message}`);
      students.push(...((data || []) as StudentRow[]));
      if (!data || data.length < 500) break;
    }
    const studentAccounts = students.filter((student) => {
      const role = String(student.role || '').trim().toLowerCase();
      return !role || role.includes('siswa');
    });
    students.splice(0, students.length, ...studentAccounts);
    if (!students.length) {
      return NextResponse.json({ error: 'Tidak ada akun siswa di tabel users.' }, { status: 404, ...noStore });
    }

    const profiles: UserProfile[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await adminClient
        .from('user_profiles')
        .select('user_id,student_record_id,legacy_admin_id,role')
        .range(offset, offset + 999);
      if (error) throw new Error(`Gagal membaca profil login: ${error.message}`);
      profiles.push(...((data || []) as UserProfile[]));
      if (!data || data.length < 1000) break;
    }

    const authUsers: User[] = [];
    for (let page = 1; ; page += 1) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(`Gagal membaca akun Supabase Auth: ${error.message}`);
      authUsers.push(...data.users);
      if (data.users.length < 1000) break;
    }

    const profilesByStudentId = new Map(
      profiles.filter((profile) => profile.student_record_id).map((profile) => [profile.student_record_id as string, profile]),
    );
    const profilesByUserId = new Map(profiles.map((profile) => [profile.user_id, profile]));
    const authById = new Map(authUsers.map((authUser) => [authUser.id, authUser]));
    const authByEmail = new Map(
      authUsers.filter((authUser) => authUser.email).map((authUser) => [authUser.email!.toLowerCase(), authUser]),
    );
    const studentEmailCounts = new Map<string, number>();
    for (const student of students) {
      const email = String(student.email || '').trim().toLowerCase();
      if (validEmail(email)) studentEmailCounts.set(email, (studentEmailCounts.get(email) || 0) + 1);
    }

    const reservedEmails = new Set([
      ...authByEmail.keys(),
      ...students.map((student) => String(student.email || '').trim().toLowerCase()).filter(Boolean),
    ]);
    const makeInternalEmail = (studentId: string) => {
      let candidate = `student-${studentId}@students.budibakti.sch.id`;
      while (reservedEmails.has(candidate)) {
        candidate = `student-${studentId}-${randomUUID()}@students.budibakti.sch.id`;
      }
      reservedEmails.add(candidate);
      return candidate;
    };

    const plans: StudentPlan[] = [];
    for (const student of students) {
      const legacyEmail = String(student.email || '').trim().toLowerCase();
      const legacyEmailIsUnique = validEmail(legacyEmail) && studentEmailCounts.get(legacyEmail) === 1;
      const linkedProfile = profilesByStudentId.get(student.id);
      let authUser = linkedProfile ? authById.get(linkedProfile.user_id) : undefined;
      let email = authUser?.email?.toLowerCase() || '';

      if (!authUser && legacyEmailIsUnique) {
        const candidate = authByEmail.get(legacyEmail);
        const candidateProfile = candidate ? profilesByUserId.get(candidate.id) : undefined;
        const candidateIsAnotherAccount = Boolean(
          candidateProfile &&
          (candidateProfile.student_record_id !== student.id || candidateProfile.legacy_admin_id !== null || candidateProfile.role !== 'siswa'),
        ) || Boolean(candidate?.app_metadata?.role && candidate.app_metadata.role !== 'siswa');
        if (candidate && !candidateIsAnotherAccount) {
          authUser = candidate;
          email = candidate.email!.toLowerCase();
        } else if (!candidate) {
          email = legacyEmail;
        }
      }

      if (!email) email = makeInternalEmail(student.id);
      const emailOwner = authByEmail.get(email);
      if (emailOwner && (!authUser || emailOwner.id !== authUser.id)) {
        const ownerProfile = profilesByUserId.get(emailOwner.id);
        const isSafeStudentAccount = !ownerProfile && (!emailOwner.app_metadata?.role || emailOwner.app_metadata.role === 'siswa');
        if (isSafeStudentAccount) {
          authUser = emailOwner;
        } else {
          email = makeInternalEmail(student.id);
        }
      }

      plans.push({
        student,
        email,
        authUser,
        validLegacyPassword: Boolean(String(student.password || '')),
      });
    }

    const roster: Array<{
      nisn: string;
      studentId: string;
      nama: string;
      kelas: string;
      emailLogin: string;
    }> = [];
    const failed: Array<{ nisn: string; studentId: string; nama: string; message: string }> = [];
    let legacyPasswordClearFailures = 0;
    let nextPlanIndex = 0;

    const processPlan = async (plan: StudentPlan) => {
      const { student, email } = plan;
      let authUser = plan.authUser;

      if (authUser) {
        const { data, error } = await adminClient.auth.admin.updateUserById(authUser.id, {
          email,
          password: sharedPassword,
          email_confirm: true,
          app_metadata: { ...authUser.app_metadata, role: 'siswa', password_reset_required: true },
        });
        if (error || !data.user) throw new Error(`Gagal mengganti password Auth: ${error?.message || 'akun tidak ditemukan.'}`);
        authUser = data.user;
      } else {
        const { data, error } = await adminClient.auth.admin.createUser({
          email,
          password: sharedPassword,
          email_confirm: true,
          app_metadata: { role: 'siswa', password_reset_required: true },
          user_metadata: { nisn: student.nisn },
        });
        if (error || !data.user) throw new Error(`Gagal membuat akun Auth: ${error?.message || 'akun tidak dibuat.'}`);
        authUser = data.user;
      }

      roster.push({
        nisn: student.nisn || '',
        studentId: student.id,
        nama: student.nama || '',
        kelas: student.kelas || '',
        emailLogin: email,
      });

      const { error: profileUpsertError } = await adminClient.from('user_profiles').upsert({
        user_id: authUser.id,
        role: 'siswa',
        display_name: student.nama || email,
        kelas: student.kelas || null,
        email,
        student_record_id: student.id,
        legacy_admin_id: null,
      }, { onConflict: 'user_id' });
      if (profileUpsertError) throw new Error(`Password diganti, tetapi profil login gagal disimpan: ${profileUpsertError.message}`);

      if (String(student.email || '').trim().toLowerCase() !== email) {
        const { error: emailUpdateError } = await adminClient.from('users').update({ email }).eq('id', student.id);
        if (emailUpdateError) throw new Error(`Password diganti, tetapi email login gagal disimpan: ${emailUpdateError.message}`);
      }

      if (plan.validLegacyPassword) {
        const { error: clearPasswordError } = await adminClient
          .from('users')
          .update({ password: null })
          .eq('id', student.id);
        if (clearPasswordError) legacyPasswordClearFailures += 1;
      }

    };

    const worker = async () => {
      while (true) {
        const planIndex = nextPlanIndex;
        nextPlanIndex += 1;
        if (planIndex >= plans.length) return;
        const plan = plans[planIndex];
        try {
          await processPlan(plan);
        } catch (error) {
          failed.push({
            nisn: plan.student.nisn || '',
            studentId: plan.student.id,
            nama: plan.student.nama || '',
            message: error instanceof Error ? error.message : 'Gagal mengganti password akun.',
          });
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(8, plans.length) }, () => worker()));

    if (!roster.length) {
      return NextResponse.json({
        error: 'Tidak ada password yang berhasil diganti.',
        total: students.length,
        failed,
      }, { status: 500, ...noStore });
    }

    return NextResponse.json({
      total: students.length,
      changed: roster.length,
      failed,
      legacyPasswordClearFailures,
      roster,
    }, noStore);
  } catch (error) {
    console.error('Reset massal password siswa gagal:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Reset massal password siswa gagal.' },
      { status: 500, ...noStore },
    );
  }
}
