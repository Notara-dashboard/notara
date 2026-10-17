# NOTARA

Your day. Your properties. Your intelligence.

First milestone: a dark-first responsive property and executive productivity workspace, based on the supplied NOTARA brand board and master platform brief.

## Run locally

Use Node.js 24 LTS (the build also requires the minimum supported Node version of the installed Next.js release).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. No environment variables are required for this sample preview.

```sh
npm run typecheck
npm test
npm run build
npm start
```

`npm start` serves the built application. Stop the dev server before using the same port for production preview.

## Included

- Next.js App Router, React, TypeScript, Tailwind v4, local Geist Sans, Lucide, Recharts and shadcn-style editable Radix UI primitives.
- All 13 routes, desktop/sidebar/tablet/phone layouts and dark/light themes.
- Source-linked sample daily brief, schedule, priorities, occupancy and gross-debit trend.
- Browser-local sample action capture/edit/complete/archive, list filters, search and exports.
- Command palette, record dialogs, configurable dashboard and integration setup states.
- Original vector logo/favicon and architectural sample illustrations.

## Read the handoff

- [Visual system and navigation](docs/FOUNDATION.md)
- [Initial database architecture proposal](docs/DATABASE-ARCHITECTURE.md)
- [Persistent-data milestone and acceptance gates](docs/PERSISTENT-DATA-MILESTONE.md)
- [Verification record](docs/VERIFICATION.md)

## Current limitations

All records are fictional, clearly labelled preview content fixed to 17 October 2026 SAST. Actions/preferences are saved only in this browser. There is no authenticated backend, database, live AI, OAuth, recording/transcription, secure upload or live sync. Do not enter confidential information. Do not deploy this as a real private-data system before the authentication/RLS milestone passes.

No external integration is simulated. Setup controls explain prerequisites; AI requests return a disconnected state and do not send prompts. The intended production stack remains Supabase and Vercel at `notara.co.za`; no hosting or DNS changes are part of this milestone.
