# NOTARA — initial database architecture proposal

Status: design proposal, not an applied migration or provisioned database.

## Ownership and identity

Use Supabase PostgreSQL, Supabase Auth and private Storage. Begin with one invite-only personal owner. Do not add multi-company tenancy prematurely. `profiles.id` references the authenticated user. Every owned record carries `owner_id`, a UUID primary key, creation/update timestamps, a version counter and `archived_at` where appropriate. Domain identifiers stay stable when display names change.

Cross-record references must enforce ownership at the database boundary. Add a unique `(owner_id, id)` candidate key on referenced tables and use composite foreign keys `(owner_id, property_id)`, etc. RLS alone must not allow an owned action to point at somebody else's tenant. For actions with both premises and tenant references, validate a compatible property/lease association transactionally. Use association tables where an entity can relate to more than one property or tenant.

## Proposed relational model

| Table / group                           | Main fields and relationships                                                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`                              | `id → auth.users`, display name, timezone (`Africa/Johannesburg`), currency (`ZAR`), account status                               |
| `user_preferences`                      | Owner, theme, dashboard widget order/visibility, saved filters, sidebar state; validated JSON shape/version                       |
| `properties`                            | Name, address, category (`active`, `oversight`, `archived`), management dates, owner                                              |
| `premises`                              | Property, stable unit code, area, permitted use; unique `(owner_id, property_id, unit_code)`                                      |
| `tenants`                               | Legal entity name, registration reference, tax reference when required, owner; legal identifiers normalised for matching          |
| `contacts` / `tenant_contacts`          | Contact details, role, relationship to tenant; explicit many-to-many association                                                  |
| `leases` / `lease_premises`             | Tenant, property, start/end, status, premises associations, signed document, renewal/notice dates                                 |
| `lease_terms`                           | Lease, effective date range, base rent, escalation, deposit and configured turnover-rent rule; preserve terms history             |
| `vacancies`                             | Premises, availability period, status, asking rent; no overlapping active vacancy periods                                         |
| `arrears_snapshots`                     | Owner, as-of date, source import/document, currency, version, finalised state; immutable after finalisation                       |
| `arrears_balances`                      | Snapshot, tenant, property, lease/premises when known, signed amount, ageing buckets; preserve raw imported amount                |
| `turnover_requirements`                 | Tenant/lease, effective reporting period, frequency, expected-document policy                                                     |
| `turnover_submissions`                  | Requirement, month, declared turnover, currency, submission/revision status, source document; versioned revisions                 |
| `actions`                               | Title, notes, status, priority, due date, property/tenant/lease associations, source reference, archive timestamp                 |
| `notes` / `decisions`                   | Owner, content, associated records, source meeting/message and timestamp, author                                                  |
| `meetings` / `meeting_participants`     | Title, start/end/timezone, consent state, recording reference, retention deadline, authorised associations                        |
| `transcript_segments`                   | Meeting, speaker label, start/end milliseconds, text, provider metadata, confidence where available                               |
| `message_threads` / `messages`          | Provider/account/thread IDs, sender/recipients, dates, body reference, property/tenant links, sync cursor                         |
| `documents` / `document_versions`       | Private storage object path, owner, MIME/size/hash, source, version, retention state; never public URLs                           |
| Typed document links                    | `property_documents`, `tenant_documents`, `lease_documents`, `meeting_documents`, `turnover_documents`; enforce real foreign keys |
| `daily_briefings` / `briefing_findings` | Owner, day, generation state, model/version, findings and explicit source references                                              |
| `integration_connections`               | Provider, owner, external account ID, granted scopes, status, last success, error summary, cursor; secret reference only          |
| `integration_credentials`               | Non-exposed private schema or managed encrypted secret store; ciphertext and key version, expiry, rotation metadata               |
| `external_identifiers`                  | Owner, source namespace/account, entity type, external ID, internal record; unique identity mapping for import deduplication      |
| `import_batches` / `import_rows`        | Source hash, file, mapping, validation errors, proposed matches, approval status, idempotency key, row-level outcomes             |
| `ai_extractions` / `ai_proposals`       | Provider/model, input source/version, structured output, confidence, citations, pending/approved/rejected state                   |
| `ai_source_links`                       | Typed, ownership-checked pointers to messages, documents, transcripts or domain rows with exact versions/timestamps               |
| `audit_events`                          | Append-only actor, action, entity ID, safe before/after delta, request/correlation ID, timestamp                                  |
| `job_runs` / `job_attempts`             | Durable task type, owner, idempotency key, input references, state, attempts, retry time, provider IDs, error metadata            |

Avoid unconstrained `entity_type/entity_id` polymorphic links for security-critical relationships. Prefer typed foreign keys or explicit checked link tables. External-identifier mappings can use separate typed tables per entity to retain referential integrity.

## Domain invariants

- Financial values are `numeric(18,2)` with ISO currency, never floating point. Store business dates as `date`; events and audit timestamps as UTC `timestamptz`. Display SAST explicitly.
- Gross debit KPI is `sum(greatest(balance, 0))` for the latest finalised snapshot and selected active properties. Credit totals are separately `sum(abs(least(balance, 0)))`. Never sum every historical snapshot or net credits against debit exposure.
- Occupancy derives from valid current lease/premises relationships. Archived/handed-over and oversight-only properties are excluded by default. Explicit portfolio selection is recorded in filters.
- Turnover missingness derives from effective expected-reporting requirements minus accepted submissions for the selected period. Missing is not zero. Keep amendments and their approval trail. Year-on-year compares the same tenant, month, currency and comparable basis.
- Imports stage before applying. Validate date, currency, ageing totals and mappings. Match external IDs first, then approved tenant/property aliases. Ambiguous matches enter review; never silently create a duplicate tenant.
- Reimporting the same account/source external ID updates the mapping's existing record idempotently. Unique source hashes and batch keys prevent duplicate effects. Name changes do not change identity.
- Tenant registration numbers are not assumed globally unique when missing. Do not use fuzzy names as automatic merge authority.
- Long recordings use resumable uploads and chunked background processing, not a single browser request. 120 minutes is a target to verify, not a promise of provider support. Keep segment offsets, consent and retention metadata through retries.
- AI records cite immutable source versions and transcript time ranges. No citation means no factual finding. Proposed financial, communication or contractual changes require user approval and a fresh authorisation check when applied.

## Access, storage and audit

Enable RLS on every exposed table and write ownership predicates for SELECT, INSERT, UPDATE and DELETE. UPDATE needs matching SELECT plus USING and WITH CHECK conditions. Browser clients never receive secret/service-role keys or decrypted OAuth tokens. Provisioning must follow current Supabase documentation and advisor checks, not assumptions from this proposal.

Use private buckets and ownership-checked object paths. Generate short-lived signed download links after authorisation. Check MIME and size, quarantine uploads for scanning, and prevent paths from crossing owners. Persist references to objects; keep temporary URLs out of canonical records. Retention/deletion jobs must respect legal holds and audit the outcome.

Audit events should be written transactionally by database triggers or trusted server mutations. The browser must not be able to forge another actor or edit history. Record minimised diffs and avoid logging API secrets, full email bodies and sensitive documents. Use optimistic concurrency for edits and explicit conflict messages.

Invite-only authentication must validate the allowlisted account and enforce server-side access on every page/data mutation. Disable unrestricted public registration. Do not trust user-editable metadata for authorisation. Auth recovery, expired sessions and revoked integration scopes need explicit handling.

## Queries, indexes and operational safeguards

Start indexes on `(owner_id, archived_at)`, `(owner_id, property_id)`, `(owner_id, tenant_id)`, action status/due date, lease expiry, finalised snapshot date, turnover requirement/month, message external ID, and external-identifier uniqueness. Avoid unbounded full-table dashboard reads. Use ownership-scoped aggregate queries. PostgreSQL views must respect caller security; validate permission behaviour before exposing any aggregate view.

Use database transactions for multi-record imports and domain edits. Durable jobs should store references, not secrets; use at-least-once processing with idempotent writes, bounded retries, backoff and a visible failure queue. Paginate syncs, preserve cursors, verify webhook signatures and handle provider revocation.

Separate development, preview and production Supabase/Vercel projects and secrets. Commit ordered migrations and generated TypeScript database types. Keep production data out of preview. Configure database backups and object-storage backup/versioning separately, with retention and a tested restoration exercise. Define concrete recovery targets before accepting real records; managed database backups alone do not guarantee document recovery.

## Future AI and integration flow

Authorised source → validated import/sync → owned canonical records → retrieval scoped to current user → structured AI extraction → citation validation → reviewable proposal → explicit approval → transactional mutation + audit.

OAuth begins and completes server-side with state/PKCE protections as supported, strict redirect allowlists, least-privilege scopes and encrypted refresh-token storage. No API keys are accepted in frontend preferences. Provider adapters for OpenAI and Anthropic share typed inputs/outputs, rate limits, usage budgets and trace IDs. Meeting transcription runs separately from text intelligence. Choose and verify a durable job implementation before the first integration; do not make an unverified runtime choice part of this visual milestone.
