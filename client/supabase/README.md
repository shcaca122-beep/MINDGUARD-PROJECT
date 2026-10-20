# Enabling account and data privacy

The application now uses Supabase Auth sessions and database RLS. Existing
accounts are still in `users` and `admin_roles`, so this migration must be
completed before users can sign in with the new flow.

1. Back up the Supabase database.
2. Run `migrations/20261020000000_role_based_privacy.sql` once in the Supabase
   SQL Editor. It adds trusted role profiles, links violations to student
   records, and applies RLS to account, violation, counseling, and evidence
   data.
3. In `client/.env.local`, set `SUPABASE_SERVICE_ROLE_KEY` to the project's
   service-role key. Keep it server-only; never use a `NEXT_PUBLIC_` prefix or
   commit the value.
4. From the `client` directory, run `npm run migrate:auth`. The script creates
   Supabase Auth accounts from legacy credentials, creates their trusted
   profiles, and clears the old password columns after successful migration.
   Accounts without an email/password or with invalid credentials are reported
   as needing manual resolution.
5. Restart the app. Verify logins for one account per role and test that a
   student cannot read another student's `pelanggaran_siswa` rows.

Legacy violation records have no student identity column. The migration leaves
their new `siswa_id` empty, so they remain visible to authorized staff but not
to students. New OSIS records are linked only when exactly one account matches
the selected student name and class; ambiguous or missing identities are
rejected instead of guessed.

The admin account-management API also needs the service-role key at runtime.
The key bypasses RLS and must remain on the server.
