# Portal Sertifikat

Public certificate search/download portal + admin import panel for BPIP Diklat, built with Next.js, Neon Postgres, and Vercel Blob.

## Local setup

1. `npm install`
2. Create a Neon Postgres project, put its connection string in `.env.local` as `DATABASE_URL`.
3. Create a Vercel Blob store, put its token in `.env.local` as `BLOB_READ_WRITE_TOKEN`. **The store must be created with public access** — Vercel sometimes defaults new stores to private access, which is incompatible with this app's design: certificate files are served from public Blob URLs that are protected at the application layer (a `status='siap'` check plus an unguessable random path suffix), not via Blob-level access control. A private store will make downloads fail.
4. Generate an `AUTH_SECRET`: `openssl rand -base64 32`.
5. `npm run db:push` — syncs the schema straight to Neon (fine for local dev; see the deployment section below for production).
6. Put `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` into `.env.local`, then run `npm run db:seed` — creates the first admin using those values (`seed.ts` loads `.env.local` itself).
7. `npm run dev`.

`.env.example` lists every environment variable this project reads.

**Security note:** the seeded admin password is whatever you put in `.env.local` — change it (or seed with a strong one) before exposing `/admin/login` publicly. The login form has no rate limiting or account lockout.

## Deploying to Vercel

1. Import the repo into Vercel.
2. Set `DATABASE_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, and the `ADMIN_*` vars as project environment variables.
3. Apply the schema with a real migration rather than `db:push` against production: run `npx drizzle-kit migrate` (using the migrations committed under `drizzle/`) against the production `DATABASE_URL`, then run `npm run db:seed` — both before or after the first deploy; neither runs automatically on deploy. `db:push` stays fine for local dev, but it's a live schema diff/sync tool, not a migration, so avoid it against a populated production database.
4. **Requires a Vercel Pro plan (or higher).** The ZIP import route (`src/app/api/admin/import/zip/route.ts`) sets `maxDuration = 300` (also mirrored in `vercel.json`), and Vercel's Hobby tier caps function duration at 60 seconds — a Hobby deployment will fail for this route as configured. If you're deploying on Hobby, either upgrade to Pro or lower `maxDuration` in both `vercel.json` and the route file (accepting a shorter time budget for processing large ZIP archives).
5. Deploy.

## Migrations

Schema migrations are generated with Drizzle Kit into `drizzle/` (`npm run db:generate`) and applied with `npx drizzle-kit migrate`. The committed `drizzle/0000_*.sql` is the baseline migration generated from the schema as of this fix pass; it has not been applied to the shared dev database (already up to date via `db:push`) — it exists as the starting point for future schema changes and for a from-scratch production deploy.

## Testing

- `npm run test` — Vitest unit + integration tests (integration tests hit the real `DATABASE_URL`, so point `.env.local` at a disposable dev database, not production).
- `npm run test:e2e` — Playwright end-to-end tests (needs the dev server and seeded fixture data described in `tests/e2e/*.spec.ts`).
