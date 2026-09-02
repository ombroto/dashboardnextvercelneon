# Portal Sertifikat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Next.js + Neon Postgres certificate portal: public NIK/name search + PDF download, and an admin panel to import participant CSVs and certificate PDF archives.

**Architecture:** Next.js 15 App Router (TypeScript) on Vercel; Neon Postgres via Drizzle ORM (`drizzle-orm/neon-http`); Auth.js Credentials (JWT session) for admin login; Vercel Blob for PDF/ZIP storage with client-side direct upload; the UT Glass design tokens ported as global CSS variables, Tailwind used only for layout.

**Tech Stack:** Next.js 15, React 19, TypeScript, Drizzle ORM, `@neondatabase/serverless`, `next-auth` v5, `bcryptjs`, `@vercel/blob`, `unzipper`, `csv-parse`, `lucide-react`, Tailwind CSS v4, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-02-portal-sertifikat-design.md`

## Global Constraints

- Standalone project — no RBAC, no Kegiatan CRUD, no map dashboard, no data migration from the old Laravel/MySQL `diklatdash`.
- `manifest.csv` inside an uploaded ZIP is `nik,nomor,file` (not `nik,nama,file`).
- NIK is masked (`3204**********07` pattern: first 4 + last 2 digits visible) everywhere in public-facing UI.
- Certificate preview renders the admin-uploaded PDF itself (`<iframe>`), never an HTML/CSS recreation.
- No e-signature / BSrE-BSSN integration — this system only stores and serves PDFs the admin already has.
- CSV/ZIP re-import must be idempotent by `sertifikat.nomor` and must never overwrite an existing `file_url`/`status='siap'` row with a blank one.
- Migrations are applied manually (`npm run db:push`), never automatically on deploy.

---

## Phase 0 — Project Setup

### Task 1: Scaffold the Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `.gitignore`, `.env.example`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Interfaces:**
- Produces: a booting Next.js app at `src/app/`, with `@/*` resolving to `src/*` (used by every later task's imports).

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "portal-sertifikat",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:seed": "tsx src/db/seed.ts"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install next@latest react@latest react-dom@latest drizzle-orm @neondatabase/serverless next-auth@beta bcryptjs @vercel/blob unzipper csv-parse lucide-react clsx
npm install -D typescript @types/react @types/react-dom @types/node @types/bcryptjs @types/unzipper eslint eslint-config-next tailwindcss@4 @tailwindcss/postcss vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom drizzle-kit tsx dotenv @playwright/test
```

Note: `next-auth@beta` is the v5 line (App Router-native `auth()`/`handlers` API used throughout this plan) — install the tag as shown even though "beta" sounds pre-release; pin the exact resolved version in `package.json` once installed so it doesn't drift.

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Note (added after Task 1/2 execution surfaced it): Next.js 16.3.4's own build/dev tooling automatically rewrites `tsconfig.json` on every `npm run build`/`npm run dev` to `"jsx": "react-jsx"` and adds the `.next/dev/types/**/*.ts` include entry shown above, regardless of what this file specifies — it is framework-managed, not a value this project's scaffold controls. The content above already reflects that auto-corrected state so later tasks aren't flagged for a "deviation" that is actually just Next.js re-asserting its own config on the first build/dev run.

- [ ] **Step 4: Write `next.config.ts`**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 5: Write `postcss.config.mjs`**

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules/
.next/
.env
.env.local
*.tsbuildinfo
next-env.d.ts
/test-results/
/playwright-report/
```

- [ ] **Step 7: Write `.env.example`**

```
DATABASE_URL=
AUTH_SECRET=
BLOB_READ_WRITE_TOKEN=
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

- [ ] **Step 8: Write `src/app/globals.css`**

```css
@import "tailwindcss";

body {
  margin: 0;
}
```

- [ ] **Step 9: Write `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portal Sertifikat Diklat',
  description: 'Cari dan unduh sertifikat diklat BPIP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: Write `src/app/page.tsx`**

```tsx
export default function HomePage() {
  return <main>Portal Sertifikat</main>;
}
```

- [ ] **Step 11: Verify the build**

Run: `npm run build`
Expected: build completes with no errors, `.next/` is produced.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project"
```

---

### Task 2: Port design tokens and fonts

**Files:**
- Create: `src/styles/tokens/colors.css`, `src/styles/tokens/glass.css`, `src/styles/tokens/typography.css`, `src/styles/tokens/spacing.css`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: CSS custom properties (`--ut-blue-600`, `--glass-regular`, `--radius-xl`, `--text-base`, etc.) that every component in later tasks styles with.

- [ ] **Step 1: Write `src/styles/tokens/colors.css`**

```css
:root {
  --ut-blue-50: #eef4fc;
  --ut-blue-100: #d3e3f6;
  --ut-blue-200: #a6c6ec;
  --ut-blue-300: #6fa0db;
  --ut-blue-400: #3c79c5;
  --ut-blue-500: #1a59ac;
  --ut-blue-600: #004a93;
  --ut-blue-700: #003c78;
  --ut-blue-800: #002e5e;
  --ut-blue-900: #001f42;

  --ut-gold-50: #fef9e6;
  --ut-gold-100: #fdf0bf;
  --ut-gold-200: #fbe183;
  --ut-gold-300: #f9d251;
  --ut-gold-400: #f6c62c;
  --ut-gold-500: #f5c518;
  --ut-gold-600: #d3a106;
  --ut-gold-700: #a37a00;

  --ut-magenta: #c0265e;
  --ut-magenta-soft: #d8497d;
  --ut-cyan: #1486be;
  --ut-cyan-soft: #4aa8d6;
  --ut-green: #12a150;
  --ut-green-soft: #36bd6e;
  --ut-orange: #f39200;
  --ut-orange-soft: #f8ad3e;

  --ink-950: #070f1c;
  --ink-900: #0b1626;
  --ink-800: #1a2740;
  --ink-700: #2c3a4f;
  --ink-600: #45556d;
  --ink-500: #5d6e87;
  --ink-400: #8492a8;
  --ink-300: #aab6c6;
  --ink-200: #cfd8e3;
  --ink-100: #e6ecf3;
  --ink-50: #f3f6fb;
  --white: #ffffff;

  --color-success: var(--ut-green);
  --color-warning: var(--ut-orange);
  --color-danger: #e0322e;
  --color-danger-soft: #ef5d59;
  --color-info: var(--ut-cyan);

  --brand-primary: var(--ut-blue-600);
  --brand-primary-hover: var(--ut-blue-700);
  --brand-secondary: var(--ut-gold-500);
  --brand-accent: var(--ut-magenta);

  --text-primary: var(--ink-900);
  --text-secondary: var(--ink-600);
  --text-tertiary: var(--ink-400);
  --text-on-brand: #ffffff;
  --text-on-gold: var(--ut-blue-900);
  --text-link: var(--ut-blue-600);

  --border-subtle: rgba(11, 22, 38, 0.08);
  --border-default: rgba(11, 22, 38, 0.14);
  --border-strong: rgba(11, 22, 38, 0.24);

  --focus-ring: rgba(0, 74, 147, 0.45);

  --app-bg:
    radial-gradient(900px 600px at 12% 8%, rgba(245, 197, 24, 0.30), transparent 60%),
    radial-gradient(1000px 700px at 88% 6%, rgba(192, 38, 94, 0.22), transparent 58%),
    radial-gradient(1100px 800px at 78% 95%, rgba(20, 134, 190, 0.30), transparent 60%),
    radial-gradient(900px 700px at 8% 92%, rgba(18, 161, 80, 0.20), transparent 60%),
    linear-gradient(160deg, #eaf1fb 0%, #dfeaf7 45%, #e9eef7 100%);
}
```

- [ ] **Step 2: Write `src/styles/tokens/glass.css`**

```css
:root {
  --glass-blur-xs: 6px;
  --glass-blur-sm: 12px;
  --glass-blur-md: 20px;
  --glass-blur-lg: 34px;
  --glass-blur-xl: 56px;
  --glass-saturate: 180%;

  --glass-ultrathin: rgba(255, 255, 255, 0.42);
  --glass-thin: rgba(255, 255, 255, 0.55);
  --glass-regular: rgba(255, 255, 255, 0.66);
  --glass-thick: rgba(255, 255, 255, 0.78);
  --glass-chrome: rgba(255, 255, 255, 0.86);

  --glass-border: rgba(255, 255, 255, 0.55);
  --glass-border-soft: rgba(255, 255, 255, 0.35);
  --glass-edge-top: inset 0 1px 0 rgba(255, 255, 255, 0.65);
  --glass-edge-ring: inset 0 0 0 1px rgba(255, 255, 255, 0.20);

  --shadow-xs: 0 1px 2px rgba(11, 22, 38, 0.06);
  --shadow-sm: 0 1px 2px rgba(11, 22, 38, 0.06), 0 2px 6px rgba(11, 22, 38, 0.05);
  --shadow-md: 0 2px 6px rgba(11, 22, 38, 0.06), 0 8px 24px rgba(11, 22, 38, 0.10);
  --shadow-lg: 0 4px 12px rgba(11, 22, 38, 0.08), 0 18px 48px rgba(11, 22, 38, 0.16);
  --shadow-xl: 0 8px 24px rgba(11, 22, 38, 0.10), 0 32px 80px rgba(11, 22, 38, 0.22);

  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  .glass-fallback {
    background: rgba(255, 255, 255, 0.92);
  }
}
```

- [ ] **Step 3: Write `src/styles/tokens/typography.css`**

```css
:root {
  --font-display: -apple-system, BlinkMacSystemFont, var(--font-geist-sans), system-ui, sans-serif;
  --font-sans: -apple-system, BlinkMacSystemFont, var(--font-geist-sans), system-ui, sans-serif;
  --font-mono: ui-monospace, "SF Mono", var(--font-geist-mono), "Cascadia Code", monospace;

  --text-2xs: 11px;
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 15px;
  --text-md: 17px;
  --text-lg: 20px;
  --text-xl: 24px;
  --text-2xl: 30px;
  --text-3xl: 38px;
  --text-4xl: 48px;

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  --tracking-tight: -0.014em;
  --tracking-normal: -0.006em;
}
```

- [ ] **Step 4: Write `src/styles/tokens/spacing.css`**

```css
:root {
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-2xl: 36px;
  --radius-pill: 999px;

  --control-sm: 32px;
  --control-md: 40px;
  --control-lg: 50px;
}
```

- [ ] **Step 5: Wire the tokens and Geist fonts into the app**

Modify `src/app/globals.css`:

```css
@import "tailwindcss";
@import "../styles/tokens/colors.css";
@import "../styles/tokens/glass.css";
@import "../styles/tokens/typography.css";
@import "../styles/tokens/spacing.css";

body {
  margin: 0;
  background: var(--app-bg);
  background-attachment: fixed;
  color: var(--text-primary);
  font-family: var(--font-sans);
}
```

Modify `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Portal Sertifikat Diklat',
  description: 'Cari dan unduh sertifikat diklat BPIP',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: port UT Glass design tokens as global CSS variables"
```

---

## Phase 1 — Database Layer

### Task 3: Drizzle schema and Neon connection

**Files:**
- Create: `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`

**Interfaces:**
- Produces: `db` (Drizzle client), tables `adminUsers`, `kegiatan`, `sertifikat`, `unduhanLog`, and types `AdminUser`, `Kegiatan`, `Sertifikat`, `UnduhanLog` — every later DB-touching task imports these.

- [ ] **Step 1: Create a Neon project for development**

Manual step (no CLI in this plan assumes a Neon account exists): create a Neon project, copy its pooled connection string, and put it in `.env.local` as `DATABASE_URL=postgresql://...`. This is the database every later task's tests run against.

- [ ] **Step 2: Write `src/db/schema.ts`**

```ts
import { pgTable, serial, text, varchar, integer, timestamp, pgEnum, date, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const sertifikatStatus = pgEnum('sertifikat_status', ['siap', 'belum']);

export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const kegiatan = pgTable('kegiatan', {
  id: serial('id').primaryKey(),
  nama: text('nama').notNull(),
  tanggalTerbit: date('tanggal_terbit').notNull(),
  jumlahJp: integer('jumlah_jp').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const sertifikat = pgTable(
  'sertifikat',
  {
    id: serial('id').primaryKey(),
    kegiatanId: integer('kegiatan_id')
      .notNull()
      .references(() => kegiatan.id, { onDelete: 'cascade' }),
    nama: text('nama').notNull(),
    nik: varchar('nik', { length: 16 }).notNull(),
    nomor: text('nomor').notNull().unique(),
    fileUrl: text('file_url'),
    fileSize: integer('file_size'),
    status: sertifikatStatus('status').notNull().default('belum'),
    unduhCount: integer('unduh_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('sertifikat_nik_idx').on(table.nik),
    index('sertifikat_nama_lower_idx').on(sql`lower(${table.nama})`),
  ]
);

export const unduhanLog = pgTable('unduhan_log', {
  id: serial('id').primaryKey(),
  sertifikatId: integer('sertifikat_id')
    .notNull()
    .references(() => sertifikat.id, { onDelete: 'cascade' }),
  waktu: timestamp('waktu', { withTimezone: true }).notNull().defaultNow(),
  ip: text('ip').notNull(),
  userAgent: text('user_agent'),
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type Kegiatan = typeof kegiatan.$inferSelect;
export type Sertifikat = typeof sertifikat.$inferSelect;
export type UnduhanLog = typeof unduhanLog.$inferSelect;
```

- [ ] **Step 3: Write `src/db/index.ts`**

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 4: Write `drizzle.config.ts`**

Note: use `dotenv`'s `config({ path: '.env.local' })` form here, not the bare `import 'dotenv/config'` side-effect import — the latter only auto-loads a file literally named `.env`, and this project's local secrets live in `.env.local` (the Next.js convention), so the bare import silently leaves `DATABASE_URL` unset for any command run outside Next's own dev/build process (drizzle-kit, `tsx` scripts).

```ts
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

- [ ] **Step 5: Push the schema to the dev Neon database**

Run: `npm run db:push`
Expected: drizzle-kit reports the 4 tables (and the `sertifikat_status` enum) created with no errors.

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Drizzle schema and Neon connection"
```

---

### Task 4: Admin seed script

**Files:**
- Create: `src/db/seed.ts`
- Test: `tests/unit/seed.test.ts`

**Interfaces:**
- Consumes: `db`, `adminUsers` from `src/db/index.ts` / `src/db/schema.ts` (Task 3).
- Produces: `npm run db:seed` creates the first admin row from `ADMIN_NAME`/`ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars.

- [ ] **Step 1: Set up Vitest**

Write `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Write `vitest.setup.ts` — this also loads `.env.local` into `process.env` before any test runs, since Vitest does not do this automatically for plain `process.env` reads (only Vite's `import.meta.env`, which this project's Node-side `src/db/index.ts` doesn't use) and every integration test in this plan needs `process.env.DATABASE_URL` set:

```ts
import '@testing-library/jest-dom/vitest';
import { config } from 'dotenv';

config({ path: '.env.local' });
```

- [ ] **Step 2: Write the failing test**

`tests/unit/seed.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('admin password hashing', () => {
  it('hashes and verifies a password round-trip', async () => {
    const hash = await bcrypt.hash('correct-horse', 10);
    expect(await bcrypt.compare('correct-horse', hash)).toBe(true);
    expect(await bcrypt.compare('wrong-password', hash)).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- tests/unit/seed.test.ts`
Expected: FAIL — `bcryptjs` not yet exercised in this file structure, or passes trivially since it only tests bcryptjs itself. Since this is a library sanity check rather than new code, expect it to already PASS once written (bcryptjs is already installed from Task 1) — treat this as the baseline confidence check before writing `seed.ts`, then continue.

- [ ] **Step 4: Write `src/db/seed.ts`**

Same note as Task 3's `drizzle.config.ts`: load `.env.local` explicitly, not the bare `dotenv/config` side-effect import. **Additionally**, `./index` and `./schema` must be imported dynamically (`await import(...)`) inside `seed()`, not as static top-of-file imports: ES module imports are evaluated in dependency order before the importing file's own top-level statements run, so a static `import { db } from './index'` would run `src/db/index.ts`'s module-level `neon(process.env.DATABASE_URL)` call — and throw, since it's unset — before this file's own `config({ path: '.env.local' })` call ever executes, regardless of which line comes first textually.

```ts
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

config({ path: '.env.local' });

async function seed() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? 'Admin';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
  }

  // Loaded dynamically so config() above populates process.env.DATABASE_URL
  // before src/db/index.ts reads it at module-evaluation time.
  const { db } = await import('./index');
  const { adminUsers } = await import('./schema');

  const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
  if (existing.length > 0) {
    console.log(`Admin ${email} already exists, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(adminUsers).values({ name, email, passwordHash });
  console.log(`Created admin ${email}`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
```

- [ ] **Step 5: Run the seed script against the dev database**

Run: `ADMIN_NAME="Admin BPIP" ADMIN_EMAIL="admin@bpip.go.id" ADMIN_PASSWORD="ChangeMe123!" npm run db:seed`
Expected: logs `Created admin admin@bpip.go.id`. Running it again logs `already exists, skipping.` (idempotent).

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add admin seed script"
```

---

## Phase 2 — Core Utilities

### Task 5: NIK normalize/mask utilities

**Files:**
- Create: `src/lib/nik.ts`
- Test: `tests/unit/nik.test.ts`

**Interfaces:**
- Produces: `normalizeNik(input: string): string`, `maskNik(nik: string): string` — used by search, CSV import, ZIP matching, and every public-facing display of a NIK.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { normalizeNik, maskNik } from '@/lib/nik';

describe('normalizeNik', () => {
  it('strips non-digit characters', () => {
    expect(normalizeNik('3204-0125-0987-0007')).toBe('3204012509870007');
  });

  it('leaves plain digits unchanged', () => {
    expect(normalizeNik('3204012509870007')).toBe('3204012509870007');
  });
});

describe('maskNik', () => {
  it('keeps the first 4 and last 2 digits, masks the rest', () => {
    expect(maskNik('3204012509870007')).toBe('3204**********07');
  });

  it('returns short input unchanged', () => {
    expect(maskNik('12345')).toBe('12345');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/nik.test.ts`
Expected: FAIL with "Cannot find module '@/lib/nik'".

- [ ] **Step 3: Write `src/lib/nik.ts`**

```ts
export function normalizeNik(input: string): string {
  return input.replace(/\D/g, '');
}

export function maskNik(nik: string): string {
  const digits = normalizeNik(nik);
  if (digits.length <= 6) return digits;
  const start = digits.slice(0, 4);
  const end = digits.slice(-2);
  const middle = '*'.repeat(digits.length - 6);
  return `${start}${middle}${end}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/nik.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add NIK normalize/mask utilities"
```

---

### Task 6: Participant CSV parser

**Files:**
- Create: `src/lib/csv.ts`
- Test: `tests/unit/csv.test.ts`

**Interfaces:**
- Consumes: `normalizeNik` from `src/lib/nik.ts` (Task 5).
- Produces: `parseParticipantCsv(csvText: string): { rows: ParticipantRow[]; errors: CsvRowError[] }`, `interface ParticipantRow { nik: string; nama: string; kegiatan: string; tanggalTerbit: string; nomor: string; jam: number }`, `interface CsvRowError { line: number; message: string }` — used by the CSV import route (Task 18).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { parseParticipantCsv } from '@/lib/csv';

const VALID_CSV = `nik,nama,kegiatan,tanggal_terbit,nomor,jam
3204012509870007,Sri Wahyuni,Diklat Pembudayaan Nilai Pancasila Angkatan VII,2026-06-18,SK-1182/DIK/2026,32
3174052003910012,Bayu Anggara Putra,Diklat Pembudayaan Nilai Pancasila Angkatan VII,2026-06-18,SK-1183/DIK/2026,32`;

describe('parseParticipantCsv', () => {
  it('parses valid rows', () => {
    const { rows, errors } = parseParticipantCsv(VALID_CSV);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      nik: '3204012509870007',
      nama: 'Sri Wahyuni',
      kegiatan: 'Diklat Pembudayaan Nilai Pancasila Angkatan VII',
      tanggalTerbit: '2026-06-18',
      nomor: 'SK-1182/DIK/2026',
      jam: 32,
    });
  });

  it('reports a missing required column with its line number', () => {
    const csv = `nik,nama,kegiatan,tanggal_terbit,nomor,jam
,Sri Wahyuni,Diklat X,2026-06-18,SK-1182/DIK/2026,32`;
    const { rows, errors } = parseParticipantCsv(csv);
    expect(rows).toHaveLength(0);
    expect(errors).toEqual([{ line: 2, message: "Kolom 'nik' kosong" }]);
  });

  it('reports a non-numeric jam column', () => {
    const csv = `nik,nama,kegiatan,tanggal_terbit,nomor,jam
3204012509870007,Sri Wahyuni,Diklat X,2026-06-18,SK-1182/DIK/2026,abc`;
    const { rows, errors } = parseParticipantCsv(csv);
    expect(rows).toHaveLength(0);
    expect(errors).toEqual([{ line: 2, message: "Kolom 'jam' harus berupa angka positif" }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/csv.test.ts`
Expected: FAIL with "Cannot find module '@/lib/csv'".

- [ ] **Step 3: Write `src/lib/csv.ts`**

```ts
import { parse } from 'csv-parse/sync';
import { normalizeNik } from './nik';

export interface ParticipantRow {
  nik: string;
  nama: string;
  kegiatan: string;
  tanggalTerbit: string;
  nomor: string;
  jam: number;
}

export interface CsvRowError {
  line: number;
  message: string;
}

export interface ParseParticipantCsvResult {
  rows: ParticipantRow[];
  errors: CsvRowError[];
}

const REQUIRED_COLUMNS = ['nik', 'nama', 'kegiatan', 'tanggal_terbit', 'nomor', 'jam'] as const;

export function parseParticipantCsv(csvText: string): ParseParticipantCsvResult {
  const records: Record<string, string>[] = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const rows: ParticipantRow[] = [];
  const errors: CsvRowError[] = [];

  records.forEach((record, index) => {
    const line = index + 2;
    const missing = REQUIRED_COLUMNS.find((col) => !record[col]);
    if (missing) {
      errors.push({ line, message: `Kolom '${missing}' kosong` });
      return;
    }

    const jam = Number(record.jam);
    if (!Number.isFinite(jam) || jam <= 0) {
      errors.push({ line, message: "Kolom 'jam' harus berupa angka positif" });
      return;
    }

    rows.push({
      nik: normalizeNik(record.nik),
      nama: record.nama,
      kegiatan: record.kegiatan,
      tanggalTerbit: record.tanggal_terbit,
      nomor: record.nomor,
      jam,
    });
  });

  return { rows, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/csv.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add participant CSV parser"
```

---

### Task 7: ZIP filename/manifest matching logic

**Files:**
- Create: `src/lib/zip-match.ts`
- Test: `tests/unit/zip-match.test.ts`

**Interfaces:**
- Consumes: `normalizeNik` from `src/lib/nik.ts` (Task 5).
- Produces: `extractNomorPrefix(nomor: string): string`, `parseManifestCsv(csvText: string): ManifestRow[]`, `interface ManifestRow { nik: string; nomor: string; file: string }`, `matchFilenameToCandidate(filename: string, candidates: MatchCandidate[]): number | null`, `interface MatchCandidate { id: number; nik: string; nomor: string }` — used by the ZIP import route (Task 20).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { extractNomorPrefix, parseManifestCsv, matchFilenameToCandidate } from '@/lib/zip-match';

describe('extractNomorPrefix', () => {
  it('takes the part before the first slash', () => {
    expect(extractNomorPrefix('SK-1182/DIK/2026')).toBe('SK-1182');
  });

  it('returns the whole string when there is no slash', () => {
    expect(extractNomorPrefix('SK-1182')).toBe('SK-1182');
  });
});

describe('parseManifestCsv', () => {
  it('parses nik,nomor,file rows', () => {
    const csv = `nik,nomor,file
3204012509870007,SK-1182/DIK/2026,3204012509870007_SK-1182.pdf`;
    expect(parseManifestCsv(csv)).toEqual([
      { nik: '3204012509870007', nomor: 'SK-1182/DIK/2026', file: '3204012509870007_SK-1182.pdf' },
    ]);
  });
});

describe('matchFilenameToCandidate', () => {
  const candidates = [
    { id: 1, nik: '3204012509870007', nomor: 'SK-1182/DIK/2026' },
    { id: 2, nik: '3204012509870007', nomor: 'SK-0741/DIK/2026' },
    { id: 3, nik: '3174052003910012', nomor: 'SK-1183/DIK/2026' },
  ];

  it('matches by nik + nomor prefix', () => {
    expect(matchFilenameToCandidate('3204012509870007_SK-1182.pdf', candidates)).toBe(1);
  });

  it('disambiguates a nik with multiple certificates by nomor prefix', () => {
    expect(matchFilenameToCandidate('3204012509870007_SK-0741.pdf', candidates)).toBe(2);
  });

  it('returns null when nothing matches', () => {
    expect(matchFilenameToCandidate('9999999999999999_SK-9999.pdf', candidates)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/zip-match.test.ts`
Expected: FAIL with "Cannot find module '@/lib/zip-match'".

- [ ] **Step 3: Write `src/lib/zip-match.ts`**

```ts
import { parse } from 'csv-parse/sync';
import { normalizeNik } from './nik';

export interface ManifestRow {
  nik: string;
  nomor: string;
  file: string;
}

export function parseManifestCsv(csvText: string): ManifestRow[] {
  const records: Record<string, string>[] = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records.map((r) => ({
    nik: normalizeNik(r.nik),
    nomor: r.nomor,
    file: r.file,
  }));
}

export function extractNomorPrefix(nomor: string): string {
  const slashIndex = nomor.indexOf('/');
  return slashIndex === -1 ? nomor : nomor.slice(0, slashIndex);
}

export interface MatchCandidate {
  id: number;
  nik: string;
  nomor: string;
}

export function matchFilenameToCandidate(filename: string, candidates: MatchCandidate[]): number | null {
  const baseName = filename.replace(/\.pdf$/i, '');
  const matches = candidates.filter((c) => baseName === `${c.nik}_${extractNomorPrefix(c.nomor)}`);
  return matches.length === 1 ? matches[0].id : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/zip-match.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add ZIP manifest/filename matching logic"
```

---

## Phase 3 — UI Primitives

### Task 8: Icon, Button, IconButton components

**Files:**
- Create: `src/components/ui/Icon.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/IconButton.tsx`
- Test: `tests/unit/components/button.test.tsx`

**Interfaces:**
- Produces: `Icon({ name, size }: { name: string; size?: number })`, `Button({ variant, size, block, type, onClick, children }: ButtonProps)`, `IconButton({ icon, label, size, variant, type, onClick }: IconButtonProps)` — used by every page component from Task 12 onward. `IconButton`'s `type` defaults to `'button'` with a required `onClick`; passing `type="submit"` (Task 23's delete-in-a-form use case) makes `onClick` optional, since form submission itself triggers the action.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children and responds to click', () => {
    const onClick = vi.fn();
    render(<Button variant="primary" onClick={onClick}>Cari</Button>);
    fireEvent.click(screen.getByText('Cari'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies the primary variant background token', () => {
    render(<Button variant="primary">Cari</Button>);
    const el = screen.getByText('Cari');
    expect(el.style.background).toContain('var(--ut-blue-600)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/components/button.test.tsx`
Expected: FAIL with "Cannot find module '@/components/ui/Button'".

- [ ] **Step 3: Write `src/components/ui/Icon.tsx`**

```tsx
import * as icons from 'lucide-react';
import { icons as iconRegistry } from 'lucide-react';

type IconName = keyof typeof iconRegistry;

function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const componentName = toPascalCase(name) as keyof typeof icons;
  const LucideIcon = icons[componentName] as React.ComponentType<{ size?: number }> | undefined;
  if (!LucideIcon) return null;
  return <LucideIcon size={size} />;
}
```

- [ ] **Step 4: Write `src/components/ui/Button.tsx`**

```tsx
export type ButtonVariant = 'primary' | 'glass' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  children: React.ReactNode;
}

const HEIGHTS: Record<ButtonSize, string> = {
  sm: 'var(--control-sm)',
  md: 'var(--control-md)',
  lg: 'var(--control-lg)',
};

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--ut-blue-600)',
    color: 'var(--text-on-brand)',
    border: '1px solid transparent',
  },
  glass: {
    background: 'var(--glass-regular)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border)',
    backdropFilter: 'blur(var(--glass-blur-md)) saturate(var(--glass-saturate))',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)',
  },
};

export function Button({ variant = 'primary', size = 'md', block, type = 'button', onClick, children }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        ...VARIANT_STYLES[variant],
        height: HEIGHTS[size],
        width: block ? '100%' : undefined,
        borderRadius: 'var(--radius-pill)',
        padding: '0 20px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--weight-semibold)',
        fontSize: 'var(--text-sm)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 5: Write `src/components/ui/IconButton.tsx`**

```tsx
import { Icon } from './Icon';
import type { ButtonSize, ButtonVariant } from './Button';

export interface IconButtonProps {
  icon: string;
  label: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  type?: 'button' | 'submit';
  onClick?: () => void;
}

export function IconButton({ icon, label, size = 'md', variant = 'ghost', type = 'button', onClick }: IconButtonProps) {
  const dimension = size === 'sm' ? 32 : size === 'lg' ? 50 : 40;
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: '50%',
        border: variant === 'glass' ? '1px solid var(--glass-border)' : '1px solid transparent',
        background: variant === 'glass' ? 'var(--glass-thin)' : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--ink-600)',
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- tests/unit/components/button.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Icon, Button, IconButton components"
```

---

### Task 9: Input, Badge, Card components

**Files:**
- Create: `src/components/ui/Input.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/Card.tsx`
- Test: `tests/unit/components/input.test.tsx`, `tests/unit/components/badge.test.tsx`

**Interfaces:**
- Consumes: `Icon` from `src/components/ui/Icon.tsx` (Task 8).
- Produces: `Input({ label, icon, size, type, placeholder, value, onChange, onKeyDown })`, `Badge({ variant, size, children })`, `Card({ variant, title, children })` — used by the search form (Task 12) and admin tables (Tasks 22-24).

- [ ] **Step 1: Write the failing tests**

`tests/unit/components/input.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders the label and calls onChange with the new value', () => {
    const onChange = vi.fn();
    render(<Input label="NIK atau Nama Lengkap" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('NIK atau Nama Lengkap'), { target: { value: 'Sri' } });
    expect(onChange).toHaveBeenCalledWith('Sri');
  });
});
```

`tests/unit/components/badge.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders its children with the success variant color', () => {
    render(<Badge variant="success">Siap</Badge>);
    const el = screen.getByText('Siap');
    expect(el.style.color).toContain('var(--ut-green)');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- tests/unit/components/input.test.tsx tests/unit/components/badge.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/components/ui/Input.tsx`**

```tsx
import { useId } from 'react';
import { Icon } from './Icon';

export interface InputProps {
  label?: string;
  icon?: string;
  size?: 'md' | 'lg';
  type?: 'text' | 'password' | 'email';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function Input({ label, icon, size = 'md', type = 'text', placeholder, value, onChange, onKeyDown }: InputProps) {
  const id = useId();
  const height = size === 'lg' ? 'var(--control-lg)' : 'var(--control-md)';

  return (
    <div>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height, padding: '0 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.7)' }}>
        {icon && <Icon name={icon} size={16} />}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--text-base)', fontFamily: 'inherit' }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/components/ui/Badge.tsx`**

```tsx
export type BadgeVariant = 'success' | 'warning' | 'neutral';

const VARIANT_COLORS: Record<BadgeVariant, string> = {
  success: 'var(--ut-green)',
  warning: 'var(--ut-orange)',
  neutral: 'var(--ink-500)',
};

export function Badge({ variant = 'neutral', children }: { variant?: BadgeVariant; size?: 'sm'; children: React.ReactNode }) {
  const color = VARIANT_COLORS[variant];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 'var(--weight-semibold)',
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Write `src/components/ui/Card.tsx`**

```tsx
export function Card({ title, children }: { variant?: 'glass'; title?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 'var(--radius-xl)',
        background: 'var(--glass-regular)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-sm), var(--glass-edge-top)',
        backdropFilter: 'blur(var(--glass-blur-md)) saturate(var(--glass-saturate))',
      }}
    >
      {title && (
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', marginBottom: 8 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test -- tests/unit/components/input.test.tsx tests/unit/components/badge.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Input, Badge, Card components"
```

---

### Task 10: Tabs component

**Files:**
- Create: `src/components/ui/Tabs.tsx`
- Test: `tests/unit/components/tabs.test.tsx`

**Interfaces:**
- Produces: `Tabs({ items, value, onChange }: { items: { key: string; label: string }[]; value: string; onChange: (key: string) => void })` — used by the admin dashboard (Task 25).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '@/components/ui/Tabs';

describe('Tabs', () => {
  it('calls onChange with the clicked tab key', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        items={[
          { key: 'unggah', label: 'Unggah' },
          { key: 'penerima', label: 'Penerima' },
        ]}
        value="unggah"
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('Penerima'));
    expect(onChange).toHaveBeenCalledWith('penerima');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/unit/components/tabs.test.tsx`
Expected: FAIL with "Cannot find module '@/components/ui/Tabs'".

- [ ] **Step 3: Write `src/components/ui/Tabs.tsx`**

```tsx
export interface TabItem {
  key: string;
  label: string;
}

export function Tabs({ items, value, onChange }: { items: TabItem[]; value: string; onChange: (key: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 'var(--radius-pill)', background: 'rgba(11,22,38,0.05)' }}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              background: active ? '#fff' : 'transparent',
              color: active ? 'var(--ut-blue-700)' : 'var(--ink-500)',
              boxShadow: active ? 'var(--shadow-xs)' : 'none',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/unit/components/tabs.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Tabs component"
```

---

## Phase 4 — Public Portal

### Task 11: Search queries

**Files:**
- Create: `src/lib/search.ts`
- Test: `tests/integration/search.test.ts`

**Interfaces:**
- Consumes: `db`, `sertifikat`, `kegiatan` from `src/db` (Task 3).
- Produces: `searchByNik(nik: string): Promise<PersonResult | null>`, `searchByName(name: string): Promise<PersonResult[]>`, `interface PersonResult { nik: string; nama: string; certificates: CertificateSummary[] }`, `interface CertificateSummary { id: number; nomor: string; kegiatanNama: string; tanggalTerbit: string; jumlahJp: number; status: 'siap' | 'belum' }` — used by the search page (Task 12) and results page (Task 13).

This task's test is an **integration test** against the real dev Neon database from Task 3 (there is no mocked DB layer in this project) — it seeds rows, queries, then cleans up after itself.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { searchByNik, searchByName } from '@/lib/search';
import { eq } from 'drizzle-orm';

describe('search', () => {
  let kegiatanId: number;

  beforeAll(async () => {
    const [k] = await db
      .insert(kegiatan)
      .values({ nama: 'Uji Coba Diklat', tanggalTerbit: '2026-01-01', jumlahJp: 16 })
      .returning();
    kegiatanId = k.id;
    await db.insert(sertifikat).values({
      kegiatanId,
      nama: 'Nama Uji Coba',
      nik: '1111111111111111',
      nomor: 'TEST-0001/UJI/2026',
      status: 'belum',
    });
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('finds a person by exact NIK', async () => {
    const result = await searchByNik('1111111111111111');
    expect(result?.nama).toBe('Nama Uji Coba');
    expect(result?.certificates).toHaveLength(1);
    expect(result?.certificates[0].kegiatanNama).toBe('Uji Coba Diklat');
  });

  it('finds a person by partial name', async () => {
    const results = await searchByName('Uji Coba');
    expect(results.some((p) => p.nik === '1111111111111111')).toBe(true);
  });

  it('returns null for an unknown NIK', async () => {
    expect(await searchByNik('0000000000000000')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/integration/search.test.ts`
Expected: FAIL with "Cannot find module '@/lib/search'".

- [ ] **Step 3: Write `src/lib/search.ts`**

```ts
import { eq, ilike } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat, kegiatan } from '@/db/schema';

export interface CertificateSummary {
  id: number;
  nomor: string;
  kegiatanNama: string;
  tanggalTerbit: string;
  jumlahJp: number;
  status: 'siap' | 'belum';
}

export interface PersonResult {
  nik: string;
  nama: string;
  certificates: CertificateSummary[];
}

type JoinedRow = { sertifikat: typeof sertifikat.$inferSelect; kegiatan: typeof kegiatan.$inferSelect };

function groupToPerson(nik: string, rows: JoinedRow[]): PersonResult | null {
  if (rows.length === 0) return null;
  return {
    nik,
    nama: rows[0].sertifikat.nama,
    certificates: rows.map((r) => ({
      id: r.sertifikat.id,
      nomor: r.sertifikat.nomor,
      kegiatanNama: r.kegiatan.nama,
      tanggalTerbit: r.kegiatan.tanggalTerbit,
      jumlahJp: r.kegiatan.jumlahJp,
      status: r.sertifikat.status,
    })),
  };
}

export async function searchByNik(nik: string): Promise<PersonResult | null> {
  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(eq(sertifikat.nik, nik));
  return groupToPerson(nik, rows);
}

export async function searchByName(name: string): Promise<PersonResult[]> {
  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(ilike(sertifikat.nama, `%${name}%`));

  const byNik = new Map<string, JoinedRow[]>();
  for (const row of rows) {
    const list = byNik.get(row.sertifikat.nik) ?? [];
    list.push(row);
    byNik.set(row.sertifikat.nik, list);
  }

  const people: PersonResult[] = [];
  for (const [nik, personRows] of byNik) {
    const person = groupToPerson(nik, personRows);
    if (person) people.push(person);
  }
  return people;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/integration/search.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add search queries"
```

---

### Task 12: Search page (`/`)

**Files:**
- Create: `src/app/actions/search.ts`, `src/app/page.tsx`, `src/components/search/SearchForm.tsx`

**Interfaces:**
- Consumes: `searchByNik`, `searchByName` from `src/lib/search.ts` (Task 11); `normalizeNik` from `src/lib/nik.ts` (Task 5); `Input`, `Button`, `Icon` from `src/components/ui/*` (Tasks 8-9).
- Produces: a server action `searchAction(query: string)` that redirects to `/hasil/[nik]` or `/hasil?nama=...` — consumed by Task 13's routing.

- [ ] **Step 1: Write `src/app/actions/search.ts`**

```ts
'use server';

import { redirect } from 'next/navigation';
import { normalizeNik } from '@/lib/nik';

export async function searchAction(rawQuery: string): Promise<void> {
  const query = rawQuery.trim();
  if (!query) {
    redirect('/?error=' + encodeURIComponent('Masukkan NIK atau nama terlebih dahulu.'));
  }

  const digits = normalizeNik(query);
  if (digits.length >= 10) {
    redirect(`/hasil/${digits}`);
  }

  redirect(`/hasil?nama=${encodeURIComponent(query)}`);
}
```

- [ ] **Step 2: Write `src/components/search/SearchForm.tsx`**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { searchAction } from '@/app/actions/search';

export function SearchForm({ error }: { error?: string }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(() => {
      searchAction(query);
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input
            label="NIK atau Nama Lengkap"
            icon="search"
            size="lg"
            placeholder="mis. 3204012509870007 atau Sri Wahyuni"
            value={query}
            onChange={setQuery}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        <Button variant="primary" size="lg" onClick={submit}>
          {isPending ? 'Mencari...' : 'Cari'}
        </Button>
      </div>
      {error && (
        <div style={{ marginTop: 12, color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write `src/app/page.tsx`**

```tsx
import { SearchForm } from '@/components/search/SearchForm';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 660, margin: '60px auto 0' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', textAlign: 'center' }}>
          Cari sertifikat Anda
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Masukkan NIK atau nama lengkap sesuai data pendaftaran.
        </p>
        <SearchForm error={error} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, open `http://localhost:3000`, type a NIK and press Enter.
Expected: navigates to `/hasil/<digits>` (404 is fine for now — Task 13 builds that page next).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add public search page"
```

---

### Task 13: Results page (`/hasil`)

**Files:**
- Create: `src/app/hasil/[nik]/page.tsx`, `src/app/hasil/page.tsx`, `src/components/search/CertificateCard.tsx`

**Interfaces:**
- Consumes: `searchByNik`, `searchByName`, `PersonResult`, `CertificateSummary` from `src/lib/search.ts` (Task 11); `maskNik` from `src/lib/nik.ts` (Task 5); `Badge`, `Button` from `src/components/ui/*`.

- [ ] **Step 1: Write `src/components/search/CertificateCard.tsx`**

```tsx
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { CertificateSummary } from '@/lib/search';

export function CertificateCard({ certificate }: { certificate: CertificateSummary }) {
  const ready = certificate.status === 'siap';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '18px 20px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--glass-regular)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'var(--weight-semibold)' }}>{certificate.kegiatanNama}</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 5, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{certificate.nomor}</span>
          <span>Terbit {certificate.tanggalTerbit}</span>
          <span>{certificate.jumlahJp} JP</span>
        </div>
      </div>
      <Badge variant={ready ? 'success' : 'warning'}>{ready ? 'Siap' : 'Diproses'}</Badge>
      {ready ? (
        <Link href={`/pratinjau/${certificate.id}`}>
          <Button variant="glass" size="sm">Lihat</Button>
        </Link>
      ) : (
        <Button variant="ghost" size="sm">Sedang diproses</Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write `src/app/hasil/[nik]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { searchByNik } from '@/lib/search';
import { maskNik } from '@/lib/nik';
import { CertificateCard } from '@/components/search/CertificateCard';

export default async function HasilPage({ params }: { params: Promise<{ nik: string }> }) {
  const { nik } = await params;
  const person = await searchByNik(nik);

  if (!person) {
    notFound();
  }

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ padding: '22px 24px', borderRadius: 'var(--radius-xl)', background: 'var(--ut-blue-700)', color: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>{person.nama}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>NIK {maskNik(person.nik)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {person.certificates.map((c) => (
            <CertificateCard key={c.id} certificate={c} />
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Write `src/app/hasil/page.tsx`** (name-search entry point, handles both the single-match and disambiguation cases)

```tsx
import Link from 'next/link';
import { searchByName } from '@/lib/search';
import { maskNik } from '@/lib/nik';
import { redirect } from 'next/navigation';
import { CertificateCard } from '@/components/search/CertificateCard';

export default async function HasilByNamePage({
  searchParams,
}: {
  searchParams: Promise<{ nama?: string }>;
}) {
  const { nama } = await searchParams;
  if (!nama) redirect('/');

  const people = await searchByName(nama);

  if (people.length === 0) {
    redirect('/?error=' + encodeURIComponent('Tidak ditemukan sertifikat untuk pencarian tersebut.'));
  }

  if (people.length === 1) {
    redirect(`/hasil/${people[0].nik}`);
  }

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 600, margin: '40px auto 0' }}>
        <h2>Beberapa orang cocok dengan pencarian ini — pilih salah satu:</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {people.map((p) => (
            <Link
              key={p.nik}
              href={`/hasil/${p.nik}`}
              style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'var(--glass-thin)', border: '1px solid var(--glass-border)' }}
            >
              {p.nama} — <span style={{ fontFamily: 'var(--font-mono)' }}>{maskNik(p.nik)}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
```

Note: `CertificateCard` is imported here for parity with the results page but not directly rendered on the disambiguation list — remove the unused import if the linter flags it, since this page only needs `Link` and `maskNik`.

- [ ] **Step 4: Verify manually**

Run: `npm run dev`. Search by the test NIK seeded in Task 11 (`1111111111111111`) — expect the results page to render. Search by a name matching zero rows — expect redirect back to `/` with an error message shown.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add results page with name-search disambiguation"
```

---

### Task 14: Preview page (`/pratinjau/[sertifikatId]`)

**Files:**
- Create: `src/app/pratinjau/[sertifikatId]/page.tsx`
- Modify: `src/lib/search.ts` (add a single-certificate lookup)
- Test: `tests/integration/search.test.ts` (extend)

**Interfaces:**
- Consumes: `db`, `sertifikat`, `kegiatan` from `src/db` (Task 3); `maskNik` from `src/lib/nik.ts`.
- Produces: `getCertificateById(id: number): Promise<CertificateDetail | null>`, `interface CertificateDetail extends CertificateSummary { nama: string; nik: string; fileUrl: string | null; fileSize: number | null }` — used by the preview page here and the download route (Task 15).

- [ ] **Step 1: Extend the failing test**

Add to `tests/integration/search.test.ts`:

```ts
import { getCertificateById } from '@/lib/search';
// ...inside the existing describe block, alongside the other `it`s:

it('fetches a single certificate by id with file info', async () => {
  const person = await searchByNik('1111111111111111');
  const certId = person!.certificates[0].id;
  const detail = await getCertificateById(certId);
  expect(detail?.nama).toBe('Nama Uji Coba');
  expect(detail?.fileUrl).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/integration/search.test.ts`
Expected: FAIL — `getCertificateById` is not exported yet.

- [ ] **Step 3: Add `getCertificateById` to `src/lib/search.ts`**

Append:

```ts
export interface CertificateDetail extends CertificateSummary {
  nama: string;
  nik: string;
  fileUrl: string | null;
  fileSize: number | null;
}

export async function getCertificateById(id: number): Promise<CertificateDetail | null> {
  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(eq(sertifikat.id, id));

  if (rows.length === 0) return null;
  const { sertifikat: s, kegiatan: k } = rows[0];
  return {
    id: s.id,
    nomor: s.nomor,
    kegiatanNama: k.nama,
    tanggalTerbit: k.tanggalTerbit,
    jumlahJp: k.jumlahJp,
    status: s.status,
    nama: s.nama,
    nik: s.nik,
    fileUrl: s.fileUrl,
    fileSize: s.fileSize,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/integration/search.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `src/app/pratinjau/[sertifikatId]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { getCertificateById } from '@/lib/search';
import { maskNik } from '@/lib/nik';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function PratinjauPage({ params }: { params: Promise<{ sertifikatId: string }> }) {
  const { sertifikatId } = await params;
  const certificate = await getCertificateById(Number(sertifikatId));

  if (!certificate || certificate.status !== 'siap' || !certificate.fileUrl) {
    notFound();
  }

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)' }}>
          <iframe src={certificate.fileUrl} title="Sertifikat" style={{ width: '100%', height: 700, border: 'none' }} />
        </div>
        <Card title="Rincian Sertifikat">
          <dl style={{ fontSize: 'var(--text-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <dt style={{ color: 'var(--text-tertiary)' }}>Nama</dt>
              <dd>{certificate.nama}</dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <dt style={{ color: 'var(--text-tertiary)' }}>NIK</dt>
              <dd style={{ fontFamily: 'var(--font-mono)' }}>{maskNik(certificate.nik)}</dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0' }}>
              <dt style={{ color: 'var(--text-tertiary)' }}>Kegiatan</dt>
              <dd>{certificate.kegiatanNama}</dd>
            </div>
          </dl>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
            <a href={`/sertifikat/${certificate.id}/download`}>
              <Button variant="primary" block>Unduh PDF</Button>
            </a>
          </div>
        </Card>
      </div>
    </main>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add certificate preview page"
```

---

### Task 15: Download route with logging

**Files:**
- Create: `src/app/sertifikat/[id]/download/route.ts`
- Test: `tests/integration/download.test.ts`

**Interfaces:**
- Consumes: `getCertificateById` from `src/lib/search.ts` (Task 14); `db`, `sertifikat`, `unduhanLog` from `src/db` (Task 3).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import { kegiatan, sertifikat, unduhanLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { GET } from '@/app/sertifikat/[id]/download/route';

describe('download route', () => {
  let kegiatanId: number;
  let certId: number;

  beforeAll(async () => {
    const [k] = await db
      .insert(kegiatan)
      .values({ nama: 'Uji Unduh', tanggalTerbit: '2026-01-01', jumlahJp: 8 })
      .returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({
        kegiatanId,
        nama: 'Penerima Uji',
        nik: '2222222222222222',
        nomor: 'TEST-0002/UJI/2026',
        status: 'siap',
        fileUrl: 'https://example.com/fake.pdf',
      })
      .returning();
    certId = s.id;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('redirects to the file URL and logs the download', async () => {
    const request = new Request(`http://localhost/sertifikat/${certId}/download`, {
      headers: { 'x-forwarded-for': '203.0.113.9' },
    });
    const response = await GET(request, { params: Promise.resolve({ id: String(certId) }) });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/fake.pdf');

    const logs = await db.select().from(unduhanLog).where(eq(unduhanLog.sertifikatId, certId));
    expect(logs).toHaveLength(1);
    expect(logs[0].ip).toBe('203.0.113.9');
  });

  it('returns 404 for a certificate that is not siap', async () => {
    const [k2] = await db
      .insert(kegiatan)
      .values({ nama: 'Uji Belum', tanggalTerbit: '2026-01-01', jumlahJp: 8 })
      .returning();
    const [notReady] = await db
      .insert(sertifikat)
      .values({ kegiatanId: k2.id, nama: 'X', nik: '3333333333333333', nomor: 'TEST-0003/UJI/2026', status: 'belum' })
      .returning();

    const request = new Request(`http://localhost/sertifikat/${notReady.id}/download`);
    const response = await GET(request, { params: Promise.resolve({ id: String(notReady.id) }) });
    expect(response.status).toBe(404);

    await db.delete(kegiatan).where(eq(kegiatan.id, k2.id));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/integration/download.test.ts`
Expected: FAIL with "Cannot find module '@/app/sertifikat/[id]/download/route'".

- [ ] **Step 3: Write `src/app/sertifikat/[id]/download/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sertifikat, unduhanLog } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCertificateById } from '@/lib/search';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certificateId = Number(id);
  const certificate = await getCertificateById(certificateId);

  if (!certificate || certificate.status !== 'siap' || !certificate.fileUrl) {
    return NextResponse.json({ error: 'Sertifikat tidak ditemukan atau belum siap' }, { status: 404 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const userAgent = request.headers.get('user-agent');

  await db.insert(unduhanLog).values({ sertifikatId: certificateId, ip, userAgent });
  await db
    .update(sertifikat)
    .set({ unduhCount: sql`${sertifikat.unduhCount} + 1` })
    .where(eq(sertifikat.id, certificateId));

  return NextResponse.redirect(certificate.fileUrl, 307);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/integration/download.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add certificate download route with logging"
```

---

## Phase 5 — Admin Authentication

### Task 16: Auth.js config and middleware

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`
- Test: `tests/integration/auth.test.ts`

**Interfaces:**
- Consumes: `db`, `adminUsers` from `src/db` (Task 3).
- Produces: `auth()`, `signIn()`, `signOut()`, `handlers` from `src/lib/auth.ts` — consumed by the login page (Task 17) and every admin route/page from Task 22 onward.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';
import { signIn } from '@/lib/auth';

describe('admin credentials auth', () => {
  const email = 'test-auth@bpip.go.id';

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('secret-pass-1', 10);
    await db.insert(adminUsers).values({ name: 'Test Admin', email, passwordHash });
  });

  afterAll(async () => {
    await db.delete(adminUsers).where(eq(adminUsers.email, email));
  });

  it('rejects an unknown email without throwing', async () => {
    await expect(
      signIn('credentials', { email: 'nobody@bpip.go.id', password: 'whatever', redirect: false })
    ).rejects.toThrow();
  });
});
```

Note: Auth.js's `signIn()` throws a `CredentialsSignin` error on invalid credentials when `redirect: false` is used outside a request context — this test only confirms the authorize path is wired up and rejects unknown users; the login page (Task 17) exercises the success path through the real HTTP flow.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/integration/auth.test.ts`
Expected: FAIL with "Cannot find module '@/lib/auth'".

- [ ] **Step 3: Write `src/lib/auth.ts`**

```ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { adminUsers } from '@/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: String(user.id), name: user.name, email: user.email };
      },
    }),
  ],
});
```

- [ ] **Step 4: Write `src/app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

- [ ] **Step 5: Write `src/middleware.ts`**

```ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export default auth((req) => {
  const isLoginPage = req.nextUrl.pathname === '/admin/login';
  if (req.nextUrl.pathname.startsWith('/admin') && !isLoginPage && !req.auth) {
    return NextResponse.redirect(new URL('/admin/login', req.nextUrl));
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
```

- [ ] **Step 6: Set `AUTH_SECRET` for local dev**

Run: `echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local` (or generate any random 32+ byte string by hand if `openssl` is unavailable).

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test -- tests/integration/auth.test.ts`
Expected: PASS.

- [ ] **Step 8: Verify the build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Auth.js credentials config and admin route middleware"
```

---

### Task 17: Admin login page

**Files:**
- Create: `src/app/admin/login/page.tsx`, `src/app/admin/login/actions.ts`

**Interfaces:**
- Consumes: `signIn` from `src/lib/auth.ts` (Task 16); `Input`, `Button` from `src/components/ui/*`.

- [ ] **Step 1: Write `src/app/admin/login/actions.ts`**

```ts
'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

export async function loginAction(email: string, password: string): Promise<{ error?: string }> {
  try {
    await signIn('credentials', { email, password, redirectTo: '/admin' });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Email atau kata sandi salah.' };
    }
    throw error;
  }
}
```

- [ ] **Step 2: Write `src/app/admin/login/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { loginAction } from './actions';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    const result = await loginAction(email, password);
    setPending(false);
    if (result.error) setError(result.error);
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 420, width: '100%', padding: 28, borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Masuk Admin</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Email Institusi" icon="mail" value={email} onChange={setEmail} />
          <Input label="Kata Sandi" icon="key-round" type="password" value={password} onChange={setPassword} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          <Button variant="primary" size="lg" block onClick={submit}>
            {pending ? 'Memproses...' : 'Masuk'}
          </Button>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</div>}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify manually**

Run: `npm run dev`, go to `/admin` (should redirect to `/admin/login` per Task 16's middleware). Log in with the seeded admin credentials from Task 4.
Expected: redirects to `/admin` (a 404 is fine until Task 25 builds that page — confirm the redirect itself happens and a session cookie is set).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add admin login page"
```

---

## Phase 6 — Admin Import

### Task 18: CSV import route

**Files:**
- Create: `src/app/api/admin/import/csv/route.ts`
- Test: `tests/integration/import-csv.test.ts`

**Interfaces:**
- Consumes: `parseParticipantCsv` from `src/lib/csv.ts` (Task 6); `db`, `kegiatan`, `sertifikat` from `src/db` (Task 3); `auth` from `src/lib/auth.ts` (Task 16).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { POST } from '@/app/api/admin/import/csv/route';

const CSV = `nik,nama,kegiatan,tanggal_terbit,nomor,jam
4444444444444444,Peserta CSV Satu,Uji Import CSV,2026-02-01,TEST-CSV-0001/UJI/2026,16`;

describe('CSV import route', () => {
  afterEach(async () => {
    await db.delete(sertifikat).where(eq(sertifikat.nomor, 'TEST-CSV-0001/UJI/2026'));
    await db.delete(kegiatan).where(eq(kegiatan.nama, 'Uji Import CSV'));
  });

  it('creates a kegiatan and a sertifikat row from a valid CSV', async () => {
    const request = new Request('http://localhost/api/admin/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csv: CSV }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.imported).toBe(1);
    expect(body.errors).toHaveLength(0);

    const rows = await db.select().from(sertifikat).where(eq(sertifikat.nomor, 'TEST-CSV-0001/UJI/2026'));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('belum');
  });

  it('does not clobber an already-siap row on re-import', async () => {
    const request1 = new Request('http://localhost/api/admin/import/csv', { method: 'POST', body: JSON.stringify({ csv: CSV }) });
    await POST(request1);

    await db
      .update(sertifikat)
      .set({ status: 'siap', fileUrl: 'https://example.com/already-uploaded.pdf' })
      .where(eq(sertifikat.nomor, 'TEST-CSV-0001/UJI/2026'));

    const request2 = new Request('http://localhost/api/admin/import/csv', { method: 'POST', body: JSON.stringify({ csv: CSV }) });
    await POST(request2);

    const [row] = await db.select().from(sertifikat).where(eq(sertifikat.nomor, 'TEST-CSV-0001/UJI/2026'));
    expect(row.status).toBe('siap');
    expect(row.fileUrl).toBe('https://example.com/already-uploaded.pdf');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/integration/import-csv.test.ts`
Expected: FAIL with "Cannot find module '@/app/api/admin/import/csv/route'".

- [ ] **Step 3: Write `src/app/api/admin/import/csv/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { parseParticipantCsv, type ParticipantRow } from '@/lib/csv';

async function findOrCreateKegiatan(row: ParticipantRow): Promise<number> {
  const [existing] = await db
    .select()
    .from(kegiatan)
    .where(and(eq(kegiatan.nama, row.kegiatan), eq(kegiatan.tanggalTerbit, row.tanggalTerbit), eq(kegiatan.jumlahJp, row.jam)));

  if (existing) return existing.id;

  const [created] = await db
    .insert(kegiatan)
    .values({ nama: row.kegiatan, tanggalTerbit: row.tanggalTerbit, jumlahJp: row.jam })
    .returning();
  return created.id;
}

export async function POST(request: Request) {
  const { csv } = (await request.json()) as { csv: string };
  const { rows, errors } = parseParticipantCsv(csv);

  let imported = 0;
  for (const row of rows) {
    const kegiatanId = row.kegiatan ? await findOrCreateKegiatan(row) : null;
    if (kegiatanId === null) continue;

    const [existing] = await db.select().from(sertifikat).where(eq(sertifikat.nomor, row.nomor));

    if (existing) {
      await db
        .update(sertifikat)
        .set({ nama: row.nama, nik: row.nik, kegiatanId, updatedAt: new Date() })
        .where(eq(sertifikat.id, existing.id));
    } else {
      await db.insert(sertifikat).values({
        kegiatanId,
        nama: row.nama,
        nik: row.nik,
        nomor: row.nomor,
        status: 'belum',
      });
    }
    imported += 1;
  }

  return NextResponse.json({ imported, errors });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/integration/import-csv.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add CSV import route with idempotent upsert"
```

---

### Task 19: Vercel Blob client-upload route

**Files:**
- Create: `src/app/api/blob/upload/route.ts`

**Interfaces:**
- Produces: a `handleUpload`-backed endpoint consumed directly by the client-side `upload()` calls in Task 22 (ZIP) and Task 23 (single-file replace).

- [ ] **Step 1: Write `src/app/api/blob/upload/route.ts`**

```ts
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['application/zip', 'application/pdf'],
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // No server-side action needed here — the caller (Task 22's ZIP
        // form, Task 23's replace-file action) explicitly processes the
        // resulting blob URL after `upload()` resolves.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
```

- [ ] **Step 2: Set `BLOB_READ_WRITE_TOKEN` for local dev**

Manual step: create a Vercel Blob store (via the Vercel dashboard or `vercel blob store add`), copy its read-write token into `.env.local` as `BLOB_READ_WRITE_TOKEN=...`.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Vercel Blob client-upload route"
```

---

### Task 20: ZIP processing route

**Files:**
- Create: `src/app/api/admin/import/zip/route.ts`
- Test: `tests/integration/import-zip.test.ts`
- Test fixture: `tests/fixtures/sertifikat-test.zip`

**Interfaces:**
- Consumes: `extractNomorPrefix`, `parseManifestCsv`, `matchFilenameToCandidate`, `MatchCandidate` from `src/lib/zip-match.ts` (Task 7); `db`, `sertifikat` from `src/db` (Task 3).
- Produces: `POST /api/admin/import/zip` accepting `{ blobUrl: string }`, returning `{ matched: number; unmatched: { filename: string; blobUrl: string; fileSize: number }[] }` — an unmatched PDF is still uploaded to Blob (under an `unmatched/` prefix) so Task 21's manual-match endpoint has a URL to attach; only the matched count updates a `sertifikat` row directly. Consumed by the Unggah tab (Task 22).

- [ ] **Step 1: Build the test fixture**

Run this once to create a small ZIP with one matchable PDF and one unmatchable PDF (no shell zip tool assumed — use Node directly):

```bash
node -e "
const fs = require('fs');
const archiver = require('archiver');
" 2>/dev/null || npm install -D archiver
```

Then write a one-off script `scripts/make-fixture-zip.mjs`:

```js
import archiver from 'archiver';
import { createWriteStream } from 'node:fs';

const output = createWriteStream('tests/fixtures/sertifikat-test.zip');
const archive = archiver('zip');
archive.pipe(output);
archive.append('%PDF-1.4 fake pdf content for matched file', { name: '5555555555555555_SK-TEST-1.pdf' });
archive.append('%PDF-1.4 fake pdf content for unmatched file', { name: 'unrelated-file.pdf' });
await archive.finalize();
```

Run: `node scripts/make-fixture-zip.mjs`
Expected: `tests/fixtures/sertifikat-test.zip` is created.

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { put } from '@vercel/blob';
import { POST } from '@/app/api/admin/import/zip/route';

describe('ZIP import route', () => {
  let kegiatanId: number;
  let certId: number;
  let archiveBlobUrl: string;

  beforeAll(async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji ZIP', tanggalTerbit: '2026-02-01', jumlahJp: 8 }).returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({ kegiatanId, nama: 'Peserta ZIP', nik: '5555555555555555', nomor: 'SK-TEST-1/UJI/2026', status: 'belum' })
      .returning();
    certId = s.id;

    const zipBuffer = readFileSync('tests/fixtures/sertifikat-test.zip');
    const blob = await put('test-uploads/sertifikat-test.zip', zipBuffer, { access: 'public', addRandomSuffix: true });
    archiveBlobUrl = blob.url;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('matches the PDF by nik+nomor-prefix filename and marks it siap', async () => {
    const request = new Request('http://localhost/api/admin/import/zip', {
      method: 'POST',
      body: JSON.stringify({ blobUrl: archiveBlobUrl }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(body.matched).toBe(1);
    expect(body.unmatched).toHaveLength(1);
    expect(body.unmatched[0].filename).toBe('unrelated-file.pdf');
    expect(body.unmatched[0].blobUrl).toMatch(/^https:\/\//);
    expect(body.unmatched[0].fileSize).toBeGreaterThan(0);

    const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, certId));
    expect(row.status).toBe('siap');
    expect(row.fileUrl).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- tests/integration/import-zip.test.ts`
Expected: FAIL with "Cannot find module '@/app/api/admin/import/zip/route'".

- [ ] **Step 4: Write `src/app/api/admin/import/zip/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import unzipper from 'unzipper';
import { put } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat } from '@/db/schema';
import { parseManifestCsv, matchFilenameToCandidate, type MatchCandidate } from '@/lib/zip-match';

export const maxDuration = 300;

export async function POST(request: Request) {
  const { blobUrl } = (await request.json()) as { blobUrl: string };

  const response = await fetch(blobUrl);
  if (!response.body) {
    return NextResponse.json({ error: 'Arsip tidak dapat diunduh' }, { status: 400 });
  }
  const nodeStream = Readable.fromWeb(response.body as never);

  const candidates: MatchCandidate[] = await db.select({ id: sertifikat.id, nik: sertifikat.nik, nomor: sertifikat.nomor }).from(sertifikat);

  let manifestRows: { nik: string; nomor: string; file: string }[] | null = null;
  const pdfEntries: { filename: string; buffer: Buffer }[] = [];

  await nodeStream
    .pipe(unzipper.Parse())
    .on('entry', function (entry: unzipper.Entry) {
      const filename = entry.path;
      const lower = filename.toLowerCase();
      if (lower === 'manifest.csv' || lower.endsWith('.pdf')) {
        const chunks: Buffer[] = [];
        entry.on('data', (chunk: Buffer) => chunks.push(chunk));
        entry.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (lower === 'manifest.csv') {
            manifestRows = parseManifestCsv(buffer.toString('utf-8'));
          } else {
            pdfEntries.push({ filename, buffer });
          }
        });
      } else {
        entry.autodrain();
      }
    })
    .promise();

  const unmatched: { filename: string; blobUrl: string; fileSize: number }[] = [];
  let matched = 0;

  for (const pdf of pdfEntries) {
    let targetId: number | null = null;

    if (manifestRows) {
      const manifestMatch = manifestRows.find((m) => m.file === pdf.filename);
      if (manifestMatch) {
        const candidate = candidates.find((c) => c.nik === manifestMatch.nik && c.nomor === manifestMatch.nomor);
        targetId = candidate?.id ?? null;
      }
    } else {
      targetId = matchFilenameToCandidate(pdf.filename, candidates);
    }

    if (targetId === null) {
      const blob = await put(`unmatched/${pdf.filename}`, pdf.buffer, {
        access: 'public',
        addRandomSuffix: true,
        contentType: 'application/pdf',
      });
      unmatched.push({ filename: pdf.filename, blobUrl: blob.url, fileSize: pdf.buffer.byteLength });
      continue;
    }

    const blob = await put(`sertifikat/${targetId}-${pdf.filename}`, pdf.buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/pdf',
    });

    await db
      .update(sertifikat)
      .set({ fileUrl: blob.url, fileSize: pdf.buffer.byteLength, status: 'siap', updatedAt: new Date() })
      .where(eq(sertifikat.id, targetId));

    matched += 1;
  }

  return NextResponse.json({ matched, unmatched });
}
```

Note on the flagged spec risk: this buffers each individual PDF entry in memory (not the whole archive at once, since `unzipper.Parse()` streams entry-by-entry). For very large individual PDFs this may still need `put(..., { multipart: true })` instead of a plain buffer — verify against a realistic large-file fixture before trusting the mock's "500MB per archive" claim, and switch to multipart if a single PDF's buffering becomes a memory concern.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- tests/integration/import-zip.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add ZIP certificate import route with manifest/filename matching"
```

---

### Task 21: Manual match route

**Files:**
- Create: `src/app/api/admin/import/match/route.ts`
- Test: `tests/integration/import-match.test.ts`

**Interfaces:**
- Consumes: `db`, `sertifikat` from `src/db` (Task 3).
- Produces: `POST /api/admin/import/match` accepting `{ nomor: string; blobUrl: string; fileSize: number }` — matches by `sertifikat.nomor` (globally unique, per the Task 3 schema) rather than a numeric id, because the admin knows the certificate number from context and this keeps the Unggah tab (Task 22) independent of the Penerima table (Task 23), which the plan builds later. Consumed by the "Cocokkan" action in the Unggah tab (Task 22).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { POST } from '@/app/api/admin/import/match/route';

describe('manual match route', () => {
  let kegiatanId: number;
  let certId: number;

  beforeAll(async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji Match', tanggalTerbit: '2026-02-01', jumlahJp: 8 }).returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({ kegiatanId, nama: 'Peserta Match', nik: '6666666666666666', nomor: 'SK-TEST-2/UJI/2026', status: 'belum' })
      .returning();
    certId = s.id;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('assigns a blob URL to the sertifikat matching the given nomor and marks it siap', async () => {
    const request = new Request('http://localhost/api/admin/import/match', {
      method: 'POST',
      body: JSON.stringify({ nomor: 'SK-TEST-2/UJI/2026', blobUrl: 'https://example.com/manual.pdf', fileSize: 1024 }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, certId));
    expect(row.status).toBe('siap');
    expect(row.fileUrl).toBe('https://example.com/manual.pdf');
  });

  it('returns 404 when no sertifikat matches the given nomor', async () => {
    const request = new Request('http://localhost/api/admin/import/match', {
      method: 'POST',
      body: JSON.stringify({ nomor: 'NOMOR-TIDAK-ADA', blobUrl: 'https://example.com/manual.pdf', fileSize: 1024 }),
    });
    const response = await POST(request);
    expect(response.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/integration/import-match.test.ts`
Expected: FAIL with "Cannot find module '@/app/api/admin/import/match/route'".

- [ ] **Step 3: Write `src/app/api/admin/import/match/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat } from '@/db/schema';

export async function POST(request: Request) {
  const { nomor, blobUrl, fileSize } = (await request.json()) as {
    nomor: string;
    blobUrl: string;
    fileSize: number;
  };

  const [existing] = await db.select().from(sertifikat).where(eq(sertifikat.nomor, nomor));
  if (!existing) {
    return NextResponse.json({ error: `Tidak ada sertifikat dengan nomor ${nomor}` }, { status: 404 });
  }

  await db
    .update(sertifikat)
    .set({ fileUrl: blobUrl, fileSize, status: 'siap', updatedAt: new Date() })
    .where(eq(sertifikat.id, existing.id));

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/integration/import-match.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add manual certificate match route"
```

---

### Task 22: Unggah (upload) tab UI

**Files:**
- Create: `src/components/admin/UploadTab.tsx`

**Interfaces:**
- Consumes: `Button` from `src/components/ui/Button.tsx`; the Blob client `upload()` from `@vercel/blob/client`; `POST /api/admin/import/csv`, `POST /api/admin/import/zip`, `POST /api/admin/import/match` (Tasks 18, 20, 21).

- [ ] **Step 1: Write `src/components/admin/UploadTab.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/Button';

interface UnmatchedFile {
  filename: string;
  blobUrl: string;
  fileSize: number;
}

export function UploadTab() {
  const [csvNote, setCsvNote] = useState<string | null>(null);
  const [zipStatus, setZipStatus] = useState<string | null>(null);
  const [unmatched, setUnmatched] = useState<UnmatchedFile[]>([]);

  async function handleCsvFile(file: File) {
    const csv = await file.text();
    const response = await fetch('/api/admin/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csv }),
    });
    const body = await response.json();
    setCsvNote(`${body.imported} baris berhasil diimpor, ${body.errors.length} error.`);
  }

  async function handleZipFile(file: File) {
    setZipStatus('Mengunggah arsip...');
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/blob/upload',
    });

    setZipStatus('Memproses arsip...');
    const response = await fetch('/api/admin/import/zip', {
      method: 'POST',
      body: JSON.stringify({ blobUrl: blob.url }),
    });
    const body = await response.json();
    setZipStatus(`${body.matched} berkas cocok otomatis, ${body.unmatched.length} perlu ditinjau.`);
    setUnmatched(body.unmatched);
  }

  async function handleCocokkan(file: UnmatchedFile) {
    const nomor = window.prompt(`Masukkan nomor sertifikat untuk berkas "${file.filename}":`);
    if (!nomor) return;

    const response = await fetch('/api/admin/import/match', {
      method: 'POST',
      body: JSON.stringify({ nomor, blobUrl: file.blobUrl, fileSize: file.fileSize }),
    });

    if (!response.ok) {
      window.alert(`Nomor "${nomor}" tidak ditemukan.`);
      return;
    }

    setUnmatched((prev) => prev.filter((u) => u.filename !== file.filename));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
      <div style={{ padding: '20px 24px', borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)' }}>
        <div style={{ fontWeight: 'var(--weight-semibold)' }}>Langkah 1 — Unggah CSV Penerima</div>
        <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])} />
        {csvNote && <div style={{ marginTop: 8, color: 'var(--ut-green)', fontSize: 'var(--text-xs)' }}>{csvNote}</div>}
      </div>

      <div style={{ padding: '20px 24px', borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)' }}>
        <div style={{ fontWeight: 'var(--weight-semibold)' }}>Langkah 2 — Unggah ZIP Sertifikat</div>
        <input type="file" accept=".zip" onChange={(e) => e.target.files?.[0] && handleZipFile(e.target.files[0])} />
        {zipStatus && <div style={{ marginTop: 8, fontSize: 'var(--text-xs)' }}>{zipStatus}</div>}
        {unmatched.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {unmatched.map((u) => (
              <div key={u.filename} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{u.filename}</span>
                <Button variant="ghost" size="sm" onClick={() => handleCocokkan(u)}>Cocokkan</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

Run: `npm run dev`, log in as admin, and (once Task 25 wires this component into `/admin`) upload the CSV sample from the spec and a ZIP built the same way as Task 20's fixture.
Expected: CSV note and ZIP status update; matched certificates move to `siap`; for an unmatched file, clicking "Cocokkan" and entering the right `nomor` removes it from the unmatched list and marks that certificate `siap`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add admin Unggah tab UI"
```

---

## Phase 7 — Admin Management

### Task 23: Penerima (recipients) table

**Files:**
- Create: `src/app/api/admin/sertifikat/[id]/route.ts`, `src/app/admin/actions.ts`, `src/components/admin/PenerimaTable.tsx`
- Test: `tests/integration/sertifikat-delete.test.ts`

**Interfaces:**
- Consumes: `db`, `sertifikat`, `kegiatan` from `src/db` (Task 3); `del` from `@vercel/blob`; `maskNik` from `src/lib/nik.ts`; `Badge`, `IconButton` from `src/components/ui/*` (Task 8's `IconButton` accepts `type="submit"` for exactly this form-driven case).
- Produces: `getAllSertifikat(filter: { q?: string }): Promise<AdminSertifikatRow[]>` and `deleteSertifikat(id: number): Promise<void>` added to `src/lib/search.ts`, `interface AdminSertifikatRow { id: number; nama: string; nik: string; nomor: string; kegiatanNama: string; tanggalTerbit: string; status: 'siap' | 'belum'; unduhCount: number }`; `DELETE /api/admin/sertifikat/[id]`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { DELETE } from '@/app/api/admin/sertifikat/[id]/route';

describe('DELETE /api/admin/sertifikat/[id]', () => {
  let kegiatanId: number;
  let certId: number;

  beforeAll(async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji Hapus', tanggalTerbit: '2026-02-01', jumlahJp: 8 }).returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({ kegiatanId, nama: 'Peserta Hapus', nik: '7777777777777777', nomor: 'SK-TEST-3/UJI/2026', status: 'belum' })
      .returning();
    certId = s.id;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('deletes the sertifikat row', async () => {
    const request = new Request(`http://localhost/api/admin/sertifikat/${certId}`, { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: String(certId) }) });
    expect(response.status).toBe(200);

    const rows = await db.select().from(sertifikat).where(eq(sertifikat.id, certId));
    expect(rows).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/integration/sertifikat-delete.test.ts`
Expected: FAIL with "Cannot find module '@/app/api/admin/sertifikat/[id]/route'".

- [ ] **Step 3: Add `deleteSertifikat` to `src/lib/search.ts`**

Append:

```ts
import { del } from '@vercel/blob';

export async function deleteSertifikat(id: number): Promise<void> {
  const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, id));
  if (row?.fileUrl) {
    await del(row.fileUrl).catch(() => undefined);
  }
  await db.delete(sertifikat).where(eq(sertifikat.id, id));
}
```

- [ ] **Step 4: Write `src/app/api/admin/sertifikat/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { deleteSertifikat } from '@/lib/search';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteSertifikat(Number(id));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- tests/integration/sertifikat-delete.test.ts`
Expected: PASS.

- [ ] **Step 6: Add `getAllSertifikat` to `src/lib/search.ts`**

Append the function below, and merge `or, desc` into the file's existing top-of-file `import { eq, ilike } from 'drizzle-orm';` line (from Task 11) instead of adding a second `drizzle-orm` import statement:

```ts
export interface AdminSertifikatRow {
  id: number;
  nama: string;
  nik: string;
  nomor: string;
  kegiatanNama: string;
  tanggalTerbit: string;
  status: 'siap' | 'belum';
  unduhCount: number;
}

export async function getAllSertifikat(filter: { q?: string } = {}): Promise<AdminSertifikatRow[]> {
  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(filter.q ? or(ilike(sertifikat.nama, `%${filter.q}%`), ilike(sertifikat.nik, `%${filter.q}%`), ilike(sertifikat.nomor, `%${filter.q}%`)) : undefined)
    .orderBy(desc(sertifikat.createdAt));

  return rows.map((r) => ({
    id: r.sertifikat.id,
    nama: r.sertifikat.nama,
    nik: r.sertifikat.nik,
    nomor: r.sertifikat.nomor,
    kegiatanNama: r.kegiatan.nama,
    tanggalTerbit: r.kegiatan.tanggalTerbit,
    status: r.sertifikat.status,
    unduhCount: r.sertifikat.unduhCount,
  }));
}
```

- [ ] **Step 7: Write `src/app/admin/actions.ts`** (a real Server Action the table's delete form posts to — a route handler can't be a `<form action={...}>` target directly from a Server Component the way a Server Action can, and `deleteSertifikat` already carries the Blob cleanup so this and the route handler from Step 4 both call the same logic)

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { deleteSertifikat } from '@/lib/search';

export async function deleteSertifikatAction(formData: FormData): Promise<void> {
  const id = Number(formData.get('id'));
  await deleteSertifikat(id);
  revalidatePath('/admin');
}
```

- [ ] **Step 8: Write `src/components/admin/PenerimaTable.tsx`**

```tsx
import { getAllSertifikat } from '@/lib/search';
import { maskNik } from '@/lib/nik';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { deleteSertifikatAction } from '@/app/admin/actions';

export async function PenerimaTable({ q }: { q?: string }) {
  const rows = await getAllSertifikat({ q });

  return (
    <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: 11 }}>Nama</th>
          <th style={{ textAlign: 'left', padding: 11 }}>NIK</th>
          <th style={{ textAlign: 'left', padding: 11 }}>Kegiatan</th>
          <th style={{ textAlign: 'left', padding: 11 }}>Status</th>
          <th style={{ padding: 11 }}></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <td style={{ padding: 11 }}>{r.nama}</td>
            <td style={{ padding: 11, fontFamily: 'var(--font-mono)' }}>{maskNik(r.nik)}</td>
            <td style={{ padding: 11 }}>{r.kegiatanNama}</td>
            <td style={{ padding: 11 }}>
              <Badge variant={r.status === 'siap' ? 'success' : 'warning'}>{r.status === 'siap' ? 'Siap' : 'Belum'}</Badge>
            </td>
            <td style={{ padding: 11 }}>
              <form action={deleteSertifikatAction}>
                <input type="hidden" name="id" value={r.id} />
                <IconButton icon="trash-2" label="Hapus berkas" type="submit" />
              </form>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Penerima table with delete action"
```

---

### Task 24: Log tab

**Files:**
- Create: `src/app/api/admin/log/export/route.ts`, `src/components/admin/LogTab.tsx`

**Interfaces:**
- Consumes: `db`, `unduhanLog`, `sertifikat` from `src/db` (Task 3).

- [ ] **Step 1: Write `src/app/api/admin/log/export/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { unduhanLog, sertifikat } from '@/db/schema';

export async function GET() {
  const rows = await db
    .select({ waktu: unduhanLog.waktu, nama: sertifikat.nama, ip: unduhanLog.ip })
    .from(unduhanLog)
    .innerJoin(sertifikat, eq(unduhanLog.sertifikatId, sertifikat.id))
    .orderBy(desc(unduhanLog.waktu));

  const header = 'waktu,nama,ip\n';
  const body = rows.map((r) => `${r.waktu.toISOString()},"${r.nama}",${r.ip}`).join('\n');

  return new NextResponse(header + body, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="log-unduhan.csv"',
    },
  });
}
```

- [ ] **Step 2: Write `src/components/admin/LogTab.tsx`**

```tsx
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { unduhanLog, sertifikat } from '@/db/schema';
import { Button } from '@/components/ui/Button';

export async function LogTab() {
  const rows = await db
    .select({ waktu: unduhanLog.waktu, nama: sertifikat.nama, ip: unduhanLog.ip })
    .from(unduhanLog)
    .innerJoin(sertifikat, eq(unduhanLog.sertifikatId, sertifikat.id))
    .orderBy(desc(unduhanLog.waktu))
    .limit(200);

  return (
    <div style={{ marginTop: 18, borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontWeight: 'var(--weight-semibold)' }}>Log Unduhan</div>
        <a href="/api/admin/log/export">
          <Button variant="glass" size="sm">Ekspor CSV</Button>
        </a>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '13px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 'var(--text-xs)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', width: 180 }}>{r.waktu.toISOString()}</span>
          <span style={{ flex: 1 }}>{r.nama}</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{r.ip}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add admin Log tab with CSV export"
```

---

### Task 25: Admin dashboard shell (`/admin`)

**Files:**
- Create: `src/app/admin/page.tsx`, `src/components/admin/StatsCards.tsx`, `src/components/admin/AdminTabs.tsx`

**Interfaces:**
- Consumes: `Tabs` from `src/components/ui/Tabs.tsx` (Task 10); `UploadTab` (Task 22), `PenerimaTable` (Task 23), `LogTab` (Task 24); `db`, `kegiatan`, `sertifikat` from `src/db` (Task 3).

- [ ] **Step 1: Write `src/components/admin/StatsCards.tsx`**

```tsx
import { count, eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat, unduhanLog } from '@/db/schema';

export async function StatsCards() {
  const [[kegiatanCount], [siapCount], [belumCount], [unduhanCount]] = await Promise.all([
    db.select({ value: count() }).from(kegiatan),
    db.select({ value: count() }).from(sertifikat).where(eq(sertifikat.status, 'siap')),
    db.select({ value: count() }).from(sertifikat).where(eq(sertifikat.status, 'belum')),
    db.select({ value: count() }).from(unduhanLog),
  ]);

  const stats = [
    { label: 'Kegiatan', value: kegiatanCount.value },
    { label: 'Sertifikat Siap', value: siapCount.value },
    { label: 'Belum Diproses', value: belumCount.value },
    { label: 'Total Unduhan', value: unduhanCount.value },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
      {stats.map((s) => (
        <div key={s.label} style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{s.label}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/admin/AdminTabs.tsx`**

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/ui/Tabs';

export function AdminTabs({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setTab(key: string) {
    const params = new URLSearchParams(searchParams);
    params.set('tab', key);
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <Tabs
      items={[
        { key: 'unggah', label: 'Unggah' },
        { key: 'penerima', label: 'Penerima' },
        { key: 'log', label: 'Log' },
      ]}
      value={current}
      onChange={setTab}
    />
  );
}
```

- [ ] **Step 3: Write `src/app/admin/page.tsx`**

```tsx
import { StatsCards } from '@/components/admin/StatsCards';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { UploadTab } from '@/components/admin/UploadTab';
import { PenerimaTable } from '@/components/admin/PenerimaTable';
import { LogTab } from '@/components/admin/LogTab';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { tab = 'unggah', q } = await searchParams;

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Kelola Sertifikat</h2>
        <StatsCards />
        <AdminTabs current={tab} />
        {tab === 'unggah' && <UploadTab />}
        {tab === 'penerima' && <PenerimaTable q={q} />}
        {tab === 'log' && <LogTab />}
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, log in as admin, visit `/admin`.
Expected: stat cards render real counts, tab switching updates the URL and swaps content, CSV/ZIP upload from Task 22 works end-to-end.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire admin dashboard shell with stats and tabs"
```

---

## Phase 8 — End-to-End Tests & Deployment

### Task 26: Playwright config and public-flow e2e test

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/public-flow.spec.ts`

**Interfaces:**
- Consumes: the running dev server (`npm run dev`) and the search/results/preview/download routes (Tasks 12-15).

- [ ] **Step 1: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

- [ ] **Step 2: Write `tests/e2e/public-flow.spec.ts`**

Precondition: a `sertifikat` row with `status='siap'` and a real reachable `fileUrl`, and its `kegiatan`, must exist in the dev database (insert one via `psql`/a Drizzle script pointed at the dev DB before running this, using NIK `8888888888888888`).

```ts
import { test, expect } from '@playwright/test';

test('search by NIK, view results, download a ready certificate', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('NIK atau Nama Lengkap').fill('8888888888888888');
  await page.getByText('Cari').click();

  await expect(page).toHaveURL(/\/hasil\/8888888888888888/);
  await expect(page.getByText('Siap')).toBeVisible();

  await page.getByText('Lihat').click();
  await expect(page).toHaveURL(/\/pratinjau\//);
  await expect(page.getByText('Unduh PDF')).toBeVisible();
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npm run test:e2e`
Expected: PASS (after seeding the precondition row).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: add public search-to-download e2e flow"
```

---

### Task 27: Admin-flow e2e test

**Files:**
- Create: `tests/e2e/admin-flow.spec.ts`

**Interfaces:**
- Consumes: the running dev server, admin login (Task 17), Unggah tab (Task 22), Penerima table (Task 23).

- [ ] **Step 1: Write `tests/e2e/admin-flow.spec.ts`**

Precondition: the seeded admin from Task 4 (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) exists in the dev database, and `tests/fixtures/sertifikat-test.zip` from Task 20 is present alongside a matching CSV fixture `tests/fixtures/sertifikat-test.csv`:

```
nik,nama,kegiatan,tanggal_terbit,nomor,jam
5555555555555555,Peserta ZIP E2E,Uji ZIP E2E,2026-02-01,SK-TEST-1/UJI/2026,8
```

```ts
import { test, expect } from '@playwright/test';
import path from 'node:path';

test('admin logs in, imports CSV then ZIP, and sees a siap row', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email Institusi').fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel('Kata Sandi').fill(process.env.ADMIN_PASSWORD!);
  await page.getByText('Masuk').click();

  await expect(page).toHaveURL('/admin');

  await page.setInputFiles('input[accept=".csv"]', path.join(__dirname, '../fixtures/sertifikat-test.csv'));
  await expect(page.getByText(/baris berhasil diimpor/)).toBeVisible();

  await page.setInputFiles('input[accept=".zip"]', path.join(__dirname, '../fixtures/sertifikat-test.zip'));
  await expect(page.getByText(/berkas cocok otomatis/)).toBeVisible();

  await page.goto('/admin?tab=penerima');
  await expect(page.getByText('Peserta ZIP E2E')).toBeVisible();
  await expect(page.getByText('Siap')).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `ADMIN_EMAIL=admin@bpip.go.id ADMIN_PASSWORD=ChangeMe123! npm run test:e2e -- tests/e2e/admin-flow.spec.ts`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: add admin CSV+ZIP import e2e flow"
```

---

### Task 28: Deployment configuration and docs

**Files:**
- Create: `vercel.json`, `README.md`

**Interfaces:**
- None — this task packages the deployment steps implied by every earlier task's manual setup (Neon project, Blob store, env vars, seed, migrations).

- [ ] **Step 1: Write `vercel.json`**

```json
{
  "functions": {
    "src/app/api/admin/import/zip/route.ts": {
      "maxDuration": 300
    }
  }
}
```

- [ ] **Step 2: Write `README.md`**

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add deployment config and README"
```

---

## Self-Review Notes

- **Spec coverage:** data model (Task 3), CSV import + idempotent upsert (Task 18), ZIP import with `nik,nomor,file` manifest + filename fallback + unmatched review (Tasks 20-22), NIK masking everywhere public (Tasks 5, 13-15, 23), real-PDF preview via iframe (Task 14), download logging (Task 15), Auth.js Credentials + admin_users + seed (Tasks 4, 16-17), Vercel Blob upload (Tasks 19, 22-23), stats + 3 tabs admin dashboard (Task 25), Vitest unit coverage of the highest-risk logic (Tasks 5-7), Playwright smoke tests for both critical flows (Tasks 26-27), manual migrations + deployment docs (Task 28). No spec section is without a task.
- **Streaming risk:** Task 20's code and its inline note make explicit that per-PDF buffering (not whole-archive buffering) is the current approach, and name the exact upgrade (`put(..., { multipart: true })`) if a large-file test fails — this matches the spec's requirement to flag rather than silently promise the 500MB figure.
- **Type consistency checked:** `PersonResult`/`CertificateSummary` (Task 11) extended by `CertificateDetail` (Task 14) and reused unchanged through Task 15; `MatchCandidate` (Task 7) reused unchanged in Task 20; `AdminSertifikatRow` (Task 23) is additive to `src/lib/search.ts` and doesn't collide with earlier exports.
