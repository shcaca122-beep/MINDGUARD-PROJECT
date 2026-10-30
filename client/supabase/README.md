# Enabling account and data privacy

The application now uses Supabase Auth sessions and database RLS. Existing
accounts are still in `users` and `admin_roles`, so this migration must be
completed before users can sign in with the new flow.

1. Back up the Supabase database.
2. Run `migrations/20261020000000_role_based_privacy.sql` in the Supabase SQL
   Editor. It adds trusted role profiles, creates the service-type and
   school-profile tables if they are missing, links violations to student
   records, and applies RLS to account, violation, counseling, permission, and
   evidence data. Permission rows are linked by `siswa_id`; older rows without
   that identity remain available to authorized staff only. The policy setup
   can be safely rerun if the SQL Editor reports an error partway through.
   Also run `migrations/20261025000000_link_student_violations.sql` to link
   uniquely named legacy violation rows to `users` through the new
   `student_record_id` column, allow students to read only their own linked
   admin-panel records, backfill older `pelanggaran_siswa` records when both
   name and class match uniquely, and enable Realtime for both violation
   tables. This uses a separate column instead of the existing `siswa_id`
   relation on `pelanggaran`. Rows whose student identity is missing or
   ambiguous are deliberately left unlinked for staff review.
3. In `client/.env.local`, set `SUPABASE_SERVICE_ROLE_KEY` to the project's
   service-role key. Keep it server-only; never use a `NEXT_PUBLIC_` prefix or
   commit the value.
4. From the `client` directory, run `npm run migrate:auth`. The script creates
   Supabase Auth accounts from legacy credentials, creates their trusted
   profiles, and clears the old password columns after successful migration.
   Student records with a missing, invalid, or duplicate email receive a
   unique internal login email and can sign in with their NISN and password.
   Accounts that have no legacy password are created with an unrecoverable
   random password and must have a temporary password set by an administrator
   in **Admin → Data Siswa → Reset password** before the student can sign in;
   the student must then choose a personal password at first login.
   Staff accounts without a valid email/password still require manual
   resolution.
5. To rotate every student password, use **Admin → Data Siswa → Reset Semua
   Password**. Set a temporary password of at least 12 characters and confirm
   with `GANTI SEMUA`. Every student receives that temporary password and is
   forced to choose a personal password at the next login. The downloaded CSV
   contains student login identifiers, not passwords; share the temporary
   password privately. A failed account is reported separately and must be
   resolved before its student can sign in.
6. Restart the app. Verify logins for one account per role and test that a
   student cannot read another student's `pelanggaran_siswa` rows.

New admin-panel violation records are linked to the selected student ID, and
new OSIS records use the selected student ID. The student violation page reads
both tables and refreshes from Supabase Realtime. Legacy admin rows are linked
only when the student name matches exactly one student; older OSIS rows require
a unique match on both name and class. Ambiguous or missing identities remain
visible to authorized staff but not to students.

The admin account-management API also needs the service-role key at runtime.
The key bypasses RLS and must remain on the server.

## Password recovery by email

The login page can send a Supabase Auth password recovery email for accounts
with an accessible email address. In **Authentication → URL Configuration**,
set the production app URL as the Site URL and allow the app's recovery URL
(for example `https://your-domain.example/reset-password`; add
`http://localhost:3000/reset-password` for local development). Configure the
project's Auth email/SMTP settings so recovery messages can be delivered.
Students who sign in with NISN and have only an internal
`@students.budibakti.sch.id` login address cannot receive recovery email and
must ask an administrator to reset their password from **Data Siswa**.
