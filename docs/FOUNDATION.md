# NOTARA — visual foundation

17 October 2026 · First deliverable

**Your day. Your properties. Your intelligence.**

## Delivery boundary

This milestone delivers the responsive application shell, desktop and mobile dashboards, all 13 module routes, reusable interface components and an initial architecture proposal. The application uses explicitly labelled fictional sample data. It does not provide private authentication, a database, live AI, OAuth, uploads or production hosting yet. Browser-local sample actions and preferences demonstrate interactions; they are not the persistent-data milestone.

The supplied brand board guides the folded N mark, midnight palette and indigo/blue accents. The written brief controls functionality and the dark-first direction. All logos and architectural illustrations in this repository are original SVG assets. The full brand board is not redistributed.

## Visual system

| Role                     | Token / rule                                                              |
| ------------------------ | ------------------------------------------------------------------------- |
| Canvas / sidebar         | Midnight navy `#0B111C` / `#0A101A`, derived from brand `#0B1220`         |
| Cards / elevated surface | `#111A28` / `#16202F`, slate surfaces                                     |
| Primary action           | Indigo gradient `#8270F5` → `#6555E3`                                     |
| Intelligence             | Soft lavender `#A99BFF`                                                   |
| Information              | Electric blue `#64ADFF`; brand mark uses `#48A8FF`                        |
| Success / healthy        | Soft teal `#69D7C3`                                                       |
| Attention / risk         | Amber `#E9BD78` and rose `#F1849C`, paired with text                      |
| Text                     | `#EDF0F7`, secondary `#BCC4D5`, muted `#7F8CA3`                           |
| Border                   | `#222D3E`                                                                 |
| Font                     | Bundled Geist Sans through `geist/font/sans`; no runtime font service     |
| Spacing                  | 4 px foundation; 16–24 px card spacing; disciplined 20–34 px page gutters |
| Shape                    | 7–8 px controls, 10–11 px cards, 13–15 px dialogs                         |
| Icons                    | Lucide, consistent strokes, contextual colour                             |
| Motion                   | Short state transitions; reduced-motion support                           |
| Theme                    | Midnight default; optional daylight tokens persisted locally              |

Layouts: full sidebar on desktop, icon rail on tablet, stacked cards and fixed bottom navigation on phone. Tables scroll within their own container. Radix dialogs provide focus trapping, Escape dismissal and accessible titles. Inputs have visible labels and focused states. Status always includes words, not colour alone. Contrast and touch-target review remain explicit production accessibility gates.

## Navigation architecture

| Area                    | Route             | Initial experience                                                                    |
| ----------------------- | ----------------- | ------------------------------------------------------------------------------------- |
| Today / Daily Brief     | `/`               | Brief, priorities, schedule, portfolio, exposure trend and communications             |
| Master Actions          | `/actions`        | Sample create, view, edit, complete, archive, status/search/sort and CSV export       |
| My Calendar             | `/calendar`       | Month navigation, date selection, sample agenda, event context                        |
| Meeting Intelligence    | `/meetings`       | Upcoming meetings, local audio metadata inspection, explicit processing prerequisites |
| Communications          | `/communications` | Searchable sample threads, selected conversation and linked context                   |
| My Properties           | `/properties`     | Illustrated property cards, status scope, search, sort, details and export            |
| Tenants & Contacts      | `/tenants`        | Contact directory, property filter, detail view, related module links and export      |
| Arrears & Financials    | `/financials`     | Gross debit KPI, separate debit/credit/zero filters, sample history and export        |
| Turnover Management     | `/turnover`       | Expected reporters, received/missing returns, prior-year comparison and export        |
| Leases & Vacancies      | `/leases`         | Upcoming expiries, sample leases and vacant premises                                  |
| Documents & Reports     | `/documents`      | Collection shells and clear private-storage disconnected state                        |
| Notara AI               | `/ai`             | Suggested questions and provider-unavailable response; no fabricated answers          |
| Settings & Integrations | `/settings`       | Integration status, setup requirements, preferences and privacy roadmap               |

Global access includes a searchable command palette (Ctrl K / Command K), notifications with linked module context, persistent Ask Notara, account/settings access, collapsible navigation and phone navigation. Dashboard customisation supports card visibility, order and reset. Preview action filters are remembered. Entity links currently open module previews; tenant-scoped backend queries are deliberately deferred.

## Implemented preview interactions

- Create and edit sample actions, mark complete/reopen, archive, search, filter, sort and export.
- Persist sample actions, card order/visibility, theme, sidebar state and last action filter to versioned browser storage, with malformed/unavailable-storage fallback.
- Search modules, sample tenants, properties and actions from the command palette.
- Inspect property, tenant, meeting, notification and communication context.
- Change property scope without counting oversight properties in dashboard aggregates.
- View separate debit, credit and zero balances; exported values preserve debit/credit separation.
- Explore calendar dates and months. Sample meetings are fixed to 17 October 2026, SAST.
- Inspect local audio filename, MIME type and size without uploading or transmitting the file.
- Export selected sample lists as CSV with quoting and formula-injection mitigation.

Integration setup controls explain exact prerequisites. They do not simulate OAuth or reconnect. AI prompts remain local and return an explicit disconnected state. The daily brief is hand-authored from three linked sample sources.

## Sample reconciliation

Three active properties contain 54 premises, of which 50 are occupied (92.6%). Four premises are vacant. Sandton Exchange is oversight-only and contributes no dashboard totals. Gross debit is R 66,250: R 32,500 + R 18,750 + R 15,000. A separate R 4,500 credit is never netted into this KPI. September debit is R 74,500, so the October reduction is R 8,250 / 11.1%. Three sample leases expire within 60 days. September has three expected turnover reporters, two received and one outstanding. The five-tenant directory is a subset, not a full list of all occupied premises.

## Architecture boundaries

Next.js App Router owns server route composition. Client components own only the sample interaction layer. TypeScript models and fixtures are in `src/lib/data.ts`; reusable UI primitives are in `src/components/ui`. The chart is loaded on demand. Shared record, badge, avatar, export, action-row and card components make the visual system reusable. No provider keys, service-role tokens or OAuth secrets are required or included.

In milestone two, replace fixture reads with authenticated server data access. Move domain schemas into dedicated modules and validate mutations on the server. Browser storage is to retain harmless interface preferences only, never tenant records or financial documents. The proposed server boundaries are `server/auth`, `server/repositories`, `server/services`, `server/integrations`, `server/jobs`, and `server/ai`, each with server-only imports.

The initial site remains a local preview because private authentication is a mandatory launch gate. The requested production target remains Vercel at `notara.co.za`; no alternate hosting project or domain changes are made in this milestone.
