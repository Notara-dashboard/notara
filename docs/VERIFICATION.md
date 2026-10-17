# NOTARA — visual foundation verification

Verified locally on 17 October 2026, using Node 24 and the dependency versions pinned in the lockfile.

## Automated checks

- `npm run build`: passed; dashboard, 12 module pages and the not-found page prerender successfully.
- `npm run typecheck`: passed with strict TypeScript.
- `npm test`: 4 tests passed. Checks cover active-portfolio occupancy, gross debit/credit separation, navigation completeness, sample referential integrity and sample trend reconciliation.
- All 13 application routes returned HTTP 200 and included the design-preview indicator.
- Dependency installation/lockfile audit reported 0 known vulnerabilities at verification time. This is not a substitute for production security review.

## Browser evidence

The local application rendered successfully in the Codex browser. Responsive checks covered a 390 × 844 phone, 768 × 1024 tablet and 1440 × 1000 desktop. Phone and tablet document scroll widths matched their available client widths, with no horizontal page overflow. Desktop was checked visually. Screenshots of the dashboard were saved as separate handoff outputs.

Verified interactions:

- Created a sample action from the dashboard; open count changed from 4 to 5.
- Completed that sample action; the Completed filter showed it and the open count returned to 4.
- Archived it, selected the Archived filter, reloaded, and confirmed the archived record and last filter survived refresh.
- Searched “Arrears” in the command palette and navigated to the financial module.
- Selected Credit; the table showed Form & Function's R 4,500 credit while the gross debit KPI stayed R 66,250.
- Opened Ask Notara, entered a sample question and received the explicit provider-not-connected response. No AI request is implemented.
- Opened the phone's More navigation and confirmed all modules were present.
- Hid recent communications with the dashboard customiser; its heading disappeared. Reset restored the layout.
- Toggled daylight and midnight themes and checked rendering. Default remains midnight.
- Reviewed browser warning/error logs on the final preview tab; no entries were returned at that check.

The sample test action is browser-local and archived; it is not part of repository fixture data.

## Review and limits

React review covered typed component props, hook placement, functional updates, event cleanup, versioned browser storage validation, lazy chart loading, no service secrets in clients, Radix dialog accessibility, named navigation controls, labelled forms, focus states and reduced-motion styles. The action form restricts tenant options to the selected sample property. Browser testing does not constitute a full WCAG audit or a cross-browser/device certification.

The initial build exposed a package module-format mismatch; this was corrected to ESM and the final build passed. Development server restarts briefly invalidated a preview tab; the running application was reopened and verified. No unresolved compile/type errors remain.

CSV downloads, local audio inspection, every individual record dialog and every sort/filter combination were implemented but not exhaustively tested in the browser. They require broader interaction tests before production use. No backend, auth, RLS policy, live integration, secure storage, transcription job, AI output, domain or Vercel deployment was implemented or verified in this milestone. The database document is a proposal only.
