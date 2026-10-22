# Development

## Prerequisites

- Node.js 20.9 or newer (CI uses 22).
- Docker, for a local MongoDB. Any MongoDB 6+ reachable by URI also works.

## First run

```bash
npm install
cp .env.example .env.local      # then fill in ADMIN_PASSWORD and SESSION_SECRET
npm run db:up                   # mongo:8 in Docker on localhost:27017
npm run dev                     # http://localhost:3000
```

Generate a session secret with `openssl rand -base64 32`. The triage queue is at `/triage`; sign in with `ADMIN_PASSWORD`.

`npm run db:down` removes the container and its data.

## Environment

| Variable         | Required | Purpose                                                                                     |
| ---------------- | -------- | ------------------------------------------------------------------------------------------- |
| `MONGODB_URI`    | yes      | MongoDB connection string.                                                                  |
| `MONGODB_DB`     | no       | Database holding `bugs`. Unset means the database in the URI (MongoDB's default is `test`). |
| `ADMIN_PASSWORD` | yes      | The maintainer password for `/triage`.                                                      |
| `SESSION_SECRET` | yes      | Signs session cookies. At least 32 characters.                                              |

All four are server-only; none are prefixed `NEXT_PUBLIC_`. Missing values don't break the build. The affected page explains what to set instead (see [architecture.md](architecture.md#failure-handling)).

## Scripts

| Command             | What it does                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| `npm run dev`       | Dev server with Turbopack.                                               |
| `npm run build`     | Production build. Needs no environment variables.                        |
| `npm start`         | Serve the production build.                                              |
| `npm run check`     | Everything CI runs except the build: format, lint, typecheck, tests.     |
| `npm run typecheck` | `next typegen` (route types such as `PageProps<'/triage'>`), then `tsc`. |
| `npm test`          | Vitest, once. `npm run test:watch` to watch.                             |
| `npm run format`    | Prettier, write.                                                         |

## Tests

Vitest runs everything under `src/**/*.test.ts(x)`.

- **Pure logic:** validation, queue params, session tokens, return paths.
- **Repository:** `repository.test.ts` starts a real `mongod` with `mongodb-memory-server`, including documents in the legacy Express shape. The first run downloads a MongoDB binary (~100 MB) into `~/.cache/mongodb-binaries`.
- **Server actions:** `triage-actions.test.ts` mocks the repository and session to prove nothing is written without a maintainer session.
- **Components:** `ReportForm.test.tsx` runs in jsdom (`// @vitest-environment jsdom`) with the server action mocked.

The default environment is `node`; opt a file into jsdom with the comment above. `server-only` is aliased to an empty module in `vitest.config.ts` so server modules can be imported directly.

There are no browser end-to-end tests in the repository. Before shipping UI changes, run the flows by hand or with a throwaway Playwright script: submit invalid and valid reports, sign in, filter, resolve, reopen and delete.

## Deploying to Vercel

1. Import the repository in Vercel. Framework detection picks Next.js; leave the build and output settings at their defaults.
2. Create a MongoDB database. MongoDB Atlas works directly, or through the Vercel Marketplace integration, which sets `MONGODB_URI` for you. In Atlas, allow connections from Vercel (Network Access).
3. Set `MONGODB_URI`, `ADMIN_PASSWORD` and `SESSION_SECRET` (and `MONGODB_DB` if needed) for Production and Preview.
4. Deploy, then open `/triage` to confirm sign-in and the database connection.

To keep the original app's data, point `MONGODB_URI` at the old Atlas cluster and leave `MONGODB_DB` unset (or set it to the database the old URI named).

## Troubleshooting

- **"MONGODB_URI is not set"** after adding it to `.env.local`: restart `npm run dev`; env files are read at startup.
- **Triage shows "Reports couldn't be loaded"**: the database didn't answer within 5 seconds. Check that the container is running (`docker ps`) or that Atlas allows your IP.
- **Signed out unexpectedly**: changing `ADMIN_PASSWORD` or `SESSION_SECRET` invalidates every session by design.
- **Repository tests hang on first run**: the MongoDB binary is downloading. Set `MONGOMS_DOWNLOAD_URL` or `MONGOMS_SYSTEM_BINARY` if your network blocks it.
- **`AGENTS.md` shows changes after `npm run dev`**: Next.js rewrites its own block between the `nextjs-agent-rules` markers. Commit it as is.
