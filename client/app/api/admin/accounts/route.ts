import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type AccountInput = {
  kind: 'student' | 'staff';
  email: string;
  password?: string;
  nama: string;
  role?: string;
  nisn?: string;
  kelas?: string;
  nip?: string;
};

const normalizeRole = (role: string, kind: AccountInput['kind']) => {
  const normalized = role.trim().toLowerCase();
  if (normalized.includes('admin') || normalized === 'tu' || normalized.includes('tata usaha')) return 'admin';
  if (normalized.includes('bk')) return 'bk';
  if (normalized.includes('piket')) return 'piket';
  if (normalized.includes('osis')) return 'osis';
  if (normalized.includes('mpk')) return 'mpk';
  return kind === 'student' ? 'siswa' : null;
};

async function getClients() {
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
  const adminClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return { sessionClient, adminClient };
}

async function requireAdministrator(sessionClient: Awaited<ReturnType<typeof getClients>>['sessionClient']) {
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) return false;

  const { data: profile, error: profileError } = await sessionClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();
  return !profileError && profile?.role === 'admin';
}

function parseAccount(value: unknown): AccountInput | null {
  if (!value || typeof value !== 'object') return null;
  const account = value as Record<string, unknown>;
  if (
    (account.kind !== 'student' && account.kind !== 'staff') ||
    typeof account.email !== 'string' ||
    typeof account.nama !== 'string'
  ) {
    return null;
  }

  return {
    kind: account.kind,
    email: account.email.trim().toLowerCase(),
    nama: account.nama.trim(),
    role: typeof account.role === 'string' ? account.role.trim() : undefined,
    password: typeof account.password === 'string' ? account.password : undefined,
    nisn: typeof account.nisn === 'string' ? account.nisn.trim() : undefined,
    kelas: typeof account.kelas === 'string' ? account.kelas.trim() : undefined,
    nip: typeof account.nip === 'string' ? account.nip.trim() : undefined,
  };
}

async function createAccount(adminClient: Awaited<ReturnType<typeof getClients>>['adminClient'], account: AccountInput) {
  if (!account.email || !account.nama || !account.password) {
    return { success: false, message: 'Nama, email, dan password wajib diisi.' };
  }

  const role = normalizeRole(account.role || (account.kind === 'student' ? 'siswa' : ''), account.kind);
  if (!role) return { success: false, message: 'Role staf tidak dikenal; akun tidak dibuat.' };
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    app_metadata: { role },
  });
  if (authError || !authData.user) {
    return { success: false, message: authError?.message || 'Akun autentikasi gagal dibuat.' };
  }

  let legacyId: string | number | null = null;
  if (account.kind === 'student') {
    const { data, error } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        email: account.email,
        nama: account.nama,
        role: 'Siswa',
        nisn: account.nisn || null,
        kelas: account.kelas || null,
      })
      .select('id')
      .single();
    if (error) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { success: false, message: `Gagal menyimpan data siswa: ${error.message}` };
    }
    legacyId = data.id;
  } else {
    const { data, error } = await adminClient
      .from('admin_roles')
      .insert({
        email: account.email,
        nama: account.nama,
        role: account.role || 'GURU BK',
        nip: account.nip || null,
      })
      .select('id')
      .single();
    if (error) {
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { success: false, message: `Gagal menyimpan data staf: ${error.message}` };
    }
    legacyId = data.id;
  }

  const profile = {
    user_id: authData.user.id,
    role,
    display_name: account.nama,
    kelas: account.kelas || null,
    email: account.email,
    student_record_id: account.kind === 'student' ? legacyId : null,
    legacy_admin_id: account.kind === 'staff' ? legacyId : null,
  };
  const { error: profileError } = await adminClient.from('user_profiles').insert(profile);
  if (profileError) {
    if (account.kind === 'student') {
      await adminClient.from('users').delete().eq('id', legacyId);
    } else {
      await adminClient.from('admin_roles').delete().eq('id', legacyId);
    }
    await adminClient.auth.admin.deleteUser(authData.user.id);
    return { success: false, message: `Gagal membuat profil akses: ${profileError.message}` };
  }

  return { success: true };
}

export async function POST(request: Request) {
  try {
    const { sessionClient, adminClient } = await getClients();
    if (!(await requireAdministrator(sessionClient))) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const bodyValue: unknown = await request.json();
    if (!bodyValue || typeof bodyValue !== 'object') {
      return NextResponse.json({ error: 'Data akun tidak valid.' }, { status: 400 });
    }
    const body = bodyValue as Record<string, unknown>;
    const inputAccounts: unknown[] = Array.isArray(body.accounts) ? body.accounts : [body.account];
    const parsedAccounts = inputAccounts.map((value) => parseAccount(value));
    const accounts = parsedAccounts.filter((account): account is AccountInput => account !== null);
    if (!accounts.length || accounts.length !== inputAccounts.length) {
      return NextResponse.json({ error: 'Data akun tidak valid.' }, { status: 400 });
    }

    let created = 0;
    const failed: Array<{ email: string; message: string }> = [];
    for (const account of accounts) {
      const result = await createAccount(adminClient, account);
      if (result.success) {
        created += 1;
      } else {
        failed.push({ email: account.email, message: result.message || 'Gagal membuat akun.' });
      }
    }
    return NextResponse.json(
      { created, failed },
      { status: failed.length ? 207 : 201 }
    );
  } catch (error) {
    console.error('Gagal membuat akun:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal membuat akun.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { sessionClient, adminClient } = await getClients();
    if (!(await requireAdministrator(sessionClient))) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const bodyValue: unknown = await request.json();
    if (!bodyValue || typeof bodyValue !== 'object') {
      return NextResponse.json({ error: 'Data perubahan akun tidak valid.' }, { status: 400 });
    }
    const body = bodyValue as Record<string, unknown>;
    const account = parseAccount(body.account);
    const legacyId = body.legacyId;
    if (!account || legacyId === undefined || legacyId === null || typeof legacyId === 'object') {
      return NextResponse.json({ error: 'Data perubahan akun tidak valid.' }, { status: 400 });
    }

    const profileQuery = account.kind === 'student'
      ? adminClient.from('user_profiles').select('user_id').eq('student_record_id', legacyId)
      : adminClient.from('user_profiles').select('user_id').eq('legacy_admin_id', legacyId);
    const { data: profile, error: profileError } = await profileQuery.single();
    if (profileError || !profile) {
      return NextResponse.json({ error: `Profil autentikasi tidak ditemukan: ${profileError?.message || ''}` }, { status: 404 });
    }

    const role = normalizeRole(account.role || (account.kind === 'student' ? 'siswa' : ''), account.kind);
    if (!role) {
      return NextResponse.json({ error: 'Role staf tidak dikenal; perubahan dibatalkan.' }, { status: 400 });
    }
    const authUpdates: { email: string; email_confirm: boolean; password?: string; app_metadata: { role: string } } = {
      email: account.email,
      email_confirm: true,
      app_metadata: { role },
    };
    if (account.password) authUpdates.password = account.password;

    const { error: authError } = await adminClient.auth.admin.updateUserById(profile.user_id, authUpdates);
    if (authError) {
      return NextResponse.json({ error: `Gagal memperbarui autentikasi: ${authError.message}` }, { status: 400 });
    }

    const { error: recordError } = account.kind === 'student'
      ? await adminClient.from('users').update({
          email: account.email,
          nama: account.nama,
          role: 'Siswa',
          nisn: account.nisn || null,
          kelas: account.kelas || null,
        }).eq('id', legacyId)
      : await adminClient.from('admin_roles').update({
          email: account.email,
          nama: account.nama,
          role: account.role || 'GURU BK',
          nip: account.nip || null,
        }).eq('id', legacyId);
    if (recordError) {
      return NextResponse.json({ error: `Autentikasi berubah, tetapi data akun gagal diperbarui: ${recordError.message}` }, { status: 500 });
    }

    const { error: updateProfileError } = await adminClient
      .from('user_profiles')
      .update({ role, display_name: account.nama, kelas: account.kelas || null, email: account.email })
      .eq('user_id', profile.user_id);
    if (updateProfileError) {
      return NextResponse.json({ error: `Data akun berubah, tetapi profil akses gagal diperbarui: ${updateProfileError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gagal memperbarui akun:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memperbarui akun.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { sessionClient, adminClient } = await getClients();
    if (!(await requireAdministrator(sessionClient))) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const bodyValue: unknown = await request.json();
    if (!bodyValue || typeof bodyValue !== 'object') {
      return NextResponse.json({ error: 'Identitas akun tidak valid.' }, { status: 400 });
    }
    const body = bodyValue as Record<string, unknown>;
    if (
      (body.kind !== 'student' && body.kind !== 'staff') ||
      body.legacyId === undefined ||
      body.legacyId === null
    ) {
      return NextResponse.json({ error: 'Identitas akun tidak valid.' }, { status: 400 });
    }

    const profileQuery = body.kind === 'student'
      ? adminClient.from('user_profiles').select('user_id').eq('student_record_id', body.legacyId)
      : adminClient.from('user_profiles').select('user_id').eq('legacy_admin_id', body.legacyId);
    const { data: profile, error: profileError } = await profileQuery.single();
    if (profileError || !profile) {
      return NextResponse.json({ error: `Profil autentikasi tidak ditemukan: ${profileError?.message || ''}` }, { status: 404 });
    }

    const { error: authError } = await adminClient.auth.admin.deleteUser(profile.user_id);
    if (authError) {
      return NextResponse.json({ error: `Gagal menghapus akun autentikasi: ${authError.message}` }, { status: 500 });
    }

    const { error: recordError } = body.kind === 'student'
      ? await adminClient.from('users').delete().eq('id', body.legacyId)
      : await adminClient.from('admin_roles').delete().eq('id', body.legacyId);
    if (recordError) {
      return NextResponse.json({ error: `Akun dinonaktifkan, tetapi data lama gagal dihapus: ${recordError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Gagal menghapus akun:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menghapus akun.' },
      { status: 500 }
    );
  }
}
