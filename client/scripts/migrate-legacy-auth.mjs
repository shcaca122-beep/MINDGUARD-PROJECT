import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

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
console.info('Memeriksa skema tabel user_profiles...');
const { error: profileSchemaError } = await admin
  .from('user_profiles')
  .select('user_id,role,display_name,student_record_id,legacy_admin_id,email,kelas')
  .limit(1);

if (profileSchemaError) {
  throw new Error(
    `Tabel public.user_profiles belum siap: ${profileSchemaError.message}. Jalankan client/supabase/migrations/20261020000000_role_based_privacy.sql di Supabase SQL Editor, lalu coba lagi.`,
  );
}

console.info('Membaca akun lama dari tabel users dan admin_roles...');
const [studentsResult, adminsResult] = await Promise.all([
  admin.from('users').select('id,nisn,email,password,role,nama,kelas'),
  admin.from('admin_roles').select('id,email,password,role,nama'),
]);

if (studentsResult.error) throw new Error(`Gagal membaca tabel users: ${studentsResult.error.message}`);
if (adminsResult.error) throw new Error(`Gagal membaca tabel admin_roles: ${adminsResult.error.message}`);
console.info(`Akun lama terbaca: ${studentsResult.data.length} siswa, ${adminsResult.data.length} staf.`);

const { data: existingProfiles, error: profilesError } = await admin
  .from('user_profiles')
  .select('user_id,student_record_id,email')
  .not('student_record_id', 'is', null);
if (profilesError) throw new Error(`Gagal membaca profil siswa: ${profilesError.message}`);

const profilesByStudentId = new Map(
  (existingProfiles || []).map((profile) => [profile.student_record_id, profile]),
);
const authUsersByEmail = new Map();
const authUsersById = new Map();
console.info('Membaca daftar akun Supabase Auth...');
for (let page = 1; ; page += 1) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw new Error(`Gagal membaca akun Supabase Auth: ${error.message}`);
  for (const user of data.users) {
    authUsersById.set(user.id, user);
    if (user.email) authUsersByEmail.set(user.email.toLowerCase(), user);
  }
  console.info(`Halaman Auth ${page}: ${data.users.length} akun.`);
  if (data.users.length < 1000) break;
}
console.info(`Total akun Supabase Auth terbaca: ${authUsersByEmail.size}.`);

for (const student of studentsResult.data || []) {
  accounts.push({
    source: 'users',
    legacyStudentId: student.id,
    nisn: student.nisn,
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
let resetRequired = 0;
const studentsNeedingPasswordReset = [];
const failures = [];
const emailCounts = new Map();
for (const account of accounts) {
  const email = String(account.email || '').trim().toLowerCase();
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
  }
}

for (const [index, account] of accounts.entries()) {
  console.info(`Memproses akun ${index + 1}/${accounts.length} dari ${account.source}...`);
  const legacyEmail = String(account.email || '').trim().toLowerCase();
  const password = String(account.password || '');
  if (!account.role) {
    failures.push({ source: account.source, message: 'Unknown staff role; assign a least-privilege role manually.' });
    continue;
  }

  const validUniqueEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(legacyEmail) &&
    emailCounts.get(legacyEmail) === 1;
  const linkedProfile = account.source === 'users'
    ? profilesByStudentId.get(account.legacyStudentId)
    : null;
  let authUser = linkedProfile
    ? authUsersById.get(linkedProfile.user_id)
    : validUniqueEmail
      ? authUsersByEmail.get(legacyEmail)
      : undefined;

  let email = authUser?.email?.toLowerCase() || (validUniqueEmail ? legacyEmail : '');
  if (!email && account.source === 'users') {
    email = `student-${account.legacyStudentId}@students.budibakti.sch.id`;
  }
  if (!email) {
    skipped += 1;
    failures.push({ source: account.source, message: 'Missing or invalid email; staff account needs a valid email before migration.' });
    continue;
  }

  if (!authUser) {
    authUser = authUsersByEmail.get(email);
    if (authUser && account.source === 'users' && !validUniqueEmail) {
      failures.push({ source: account.source, message: 'Generated login email already belongs to another Auth account; resolve the collision manually.' });
      continue;
    }
  }

  const isNewAccount = !authUser;
  const passwordResetNeeded = isNewAccount && !password;
  const authPassword = password || (passwordResetNeeded ? randomBytes(32).toString('base64url') : undefined);
  const appMetadata = {
    ...(authUser?.app_metadata || {}),
    role: account.role,
    ...(passwordResetNeeded ? { password_reset_required: true } : {}),
  };

  if (authUser) {
    const updates = {
      email,
      email_confirm: true,
      app_metadata: appMetadata,
      ...(password ? { password } : {}),
    };
    const { data, error } = await admin.auth.admin.updateUserById(authUser.id, updates);
    if (error || !data.user) {
      failures.push({ source: account.source, message: error?.message || 'Auth user could not be updated.' });
      continue;
    }
    authUser = data.user;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: authPassword,
      email_confirm: true,
      app_metadata: appMetadata,
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

  if (account.source === 'users') {
    const { error: emailUpdateError } = await admin
      .from('users')
      .update({ email })
      .eq('id', account.legacyStudentId);
    if (emailUpdateError) {
      failures.push({ source: account.source, message: `Auth/profile created but student login mapping could not be saved: ${emailUpdateError.message}` });
      continue;
    }
  }

  if (password) {
    const { error: clearPasswordError } = await (account.source === 'users'
      ? admin.from('users').update({ password: null }).eq('id', account.legacyStudentId)
      : admin.from('admin_roles').update({ password: null }).eq('id', account.legacyAdminId));
    if (clearPasswordError) {
      failures.push({ source: account.source, message: `Auth/profile created but legacy password could not be cleared: ${clearPasswordError.message}` });
      continue;
    }
  }

  if (passwordResetNeeded) {
    resetRequired += 1;
    studentsNeedingPasswordReset.push(String(account.nisn || account.legacyStudentId));
  }
  migrated += 1;
}

console.info(`Migrated ${migrated} accounts. Skipped ${skipped} account(s).`);
if (resetRequired) {
  console.warn(`${resetRequired} student account(s) were created with a random inaccessible password and require an administrator reset before login.`);
  console.warn(`NISN/ID needing reset: ${studentsNeedingPasswordReset.join(', ')}`);
}
if (failures.length) {
  console.error(`${failures.length} account(s) need manual resolution:`);
  for (const failure of failures) {
    console.error(`- ${failure.source}: ${failure.message}`);
  }
  process.exitCode = 1;
}
