# Notara — current build

The application is an invite-only Supabase property workspace. The invited owner is `notara@mjwgroup.co.za`. Business tables start empty; verification data is disposable and removed after tests.

## Implemented

- Cookie-based sign-in, sign-out, email-verified first access, mandatory owner-chosen password setup, confirmation callback and password recovery.
- Owner-scoped properties, premises, tenants, contacts, actions, leases, local calendar events, meetings, communications, reporting requirements, turnover submissions, financial snapshots and balances.
- Create/edit/archive/restore, search, filters, sorting, pagination, CSV exports, dashboard customisation and cross-device preferences.
- Server validation, composite owner foreign keys, RLS, append-only audit history, record versions and edit-conflict protection.
- Lease overlap prevention, current occupancy/vacancies, active/oversight scope, gross debit and credit separation, immutable dated financial snapshots and turnover comparisons.
- CSV debtor imports: column mapping, currency/credit parsing, explicit tenant review, source-scoped identity matching, saved staging, atomic finalisation and duplicate-file idempotency. Limits: 2 MB and 2,000 rows per file.
- Meeting notes, participants, consent status, decisions and linked follow-up actions. Manual communication logs with tenant/property links.
- Private signed document uploads/downloads, metadata and property/tenant/lease/meeting links, archive/restore, retained file versions and optimistic replacement conflicts. Up to 20 MB per file; PDF, JPEG, PNG, plain text and CSV.
- Portable ZIP backups containing a consistent database snapshot, current/historical file bytes and SHA-256 hashes. Transactional restore into an empty workspace, owner rebinding and file-integrity checks. Limits: 100 MB of files, 3 MB of metadata, 10,000 records per collection and 2,000 files. Original audit entries are included for reference; restore creates fresh audit events.
- SAST calendar, mobile navigation, dark/light theme, accessible dialogs and audit-history UI.

## Verification

Production build, TypeScript and 19 automated tests pass. The rollback-only security and workflow SQL suites pass. Real HTTP/storage verification passes 48 core checks, 24 new workflow checks and 16 restore checks. Recovery includes actual file downloads and byte-hash comparison. The browser also downloads a valid workspace ZIP. See `VERIFICATION.md` for details and limits.

## External integrations deferred by the user

Google and AI accounts remain disconnected. No provider authorisation or real model request has been performed. The current screens report this honestly. Full Google OAuth/token handling, durable Calendar/Gmail/Drive sync, model retrieval/citations/proposal approval and long-recording transcription are still implementation work; linking an account alone will not enable those unfinished features. Manual calendar, meeting notes, communications, documents and financial workflows work independently.

## Production launch gates

- Verify the real owner's confirmation/recovery email delivery and the intended deployment callback allowlist. The owner chooses their own password; no default password is created.
- Establish independent staging database isolation, scheduled off-site backups/retention and malware scanning/quarantine. ZIP recovery is implemented and exercised; it is not an automatic managed backup service.
- Complete the deferred provider implementations and test them after account authorisation.
- Verify intended-domain ownership/DNS and the final production HTTPS deployment. The Vercel release remains protected by Vercel Authentication.
- Extend accessibility, keyboard, screen-reader and browser/device coverage beyond the representative checks recorded here.

## Connected infrastructure

Supabase: `nfhdvkinuywydpyoizyo`, Notara-dashboard, Postgres 17, Free plan. Only publishable credentials are used. No service-role key or database password is committed.

Vercel: project `notara` (`prj_lzjhwi87pfZy1kmE5fa5baqXiTaT`) under `mjwdashboard`. Preview and production releases are protected by Vercel Authentication. Production uses the connected Supabase project with publishable credentials. Custom-domain routing is not provisioned.

GitHub: PR #1 contains the workspace release for merging into `main`. Local Git credentials belong to a different account; publication uses the connected Notara account without replacing global credentials.

Supabase's security advisor reports leaked-password protection disabled; no RLS or exposed-function security warnings. Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

The historical architecture/design documents describe intended acceptance gates, not a claim that every integration is finished.

## Release synchronisation

All eleven Supabase migrations are applied remotely. Repository filenames match the recorded remote versions so future migration pushes do not replay already-applied DDL. The Vercel release is built from the merged GitHub main commit. Google and AI account connections remain deferred.


## First-login correction

The owner starts with an emailed one-time sign-in link, verifies their address, then chooses and confirms a password before accessing workspace data. A private database marker records a real password change after email confirmation; Supabase-generated temporary passwords do not satisfy this requirement. Subsequent visits support normal password sign-in and email recovery. Empty or non-JSON authentication failures produce a helpful message rather than a parsing error. Supabase Site URL and callback allowlist now point to the production deployment. The screenshot URL notara-coral.vercel.app is outside the connected Vercel project's deployment aliases and returned HTTP 500; use https://notara-mjwdashboard.vercel.app/login.

