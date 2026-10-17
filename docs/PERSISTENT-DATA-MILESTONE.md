# NOTARA — first persistent-data milestone

## Intended outcome

An invite-only owner can sign in, create and maintain real properties, premises, tenants, contacts and actions, and see dashboard aggregates derived from those authorised records. No real tenant data is accepted until the access controls are tested.

## Ordered implementation plan

1. **Provision isolated environments.** Select/create the intended Supabase and Vercel projects, establish preview and production separation, configure server-only secrets and callback URLs. Confirm control of `notara.co.za` before attaching the domain; no domain purchase is assumed. Keep production deployment private until authentication works.
2. **Implement private sign-in.** Use the current Supabase server-side Next.js auth guidance, secure cookie/session handling and an allowlisted personal account. Add sign-in, sign-out, recovery/expired-session handling and server-side route/mutation guards. Disable unrestricted registration. Test signed-out and unrelated-user access.
3. **Implement schema and migrations.** Start with profiles, preferences, properties, premises, tenants, contacts, tenant contacts, actions, external identifiers and audit events. Validate composite foreign keys, enum/check constraints, index choices and RLS for each operation. Generate a clean migration using the supported Supabase workflow and generated TypeScript types.
4. **Introduce typed server repositories and services.** Schema-validate all input, scope reads/writes to the signed-in owner, paginate lists, handle transactions and optimistic concurrency, return user-readable error/empty/loading states. Keep secrets and service clients in server-only modules.
5. **Replace property and tenant fixtures.** Build real create/view/edit/archive forms, linked premises and contacts, property categories, search/filter/sort and CSV export. Reject cross-owner and incompatible tenant/premises relationships. Archive rather than silently destroy linked history.
6. **Replace sample actions and preferences.** Persist the action workflow and dashboard layout per user. Track audit changes. Add typed links to properties/tenants, due dates, priority/status, archived view and source context. Clear the old sample storage; never auto-import sample rows into production.
7. **Connect the dashboard to verified records.** Aggregate only the active portfolio. Display honest empty states for modules without live data. Keep financial, calendar, meeting and AI cards disconnected until their own milestones are implemented. Do not mix demo KPIs with real records.
8. **Add private attachment support.** Private bucket, validated uploads, signed access, owner checks, size/type limits, retention and document links. Prove unauthorised download is denied. If omitted from the first core release, mark attachment support as deferred rather than shipping a decorative upload control.
9. **Verify and deploy.** Complete the acceptance checks below, run security advisors, verify secrets are absent from browser bundles, configure recovery/backups, test restoration, deploy a private preview, then attach the intended production domain after the private sign-in flow passes.

## Acceptance gates

| Story                         | Evidence required                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Private authentication        | Unauthenticated and unrelated users cannot query/mutate records or download files; allowlisted owner can sign in/out    |
| Record persistence            | Create/edit/archive data remains consistent after refresh, sign-out/in and a second authorised device                   |
| RLS and relationship security | An unrelated authenticated user cannot read rows or reference another owner's property, tenant or storage object        |
| Property categories           | Moving a property to oversight or archived removes it from default dashboard aggregates without losing records          |
| Tenant identity               | Repeated imports of the same external ID do not duplicate entities; ambiguous matches require review                    |
| Action workflow               | Create, edit, complete, reopen and archive preserve associations and audit history; edit conflicts are surfaced         |
| Preferences                   | Theme, card order/visibility and filters persist per owner without leaking across accounts                              |
| Empty and error states        | Fresh account, expired session, offline request, invalid form and failed mutation are understandable and recoverable    |
| Financial semantics           | No real financial KPI appears until immutable dated snapshots exist; credit values never lower gross debit KPI          |
| Accessibility                 | Keyboard-only navigation, dialog focus return, visible focus, measured contrast, phone touch targets and reduced motion |
| Responsive layout             | 390 px phone, 768 px tablet, 1280–1440 px desktop; no accidental page overflow; readable horizontally scrollable tables |
| Backup recovery               | Documented restore exercise covers database records and private objects separately                                      |
| Deployment                    | Correct environment, private access, HTTPS, domain ownership and callback allowlists verified                           |

## Later verified stages

Stage three is split into independent releases: dated debtor imports and arrears history; expected turnover/monthly submissions; leases/vacancies; Google Calendar; Gmail/Drive; secure meeting recording/upload/transcription; grounded OpenAI/Anthropic intelligence. Each integration needs last-success/error/reconnect states backed by actual provider results, scoped authorisation, idempotent durable jobs and a tested failure path.

The design preview's file inspector is not an upload pipeline. Its AI dialog is not a connected model. Its calendar is not Google Calendar. Its browser-local sample actions are not a secured database. Remove preview labels only as each real boundary is implemented and verified.
