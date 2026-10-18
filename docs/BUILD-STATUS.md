# Persistent workspace — current build

The visual preview has been replaced by an invite-only Supabase application. Business tables start empty. Sample actions, property images, tenant records, meetings, communications and fabricated financial figures are not imported into the database. Old browser preview storage is discarded.

## Implemented

- Cookie-based Supabase sign-in, sign-out, invitation-only account creation, confirmation callback and password recovery.
- Owner-scoped properties, premises, tenants, contacts, actions, leases, local calendar events, reporting requirements, turnover submissions, arrears snapshots and balances.
- Server validation; composite owner foreign keys; RLS on every application table; append-only audit entries; record versions and edit conflict responses.
- Create/edit/archive/restore, search, enum filters, sorting, paginated lists, CSV exports and cross-device preferences.
- Lease overlap prevention, current occupancy and vacancies, active versus oversight portfolio scope.
- Dated immutable financial snapshots, gross debit and credit separation, latest snapshot dashboard and financial history.
- Expected versus received monthly reporting, missing versus zero, comparable prior-year returns.
- Private document storage, limited content types and size, content checks and 60-second download URLs. Browser uploads use signed direct transfers to avoid hosting request-body limits.
- Month calendar in SAST, dashboard widget layout and visibility, mobile navigation, dark/light theme, accessible Radix dialogs, audit-history screen.

## Verification evidence

See `VERIFICATION.md` for the completed checks and their limits. `tests/security.sql` runs in a rollback-only transaction and verifies security and financial invariants. `tests/runtime-smoke.mjs` requires a dedicated disposable account, performs real API/storage checks and must be followed by owner-scoped cleanup. Never run integration checks against a real owner's account.

## Remaining requirements for the full platform

These requirements remain open; the core build does not prove full platform completion.

1. Finish and verify Google Calendar, Gmail and Drive OAuth, encrypted token retention, durable sync, reconnection and provider failure handling. No provider OAuth client credentials are available in the app.
2. Implement consent-aware meeting recording/upload, durable long-recording transcription, source segments and deletion/retention behavior. No transcription provider is configured.
3. Implement grounded AI retrieval, model calls, exact source references, proposal approval, provider errors and usage controls. No model provider is configured.
4. Complete staged debtor imports, import identity mapping, human review, atomic application, source hashes and duplicate-import checks. Unique tenant external IDs are implemented, but a full import pipeline is not.
5. Complete document versioning, typed attachment relationships, malware scanning/quarantine and recovery/retention requirements.
6. Verify the real owner's confirmation/recovery email delivery and configure redirect allowlists for the intended deployed origin. The connected Notara email is provisioned as the invited owner; no password is generated for that owner.
7. Provision preview/production environment isolation, backups and object backups, perform a documented restore exercise, deploy and verify HTTPS/callbacks, then connect `notara.co.za` after confirming domain control.
8. Complete keyboard, screen-reader, contrast and browser/device coverage beyond the representative browser checks already performed.

## Operational observations

- Supabase project: `nfhdvkinuywydpyoizyo`, Notara-dashboard, Postgres 17, Free plan.
- Only publishable credentials are used by this application. No service-role key or database password is required or committed.
- The connected Vercel account/team currently has no Notara project.
- Local Git credentials belong to a different account and cannot push to this repository. Use the authenticated Notara GitHub connector to publish changes; do not replace the user's global Git credentials.
- Supabase's advisor reports that leaked-password protection is disabled. Enabling that account setting requires the appropriate Supabase Auth plan/settings access.

The historical `FOUNDATION.md`, `DATABASE-ARCHITECTURE.md` and `PERSISTENT-DATA-MILESTONE.md` describe the original design and intended acceptance gates; they are not claims that every later integration has shipped.
