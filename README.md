# NOTARA

Your day. Your properties. Your intelligence.

An invite-only Next.js and Supabase property workspace. The application contains no demonstration business records. Read [current build status](docs/BUILD-STATUS.md) for implemented behavior and the remaining full-platform requirements.

## Run locally

Use Node.js 24 LTS. Install the pinned dependencies, copy `.env.example` to `.env.local` and set the project's publishable key. Never use a service-role key in the browser.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The private pages require sign-in. The invited owner must create and confirm their account using their own password; the app does not provide a default password.

The migrations under `supabase/migrations` are already applied to the connected Notara project. For a new environment, apply them using the Supabase CLI and adjust `private.allowed_accounts` through an authorised administrator. Do not insert demonstration records into production.

## Verify

```sh
npm test
npm run typecheck
npm run build
npm start
```

`tests/security.sql` is an explicit rollback-only database security check. `tests/runtime-smoke.mjs` is an opt-in integration check requiring a dedicated disposable identity, a credential JSON file outside the repository and owner-scoped cleanup afterward. It must never use a real owner's credentials or records.

## Documentation

- [Current implementation and outstanding work](docs/BUILD-STATUS.md)
- [Verification evidence and limits](docs/VERIFICATION.md)
- [Original design foundation](docs/FOUNDATION.md)
- [Architecture requirements](docs/DATABASE-ARCHITECTURE.md)
- [Persistent-data acceptance gates](docs/PERSISTENT-DATA-MILESTONE.md)

Google sync, mail ingestion, meeting transcription, grounded AI, staged imports, backup restoration and production hosting remain open requirements. Their screens report the connection state accurately.
