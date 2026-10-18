# Persistent workspace verification

18 October 2026 · Node 24 · Next.js 16.4.2 · Supabase project `nfhdvkinuywydpyoizyo`.

## Completed checks

- Production build and strict TypeScript checks pass with the pinned dependency lockfile.
- Thirteen domain/request/file-validation tests pass. They cover invalid dates, reversed event/lease ranges, negative rents, zero turnover versus missing turnover, signed credits, injected ownership fields, unique widget layouts, same-origin validation and file signatures/paths.
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

These checks establish the implemented core flows, not 100% completion of the platform. Provider integrations, durable processing, imports, restoration, real-owner email delivery, complete accessibility coverage, independent preview/production environments, intended-domain deployment and operational recovery are not yet verified. See `BUILD-STATUS.md`.

The latest Supabase security-advisor run warns that leaked-password protection is disabled. No RLS or exposed-function security warning is reported. The unused-index notices reflect the new database's low traffic and are not evidence of a functional fault.

Cleanup completed: all 14 application tables contain zero rows. Auth users, identities, sessions and refresh tokens are zero; the private bucket contains zero objects. Only the real owner's invitation remains. The temporary verification identity and its allowlist entry were deleted, and the temporary credential file was removed from disk.
