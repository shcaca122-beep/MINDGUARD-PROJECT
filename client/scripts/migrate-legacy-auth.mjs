import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in client/.env.local.');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const canonicalRole = (value, isAdminTable = false) => {
  const role = String(value || '').trim().toLowerCase();
  if (role.includes('admin') || role === 'tu' || role.includes('tata usaha')) return 'admin';
  if (role.includes('bk')) return 'bk';
  if (role.includes('piket')) return 'piket';
  if (role.includes('osis')) return 'osis';
  if (role.includes('mpk')) return 'mpk';
  return isAdminTable ? null : 'siswa';
};

const accounts = [];
const [studentsResult, adminsResult] = await Promise.all([
  admin.from('users').select('id,email,password,role,nama,kelas'),
  admin.from('admin_roles').select('id,email,password,role,nama'),
]);

if (studentsResult.error) throw new Error(`Gagal membaca tabel users: ${studentsResult.error.message}`);
if (adminsResult.error) throw new Error(`Gagal membaca tabel admin_roles: ${adminsResult.error.message}`);

const authUsersByEmail = new Map();
for (let page = 1; ; page += 1) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw new Error(`Gagal membaca akun Supabase Auth: ${error.message}`);
  for (const user of data.users) {
    if (user.email) authUsersByEmail.set(user.email.toLowerCase(), user);
  }
  if (data.users.length < 1000) break;
}

for (const student of studentsResult.data || []) {
  accounts.push({
    source: 'users',
    legacyStudentId: student.id,
    email: student.email,
    password: student.password,
    role: canonicalRole(student.role),
    displayName: student.nama,
    kelas: student.kelas,
  });
}

for (const staff of adminsResult.data || []) {
  accounts.push({
    source: 'admin_roles',
    legacyAdminId: staff.id,
    email: staff.email,
    password: staff.password,
    role: canonicalRole(staff.role, true),
    displayName: staff.nama,
  });
}

let migrated = 0;
let skipped = 0;
const failures = [];
const emailCounts = new Map();
for (const account of accounts) {
  const email = String(account.email || '').trim().toLowerCase();
  if (email) emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
}

for (const account of accounts) {
  const email = String(account.email || '').trim().toLowerCase();
  const password = String(account.password || '');
  if (email && emailCounts.get(email) > 1) {
    failures.push({ source: account.source, message: 'Duplicate legacy email; resolve account ownership before migration.' });
    continue;
  }
  if (!account.role) {
    failures.push({ source: account.source, message: 'Unknown staff role; assign a least-privilege role manually.' });
    continue;
  }
  if (!email || !password) {
    skipped += 1;
    continue;
  }

  let authUser = authUsersByEmail.get(email);
  if (authUser) {
    const { data, error } = await admin.auth.admin.updateUserById(authUser.id, {
      password,
      email_confirm: true,
      app_metadata: { ...authUser.app_metadata, role: account.role },
    });
    if (error || !data.user) {
      failures.push({ source: account.source, message: error?.message || 'Auth user could not be updated.' });
      continue;
    }
    authUser = data.user;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: account.role },
    });
    if (error || !data.user) {
      failures.push({ source: account.source, message: error?.message || 'Auth user was not created.' });
      continue;
    }
    authUser = data.user;
    authUsersByEmail.set(email, authUser);
  }

  const profile = {
    user_id: authUser.id,
    role: account.role,
    display_name: account.displayName || email,
    kelas: account.kelas || null,
    email,
    student_record_id: account.legacyStudentId || null,
    legacy_admin_id: account.legacyAdminId || null,
  };

  const { error: profileError } = await admin.from('user_profiles').upsert(profile, { onConflict: 'user_id' });
  if (profileError) {
    failures.push({ source: account.source, message: `Profile insert failed: ${profileError.message}` });
    continue;
  }

  const { error: clearPasswordError } = await (account.source === 'users'
    ? admin.from('users').update({ password: null }).eq('id', account.legacyStudentId)
    : admin.from('admin_roles').update({ password: null }).eq('id', account.legacyAdminId));
  if (clearPasswordError) {
    failures.push({ source: account.source, message: `Auth/profile created but legacy password could not be cleared: ${clearPasswordError.message}` });
    continue;
  }

  migrated += 1;
}

console.info(`Migrated ${migrated} accounts. Skipped ${skipped} account(s) without an email/password.`);
if (failures.length) {
  console.error(`${failures.length} account(s) need manual resolution:`);
  for (const failure of failures) {
    console.error(`- ${failure.source}: ${failure.message}`);
  }
  process.exitCode = 1;
}
