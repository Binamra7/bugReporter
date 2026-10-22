# Architecture

BugReporter is one Next.js 16 App Router application backed by a MongoDB collection. It has two audiences: reporters, who use the public form at `/`, and maintainers, who sign in and work through the queue at `/triage`.

## Request flow

```
Reporter ── / (static page, client form) ──▶ submitReport (server action) ──▶ repository ──▶ MongoDB `bugs`
Maintainer ── /triage, /triage/[id] (dynamic server components) ──▶ requireMaintainer ──▶ repository
            └── StatusControl / DeleteReport (client forms) ──▶ changeStatus / removeReport (server actions)
```

There is no REST API. Every mutation is a server action, and every read happens in a server component. The report page is prerendered as static HTML. The triage pages are dynamic because they read the session cookie.

## Modules

| Path                                     | Owns                                                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                               | Routes, layouts, error and not-found boundaries. Pages stay thin: parse input, check access, call the repository, render. |
| `src/features/reports/model.ts`          | The `Report` domain type, the severity scale and the reference format. No I/O, safe to import from client components.     |
| `src/features/reports/validation.ts`     | The zod schema for a new report, its limits and its user-facing messages.                                                 |
| `src/features/reports/queue.ts`          | Turning untrusted URL search params into a `QueueQuery`, and back into canonical URLs.                                    |
| `src/features/reports/repository.ts`     | All MongoDB access for reports (`server-only`). Maps stored documents to `Report`.                                        |
| `src/features/reports/actions.ts`        | The public `submitReport` action. No auth.                                                                                |
| `src/features/reports/triage-actions.ts` | Maintainer-only actions: change status, delete.                                                                           |
| `src/features/reports/components/`       | Report UI: the form, the queue, the detail view, the severity scale.                                                      |
| `src/features/auth/`                     | Sign-in form and the sign-in/sign-out actions.                                                                            |
| `src/lib/auth/`                          | Session tokens (`token.ts`, pure) and the access layer (`session.ts`, `server-only`).                                     |
| `src/lib/env.ts`, `src/lib/db.ts`        | Configuration and the shared MongoDB client.                                                                              |
| `src/components/`                        | Product-wide UI: the split page, wordmark, icons, timestamps, configuration notice.                                       |

Dependencies point one way: `app` → `features` → `lib`. Client components import only from `model.ts`, `validation.ts`, `submit-state.ts` and server-action modules; anything that touches the database or secrets imports `server-only` so a mistaken client import fails the build.

## Data model and the legacy collection

Reports live in the `bugs` collection with the field names the original Express/Mongoose API used (`bugTitle`, `bugDescription`, `bugSeverity`, `bugResolved`, `createdAt`, `updatedAt`). This is deliberate: pointing a deployment at the old Atlas database shows the old reports with no migration. `resolvedAt`, `pageUrl` and `version` are newer, optional fields.

`repository.ts` is the only place that knows the stored shape. It handles the old documents explicitly:

- "Open" means `bugResolved != true`, because old documents may store `false` or omit the field.
- A resolved document without `resolvedAt` uses `updatedAt`, which is what the old UI displayed as the resolved date.
- Documents with a severity outside `high | medium | low` are skipped with a server warning instead of being given a made-up severity.

When `MONGODB_DB` is unset the client uses the database named in `MONGODB_URI`. MongoDB falls back to `test` when the URI names none, which is where the old API wrote.

Report references (`BR-3F9A1C`) are the last six hex digits of the ObjectId. They are a display handle only; routes use the full id.

## Authentication

There is one role, "maintainer", and no user accounts. `ADMIN_PASSWORD` unlocks it, and a successful sign-in sets an `httpOnly`, `SameSite=Lax` cookie holding a signed token (`v1.<expiresAt>.<HMAC>`, valid for 7 days).

- The HMAC key is derived from both `SESSION_SECRET` and `ADMIN_PASSWORD`, so rotating either one signs every session out.
- Passwords and signatures are compared in constant time.
- `requireMaintainer()` runs at the top of **every** triage page **and every** triage server action. The layout isn't enough: server actions are reachable by direct POST, and layouts don't re-run on client navigation.
- `?next=` after sign-in only accepts `/triage` paths, so it can't redirect off-site.
- There is no `proxy.ts`. Following the Next.js guidance, checks sit next to the data instead.

This suits a small team that shares one maintainer password. Per-person accounts, audit trails or roles would need a real identity provider; see Limitations.

## Failure handling

| Situation                         | Reporter sees                                                   | Maintainer sees                                      |
| --------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| Invalid input                     | Error summary (focused) plus inline messages; typed values kept | n/a                                                  |
| `MONGODB_URI` missing             | "This site isn't fully set up"; the variable name is logged     | A notice naming the missing variable                 |
| Auth variables missing            | n/a                                                             | The sign-in page names the missing variable          |
| Database unreachable (5s timeout) | "Your report wasn't saved… try again"; typed values kept        | Triage error boundary with retry and an error digest |
| Report deleted elsewhere          | n/a                                                             | "This report no longer exists" / 404                 |

Configuration is read per request, never at import time, so `next build` needs no secrets and a misconfigured deployment still serves the pages that explain the problem.

There is deliberately no `loading.tsx` under `/triage`: a streaming boundary sends a 200 before `requireMaintainer()` and `notFound()` run, which turns real 307 and 404 responses into client-side redirects.

## Vercel decisions

- The MongoDB client is created once per instance and cached on `globalThis`. `attachDatabasePool` from `@vercel/functions` lets Fluid compute close idle connections before an instance is suspended. It is a no-op off Vercel.
- Nothing is written to the local filesystem and no state is kept in memory between requests, apart from the connection pool.
- No `vercel.json`: framework detection, the Node.js runtime and the default build command are correct as they are.

## Limitations

- **No rate limiting.** The report form has a honeypot field, and sign-in has none. Serverless instances share no memory, so real limits need an external store (for example Upstash Redis via the Vercel Marketplace) or Vercel's firewall rules.
- **No screenshots or attachments** on reports; that needs blob storage.
- **No conversation** between reporter and maintainer, and reporters can't look up a report's status: there are no reporter accounts or contact details.
- **One shared maintainer password.** No per-person identity or audit log.
- **The queue renders at most 200 rows** per view and says so; search or filters narrow it. Search is a case-insensitive substring match, not full-text search.
- Dates render in UTC on the server.
