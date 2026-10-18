# Persistent workspace verification

18 October 2026 · Node 24 · Next.js 16.4.2 · Supabase project `nfhdvkinuywydpyoizyo`.

## Completed checks

- Production build and strict TypeScript checks pass with the pinned dependency lockfile.
- Seventeen domain/request/file/import/backup-validation tests pass. They cover invalid dates, reversed event/lease ranges, negative rents, zero turnover versus missing turnover, signed credits, injected ownership fields, unique widget layouts, same-origin validation and file signatures/paths.
- Database security suite passes in a rollback-only transaction: owner writes and reads, cross-owner read/update denial, foreign-key ownership checks, uninvited and anonymous denial, audit forgery/hard-delete denial, version conflict behavior, external-ID uniqueness, lease overlap, occupancy, oversight exclusion, financial separation and immutable finalisation.
- End-to-end HTTP/storage suite passes 48 checks: authenticated record creation and changes across the implemented collections, archive/restore, stale-edit 409, overlapping-lease rejection, calendar, turnover coverage, financial totals, dashboard occupancy, preferences, audit, signed downloads, public-download denial, invalid file rejection, direct signed 5 MB upload and persistence after sign-out/re-entry.
- Browser checks demonstrate sign-in, property creation, refresh persistence, editing, archival, restoration and mobile navigation. Phone and tablet checks show no page overflow; record tables scroll inside their containers. Calendar renders in SAST.
- Signed-out requests to records, dashboard, documents and preferences return 401. Protected page visits take the browser to sign-in.
- Dependency audit during installation reports no known vulnerabilities.

## Issues found and fixed

- Same-origin checks originally compared Next's internal hostname to the browser origin, rejecting legitimate `127.0.0.1` requests. Checks now validate protocol and actual Host; explicit cross-origin/missing-origin tests cover the fix.
- Private uploads originally passed their entire body through the application server. The browser now uploads directly to private storage using a scoped signed token, then the server validates content before recording the document. A real 5 MB transfer verifies this path.
- A missing composite lease foreign-key index was added after the performance advisor identified it.
- Financial finalisation now requires a saved draft with balances, excludes archived balances, and rejects all later modifications to finalised records.
- Phone filter controls were adjusted to keep fields within their containers.

## Limits and remaining launch gates

These checks establish the implemented core flows, not 100% completion of the platform. Provider integrations, durable processing, real-owner email delivery, complete accessibility coverage, independent preview/production environments, intended-domain deployment and operational recovery are not yet verified. See `BUILD-STATUS.md`.

The latest Supabase security-advisor run warns that leaked-password protection is disabled. No RLS or exposed-function security warning is reported. The unused-index notices reflect the new database's low traffic and are not evidence of a functional fault.

Cleanup completed: all 19 application tables contain zero rows. Auth users, identities, sessions and refresh tokens are zero; the private bucket contains zero objects. Only the real owner's invitation remains. The temporary verification identity and its allowlist entry were deleted, and the temporary credential file was removed from disk.

## Workflow completion checks — 18 October 2026

- `tests/workflows.sql`: staged review increments versions; stale application fails; repeated application returns the same finalised snapshot; source mappings reuse tenants; archived matches are rejected without leaving partial snapshots; meeting/communication persistence; file replacement history; consistent backup completeness; nonempty restore denial; corrupt restore rollback; restored relationships, financial amounts and finalisation.
- `tests/workflow-runtime.mjs`: 24 HTTP/storage export checks and 16 restore checks. Real signed uploads, current and historical downloads, SHA-256 file verification, meetings/communication records, duplicate-file handling and restore protection all pass.
- The restore exercise exported a real workspace, removed only the disposable account's business rows, uploaded fresh private file objects, restored the database atomically and compared recovered file hashes and collection counts. It also verified rejection of a second restore into the recovered nonempty workspace.
- Browser sign-in and Settings/Financials render correctly; the browser's Download workspace backup action produced a ZIP containing the manifest and document bytes. No Google or AI account was connected.
- Import failures for archived mapped tenants now roll back the whole snapshot. Legacy multipart uploads use the same full file-signature validation as direct signed uploads.
- ZIP backup integrity validates manifest object hashes, document metadata and owner paths. Historical audit events are reference material; canonical audit history records the restoration as fresh inserts/updates.
- The backup UI supports 100 MB of files and 3 MB of metadata. This bounded self-service recovery does not establish scheduled operational backups or disaster recovery of the Supabase project itself.

## First-login verification — 18 October 2026

Nineteen automated tests, three rollback-only SQL suites and 23 live first-login HTTP checks pass. The new checks cover a verified email session, generated temporary password handling, mandatory password setup, denial of data access before completion, a real password update through Supabase Auth, later password sign-in, sign-out and one-time link replay rejection. The disposable Auth fixture is removed after testing. Production email receipt and password entry belong to the owner; their password is never created by the agent.

