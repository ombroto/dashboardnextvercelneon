# Portal Sertifikat

Public certificate search/download portal + admin import panel for BPIP Diklat, built with Next.js, Neon Postgres, and Vercel Blob.

## Local setup

1. `npm install`
2. Create a Neon Postgres project, put its connection string in `.env.local` as `DATABASE_URL`.
3. Create a Vercel Blob store, put its token in `.env.local` as `BLOB_READ_WRITE_TOKEN`.
4. Generate an `AUTH_SECRET`: `openssl rand -base64 32`.
5. `npm run db:push` — creates the schema on Neon.
6. `ADMIN_NAME="..." ADMIN_EMAIL="..." ADMIN_PASSWORD="..." npm run db:seed` — creates the first admin.
7. `npm run dev`.

## Deploying to Vercel

1. Import the repo into Vercel.
2. Set `DATABASE_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN`, and the `ADMIN_*` vars as project environment variables.
3. Run `npm run db:push` and `npm run db:seed` manually against the production `DATABASE_URL` before or after the first deploy — migrations are never run automatically on deploy.
4. Deploy.

## Testing

- `npm run test` — Vitest unit + integration tests (integration tests hit the real `DATABASE_URL`, so point `.env.local` at a disposable dev database, not production).
- `npm run test:e2e` — Playwright end-to-end tests (needs the dev server and seeded fixture data described in `tests/e2e/*.spec.ts`).
