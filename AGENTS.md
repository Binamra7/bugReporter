# BugReporter

A public bug report form (`/`) and a password-protected triage queue (`/triage`) on Next.js 16 (App Router), React 19, TypeScript 6 and MongoDB. Deployed on Vercel.

- [docs/architecture.md](docs/architecture.md): module boundaries, data model, auth, failure handling, limitations.
- [docs/development.md](docs/development.md): setup, environment, tests, deploying, troubleshooting.
- [DESIGN.md](DESIGN.md): the visual system. Read it before touching UI.

## Commands

```bash
npm run db:up && npm run dev   # local MongoDB in Docker + dev server (needs .env.local, see .env.example)
npm run db:seed                # sample reports; replaces only documents tagged seed: true
npm run check                  # format check, lint, typecheck, tests: run before every commit
npm run build                  # production build; needs no env vars
```

## Where things go

- Routes and boundaries in `src/app/`. Keep pages thin: parse input, `requireMaintainer()`, call the repository, render.
- Report logic in `src/features/reports/`: `model.ts` (types, severity), `validation.ts` (zod), `queue.ts` (URL params), `repository.ts` (all MongoDB access), `actions.ts` / `triage-actions.ts` (server actions), `components/`.
- Auth in `src/lib/auth/` (`token.ts` is pure; `session.ts` reads cookies). Config in `src/lib/env.ts`, the DB client in `src/lib/db.ts`.
- Tests sit next to the code as `*.test.ts(x)`.

## Rules that aren't obvious from the code

- **Every triage page and server action calls `requireMaintainer()` first.** Server actions are public POST endpoints; the layout is not a guard. `triage-actions.test.ts` checks this; extend it for new actions.
- **Stored field names are legacy and must not change** (`bugTitle`, `bugSeverity`, `bugResolved`, …). They keep the original app's MongoDB data readable. Only `repository.ts` knows them; everything else uses `Report`.
- **Read configuration per request** through `src/lib/env.ts`, never at module load, so builds work without secrets. Missing config surfaces as `ConfigError` and is shown to the maintainer, not swallowed.
- **Don't add `loading.tsx` under `/triage`.** Streaming starts before the auth check and `notFound()`, so their 307/404 responses become client-side redirects.
- **Modules that touch the database or secrets import `server-only`.**
- **UI:** colours only from the tokens in `src/app/tokens.css` (values in `DESIGN.md`); nothing below 16px; orange field surfaces carry only `--field-ink`; severity is always shown with `<SeverityScale>`; no cards, gradients or eyebrow labels.
- **Never fake data or integrations.** If something can't work (no storage for attachments, no email), leave it out and note it in the architecture limitations.

## Conventions

- Prettier: 4 spaces, single quotes, 120 columns. ESLint is `eslint-config-next` (core web vitals, TypeScript, jsx-a11y).
- Comments explain why (a constraint, a trade-off, a legacy reason), never what the next line does.
- Commits: Conventional Commits, subject line only, no body.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
