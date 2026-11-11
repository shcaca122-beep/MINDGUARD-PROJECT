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

After their first login, students can register their personal Gmail through
**Email untuk Reset Kata Sandi** in the student menu. Supabase sends a verification link to
that address. The email only becomes the account's recovery address after the
student opens the link; the verified Auth address is then synchronized to the
student record and trusted profile. Password recovery sends a link to the
email associated with the Auth account; typing a different address on
`/lupa-password` does not change it. Administrators can also verify and update
a student's email through **Admin → Data Siswa → Email pemulihan**.

For accounts that currently use an internal or automatically generated email,
configure Supabase Auth to confirm the new email address during email changes.
If Supabase is configured to require confirmation at both the old and new
addresses, students without access to the old address will need an
administrator to update their email instead.

In **Authentication → URL Configuration**, set the production app URL as the
Site URL and allow the app's recovery URL (for example
`https://your-domain.example/reset-password`; add
`http://localhost:3000/reset-password` for local development). Also allow the
email verification redirect (`https://your-domain.example/akun/email` and
`http://localhost:3000/akun/email` during local development).

To send recovery emails through Google, configure the project's custom SMTP
settings in **Authentication → SMTP Settings**:

- Host: `smtp.gmail.com`
- Port: `587`
- Username: the complete Gmail or Google Workspace email address
- Password: a Google App Password for that account (not its regular sign-in
  password)
- Sender email: the same Google email address
- Sender name: the school's official name

Enable 2-Step Verification on the Google account before creating an App
Password. A Google Workspace address on the school's domain is recommended for
official school mail. Keep SMTP credentials in Supabase settings only; never
put them in client-side code or commit them to the repository. Customize the
recovery email template in Supabase Auth as needed.

## Uploading XII RPL student photos

The PowerShell uploader at `client/scripts/upload-student-photos.ps1` reads
`XII.RPL.zip` and uploads only the `XII.RPL-1` through `XII.RPL-4` JPEG folders.
It preserves those class folders as object-path prefixes inside the selected
Supabase Storage bucket. The default bucket is `foto-siswa`; the default
project URL is this app's configured Supabase project. It does not update
student database records.

In PowerShell, set the project URL and server-only service-role key for the
current session, then preview and upload:

```powershell
$env:SUPABASE_URL = "https://<project-ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service-role-key>"

.\client\scripts\upload-student-photos.ps1 -WhatIf
.\client\scripts\upload-student-photos.ps1
```

By default, PowerShell asks for confirmation before uploading. The default ZIP
path is `$HOME\Downloads\XII.RPL.zip`; pass `-ZipPath` to use another location.
Pass `-Bucket` only if you want to use a different bucket.
Existing objects are not overwritten unless `-Upsert` is specified. Never put
the service-role key in client-side code or commit it to the repository.
