# Kegiatan Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the kegiatan-agnostic CSV/ZIP upload flow with an explicit 3-step, per-kegiatan wizard (create kegiatan → scoped CSV peserta import → scoped ZIP sertifikat import), backed by a persistent Kegiatan list/detail admin UI, and drop the "nomor" (certificate number) concept entirely.

**Architecture:** New `src/lib/kegiatan.ts` module owns kegiatan CRUD + derived lulus/tidak-lulus counts. Three new kegiatan-scoped API routes (`/api/admin/kegiatan`, `/api/admin/kegiatan/[id]/import/csv`, `/api/admin/kegiatan/[id]/import/zip`, `/api/admin/kegiatan/[id]/import/match`) replace the old global `/api/admin/import/*` routes. The existing folder+`manifest.csv`+email matching logic in `src/lib/zip-match.ts` is reused unchanged — only the candidate query gains a `kegiatanId` filter. New admin pages (`/admin/kegiatan/baru`, `/admin/kegiatan/[id]`) host the wizard; the existing `/admin` page's tabs switch from `{Unggah Berkas, Data Penerima, Log Unduhan}` to `{Kegiatan, Data Peserta, Log Unduhan}`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Drizzle ORM (`drizzle-orm/neon-http`) against Neon Postgres, Vercel Blob client-upload, Vitest (integration tests run against the real dev Neon DB, no mocking), Playwright for e2e.

**Spec:** `docs/superpowers/specs/2026-09-05-kegiatan-wizard-design.md`

## Global Constraints

- All work happens directly on `main` (no worktree isolation — established earlier in this project).
- Integration tests hit the real Neon dev database (`DATABASE_URL` in `.env.local`) — never mock the DB. Every test that inserts rows must clean them up in `afterAll`/`afterEach`.
- `dns.setDefaultResultOrder('ipv4first')` is already wired in `vitest.setup.ts`/`next.config.ts` for this network — don't touch it.
- CSV headers are exactly `nama_peserta;Username;Email;Provinsi;Kabupaten / kota;Asal instansi`, `;`-delimited, matching `docs/peserta.csv`. Header matching is case-insensitive and whitespace-trimmed.
- `manifest.csv` format is **unchanged**: `folder;email`, `;`-delimited, root of the ZIP.
- Segmen values: exactly `Aparatur Negara`, `Orsospol`, `KML`, `Purnapaskibraka`. Mode Penyelenggaraan values: exactly `Luring`, `Daring`, `Hybrid` (optional field).
- The `nomor` concept (column, unique constraint, all UI/API usage) is removed outright — do not reintroduce it anywhere.
- New `kegiatan` columns are nullable at the DB level (no backfill for existing rows); required-ness is enforced only in the create-kegiatan form/route.
- Every task's own new/changed tests must pass before moving on; a repo-wide `tsc`/`vitest`/`build` green pass is only required by the final task (Task 16) — don't block earlier tasks on unrelated pre-existing breakage they haven't reached yet.
- Commit after each task with a descriptive message ending `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

## Task 1: Schema migration — kegiatan & sertifikat columns

**Files:**
- Modify: `src/db/schema.ts`
- Create: `tests/integration/schema-kegiatan-peserta.test.ts`

**Interfaces:**
- Produces: `kegiatanSegmen` pgEnum, `modePenyelenggaraan` pgEnum; `kegiatan` table gains `tahun`, `segmen`, `tanggalMulai`, `tanggalSelesai`, `provinsi`, `kabupatenKota`, `modePenyelenggaraan`, `logoUrl` (all nullable); loses `tanggalTerbit`. `sertifikat` table gains `provinsi`, `kabupatenKota`, `asalInstansi` (all nullable); loses `nomor` and its unique constraint.

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/schema-kegiatan-peserta.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';

describe('kegiatan/sertifikat schema', () => {
  let kegiatanId: number | undefined;

  afterEach(async () => {
    if (kegiatanId) {
      await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
      kegiatanId = undefined;
    }
  });

  it('stores the new kegiatan step-1 fields', async () => {
    const [row] = await db
      .insert(kegiatan)
      .values({
        nama: 'Uji Schema Kegiatan',
        jumlahJp: 16,
        tahun: 2026,
        segmen: 'Aparatur Negara',
        tanggalMulai: '2026-03-01',
        tanggalSelesai: '2026-03-05',
        provinsi: 'Jawa Tengah',
        kabupatenKota: 'KOTA SEMARANG',
        modePenyelenggaraan: 'Luring',
        logoUrl: 'https://example.com/logo.png',
      })
      .returning();
    kegiatanId = row.id;

    expect(row.tahun).toBe(2026);
    expect(row.segmen).toBe('Aparatur Negara');
    expect(row.tanggalMulai).toBe('2026-03-01');
    expect(row.tanggalSelesai).toBe('2026-03-05');
    expect(row.modePenyelenggaraan).toBe('Luring');
    expect(row.logoUrl).toBe('https://example.com/logo.png');
  });

  it('allows a kegiatan with only the pre-existing required fields (no backfill needed)', async () => {
    const [row] = await db.insert(kegiatan).values({ nama: 'Uji Schema Minimal', jumlahJp: 8 }).returning();
    kegiatanId = row.id;
    expect(row.tahun).toBeNull();
    expect(row.logoUrl).toBeNull();
  });

  it('stores the new sertifikat peserta-domicile fields and has no nomor column', async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji Schema Peserta', jumlahJp: 8 }).returning();
    kegiatanId = k.id;

    const [row] = await db
      .insert(sertifikat)
      .values({
        kegiatanId: k.id,
        nama: 'Peserta Schema',
        nik: '1010101010101010',
        email: 'peserta.schema@example.com',
        provinsi: 'Jawa Tengah',
        kabupatenKota: 'KOTA SEMARANG',
        asalInstansi: 'Universitas Diponegoro',
        status: 'belum',
      })
      .returning();

    expect(row.provinsi).toBe('Jawa Tengah');
    expect(row.kabupatenKota).toBe('KOTA SEMARANG');
    expect(row.asalInstansi).toBe('Universitas Diponegoro');
    expect((row as Record<string, unknown>).nomor).toBeUndefined();

    await db.delete(sertifikat).where(eq(sertifikat.id, row.id));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/schema-kegiatan-peserta.test.ts`
Expected: FAIL — Drizzle rejects `tahun`, `segmen`, etc. as unknown columns (they don't exist in the schema yet), and inserting `sertifikat` without `nomor` fails a NOT NULL constraint.

- [ ] **Step 3: Update the schema**

Replace the full content of `src/db/schema.ts` with:

```ts
import { pgTable, serial, text, varchar, integer, timestamp, pgEnum, date, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const sertifikatStatus = pgEnum('sertifikat_status', ['siap', 'belum']);
export const kegiatanSegmen = pgEnum('kegiatan_segmen', ['Aparatur Negara', 'Orsospol', 'KML', 'Purnapaskibraka']);
export const modePenyelenggaraan = pgEnum('mode_penyelenggaraan', ['Luring', 'Daring', 'Hybrid']);

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
  jumlahJp: integer('jumlah_jp').notNull(),
  tahun: integer('tahun'),
  segmen: kegiatanSegmen('segmen'),
  tanggalMulai: date('tanggal_mulai'),
  tanggalSelesai: date('tanggal_selesai'),
  provinsi: text('provinsi'),
  kabupatenKota: text('kabupaten_kota'),
  modePenyelenggaraan: modePenyelenggaraan('mode_penyelenggaraan'),
  logoUrl: text('logo_url'),
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
    email: text('email'),
    provinsi: text('provinsi'),
    kabupatenKota: text('kabupaten_kota'),
    asalInstansi: text('asal_instansi'),
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
    index('sertifikat_email_lower_idx').on(sql`lower(${table.email})`),
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

- [ ] **Step 4: Push the schema to the dev database**

Run: `npx drizzle-kit push --force`

The `--force` flag auto-approves the data-loss statements (`DROP COLUMN nomor`, `DROP COLUMN tanggal_terbit`) non-interactively — this is a pre-launch dev database with test/demo data only, safe to lose. Then generate a migration file for the record:

Run: `npm run db:generate`

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/integration/schema-kegiatan-peserta.test.ts`
Expected: PASS (3/3)

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts drizzle/ tests/integration/schema-kegiatan-peserta.test.ts
git commit -m "$(cat <<'EOF'
feat: add kegiatan step-1 fields and drop the nomor concept

Adds tahun/segmen/tanggal_mulai/tanggal_selesai/provinsi/kabupaten_kota/
mode_penyelenggaraan/logo_url to kegiatan, adds provinsi/kabupaten_kota/
asal_instansi to sertifikat, and drops sertifikat.nomor and
kegiatan.tanggal_terbit entirely per the kegiatan-wizard design.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

**Note for the next task's implementer:** this task alone leaves several existing files referencing the now-removed `nomor`/`tanggalTerbit` fields red under `tsc --noEmit` (e.g. `src/lib/csv.ts`, `src/lib/search.ts`, `src/app/api/admin/import/*`). That's expected and gets cleaned up across Tasks 3, 6–9 — don't try to fix it all here.

---

## Task 2: Wilayah (province/city) data + helper

**Files:**
- Create: `src/data/wilayah-indonesia.json`
- Create: `src/lib/wilayah.ts`
- Test: `tests/unit/wilayah.test.ts`

**Interfaces:**
- Produces: `listProvinsi(): string[]`, `listKabupatenKota(provinsi: string): string[]`

- [ ] **Step 1: Port the data file**

Copy `C:\laragon\www\diklatdash\resources\data\wilayah-indonesia.json` verbatim to `src/data/wilayah-indonesia.json` (shape: `{ "Provinsi Name": ["KAB/KOTA", ...] }`).

```bash
cp "C:\laragon\www\diklatdash\resources\data\wilayah-indonesia.json" "src/data/wilayah-indonesia.json"
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/unit/wilayah.test.ts
import { describe, it, expect } from 'vitest';
import { listProvinsi, listKabupatenKota } from '@/lib/wilayah';

describe('wilayah', () => {
  it('lists all provinsi', () => {
    const provinsi = listProvinsi();
    expect(provinsi).toContain('Jawa Tengah');
    expect(provinsi.length).toBeGreaterThan(30);
  });

  it('lists kabupaten/kota for a given provinsi', () => {
    expect(listKabupatenKota('Jawa Tengah')).toContain('KOTA SEMARANG');
  });

  it('returns an empty array for an unknown provinsi', () => {
    expect(listKabupatenKota('Tidak Ada')).toEqual([]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/wilayah.test.ts`
Expected: FAIL — `Cannot find module '@/lib/wilayah'`

- [ ] **Step 4: Write the implementation**

```ts
// src/lib/wilayah.ts
import wilayahData from '@/data/wilayah-indonesia.json';

const DATA = wilayahData as Record<string, string[]>;

export function listProvinsi(): string[] {
  return Object.keys(DATA);
}

export function listKabupatenKota(provinsi: string): string[] {
  return DATA[provinsi] ?? [];
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/wilayah.test.ts`
Expected: PASS (3/3)

- [ ] **Step 6: Commit**

```bash
git add src/data/wilayah-indonesia.json src/lib/wilayah.ts tests/unit/wilayah.test.ts
git commit -m "$(cat <<'EOF'
feat: port wilayah-indonesia.json for the kegiatan location dropdowns

Ported verbatim from the original Laravel diklatdash project so the
step-1 kegiatan form's Provinsi/Kab-kota dropdowns use the same source
of truth.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Rewrite the CSV parser for the new peserta format

**Files:**
- Modify: `src/lib/csv.ts`
- Modify: `tests/unit/csv.test.ts`

**Interfaces:**
- Produces: `ParticipantRow { nama, nik, email, provinsi, kabupatenKota, asalInstansi }` (all `string`), `parseParticipantCsv(csvText: string): { rows: ParticipantRow[]; errors: CsvRowError[] }`
- Consumed by: Task 6's scoped CSV import route.

- [ ] **Step 1: Replace the test file**

```ts
// tests/unit/csv.test.ts
import { describe, it, expect } from 'vitest';
import { parseParticipantCsv } from '@/lib/csv';

const HEADER = 'nama_peserta;Username;Email;Provinsi;Kabupaten / kota;Asal instansi';

describe('parseParticipantCsv', () => {
  it('parses a valid peserta CSV row', () => {
    const csv = `${HEADER}\nTriyono, SH., M.Kn;3374082512670005;triyono1225@gmail.com;Jawa Tengah;KABUPATEN WONOGIRI;Universitas Diponegoro`;
    const { rows, errors } = parseParticipantCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toEqual([
      {
        nama: 'Triyono, SH., M.Kn',
        nik: '3374082512670005',
        email: 'triyono1225@gmail.com',
        provinsi: 'Jawa Tengah',
        kabupatenKota: 'KABUPATEN WONOGIRI',
        asalInstansi: 'Universitas Diponegoro',
      },
    ]);
  });

  it('allows blank Provinsi/Kabupaten-kota/Asal instansi', () => {
    const csv = `${HEADER}\nBudi;1234567890123456;budi@example.com;;;`;
    const { rows, errors } = parseParticipantCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows[0]).toEqual({
      nama: 'Budi',
      nik: '1234567890123456',
      email: 'budi@example.com',
      provinsi: '',
      kabupatenKota: '',
      asalInstansi: '',
    });
  });

  it('reports a missing nama_peserta column', () => {
    const csv = `${HEADER}\n;1234567890123456;budi@example.com;Jawa Tengah;KOTA SEMARANG;Undip`;
    const { errors } = parseParticipantCsv(csv);
    expect(errors).toEqual([{ line: 2, message: "Kolom 'nama_peserta' kosong" }]);
  });

  it('reports a missing Email column', () => {
    const csv = `${HEADER}\nBudi;1234567890123456;;Jawa Tengah;KOTA SEMARANG;Undip`;
    const { errors } = parseParticipantCsv(csv);
    expect(errors).toEqual([{ line: 2, message: "Kolom 'email' kosong" }]);
  });

  it('reports a missing Username (NIK) column', () => {
    const csv = `${HEADER}\nBudi;;budi@example.com;Jawa Tengah;KOTA SEMARANG;Undip`;
    const { errors } = parseParticipantCsv(csv);
    expect(errors).toEqual([{ line: 2, message: "Kolom 'username' kosong" }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/csv.test.ts`
Expected: FAIL — old parser expects `nik,nama,email,kegiatan,tanggal_terbit,nomor,jam` comma-delimited columns.

- [ ] **Step 3: Write the implementation**

Replace the full content of `src/lib/csv.ts` with:

```ts
import { parse } from 'csv-parse/sync';
import { normalizeNik } from './nik';

export interface ParticipantRow {
  nama: string;
  nik: string;
  email: string;
  provinsi: string;
  kabupatenKota: string;
  asalInstansi: string;
}

export interface CsvRowError {
  line: number;
  message: string;
}

export interface ParseParticipantCsvResult {
  rows: ParticipantRow[];
  errors: CsvRowError[];
}

const REQUIRED_COLUMNS = ['nama_peserta', 'username', 'email'] as const;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function parseParticipantCsv(csvText: string): ParseParticipantCsvResult {
  const records: Record<string, string>[] = parse(csvText, {
    columns: (header: string[]) => header.map(normalizeHeader),
    skip_empty_lines: true,
    trim: true,
    delimiter: ';',
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

    rows.push({
      nama: record.nama_peserta,
      nik: normalizeNik(record.username),
      email: record.email,
      provinsi: record.provinsi ?? '',
      kabupatenKota: record['kabupaten / kota'] ?? '',
      asalInstansi: record['asal instansi'] ?? '',
    });
  });

  return { rows, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/csv.test.ts`
Expected: PASS (5/5)

- [ ] **Step 5: Commit**

```bash
git add src/lib/csv.ts tests/unit/csv.test.ts
git commit -m "$(cat <<'EOF'
feat: rewrite CSV peserta parser for the docs/peserta.csv format

Switches from the old kegiatan-carrying nik,nama,email,kegiatan,
tanggal_terbit,nomor,jam comma-delimited format to the semicolon-
delimited nama_peserta;Username;Email;Provinsi;Kabupaten / kota;Asal
instansi format, since kegiatan is now supplied by the URL scope
instead of a CSV column.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `src/lib/kegiatan.ts` — create/list/get

**Files:**
- Create: `src/lib/kegiatan.ts`
- Create: `tests/integration/kegiatan.test.ts`

**Interfaces:**
- Consumes: `kegiatan`, `sertifikat` tables from `src/db/schema.ts` (Task 1).
- Produces:
  - `CreateKegiatanInput { nama: string; jumlahJp: number; tahun: number; segmen: 'Aparatur Negara'|'Orsospol'|'KML'|'Purnapaskibraka'; tanggalMulai: string; tanggalSelesai: string; provinsi: string; kabupatenKota: string; modePenyelenggaraan?: 'Luring'|'Daring'|'Hybrid'; logoUrl?: string }`
  - `createKegiatan(input: CreateKegiatanInput): Promise<{ id: number }>`
  - `KegiatanListItem { id, nama, tahun, segmen, tanggalMulai, tanggalSelesai, totalPeserta: number, jumlahLulus: number }`
  - `listKegiatan(): Promise<KegiatanListItem[]>`
  - `getKegiatanById(id: number): Promise<(Kegiatan & { totalPeserta: number; jumlahLulus: number; jumlahTidakLulus: number }) | null>`
- Consumed by: Task 5's route, Task 12's `KegiatanList`, Task 13's detail page.

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/kegiatan.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { createKegiatan, listKegiatan, getKegiatanById } from '@/lib/kegiatan';

describe('kegiatan lib', () => {
  let createdId: number | undefined;

  afterEach(async () => {
    if (createdId) {
      await db.delete(kegiatan).where(eq(kegiatan.id, createdId));
      createdId = undefined;
    }
  });

  it('creates a kegiatan with all step-1 fields', async () => {
    const { id } = await createKegiatan({
      nama: 'Uji Lib Kegiatan',
      jumlahJp: 16,
      tahun: 2026,
      segmen: 'Aparatur Negara',
      tanggalMulai: '2026-03-01',
      tanggalSelesai: '2026-03-05',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
      modePenyelenggaraan: 'Luring',
    });
    createdId = id;

    const [row] = await db.select().from(kegiatan).where(eq(kegiatan.id, id));
    expect(row.nama).toBe('Uji Lib Kegiatan');
    expect(row.segmen).toBe('Aparatur Negara');
    expect(row.tanggalMulai).toBe('2026-03-01');
  });

  it('lists kegiatan with derived total/lulus peserta counts', async () => {
    const { id } = await createKegiatan({
      nama: 'Uji Lib Kegiatan List',
      jumlahJp: 8,
      tahun: 2026,
      segmen: 'Orsospol',
      tanggalMulai: '2026-04-01',
      tanggalSelesai: '2026-04-02',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
    });
    createdId = id;

    await db.insert(sertifikat).values([
      { kegiatanId: id, nama: 'Peserta Lulus', nik: '9999999999999901', status: 'siap' },
      { kegiatanId: id, nama: 'Peserta Belum', nik: '9999999999999902', status: 'belum' },
    ]);

    const list = await listKegiatan();
    const found = list.find((k) => k.id === id);
    expect(found?.totalPeserta).toBe(2);
    expect(found?.jumlahLulus).toBe(1);
  });

  it('gets a kegiatan by id with counts, or null if missing', async () => {
    const { id } = await createKegiatan({
      nama: 'Uji Lib Kegiatan Detail',
      jumlahJp: 8,
      tahun: 2026,
      segmen: 'KML',
      tanggalMulai: '2026-05-01',
      tanggalSelesai: '2026-05-02',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
    });
    createdId = id;

    const detail = await getKegiatanById(id);
    expect(detail?.nama).toBe('Uji Lib Kegiatan Detail');
    expect(detail?.totalPeserta).toBe(0);
    expect(detail?.jumlahLulus).toBe(0);

    expect(await getKegiatanById(-1)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/kegiatan.test.ts`
Expected: FAIL — `Cannot find module '@/lib/kegiatan'`

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/kegiatan.ts
import { eq, desc, count, sql } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat, type Kegiatan } from '@/db/schema';

export interface CreateKegiatanInput {
  nama: string;
  jumlahJp: number;
  tahun: number;
  segmen: 'Aparatur Negara' | 'Orsospol' | 'KML' | 'Purnapaskibraka';
  tanggalMulai: string;
  tanggalSelesai: string;
  provinsi: string;
  kabupatenKota: string;
  modePenyelenggaraan?: 'Luring' | 'Daring' | 'Hybrid';
  logoUrl?: string;
}

export async function createKegiatan(input: CreateKegiatanInput): Promise<{ id: number }> {
  const [row] = await db.insert(kegiatan).values(input).returning({ id: kegiatan.id });
  return row;
}

export interface KegiatanListItem {
  id: number;
  nama: string;
  tahun: number | null;
  segmen: string | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  totalPeserta: number;
  jumlahLulus: number;
}

export async function listKegiatan(): Promise<KegiatanListItem[]> {
  const rows = await db
    .select({
      id: kegiatan.id,
      nama: kegiatan.nama,
      tahun: kegiatan.tahun,
      segmen: kegiatan.segmen,
      tanggalMulai: kegiatan.tanggalMulai,
      tanggalSelesai: kegiatan.tanggalSelesai,
      totalPeserta: count(sertifikat.id),
      jumlahLulus: sql<number>`count(*) filter (where ${sertifikat.status} = 'siap')`,
    })
    .from(kegiatan)
    .leftJoin(sertifikat, eq(sertifikat.kegiatanId, kegiatan.id))
    .groupBy(kegiatan.id)
    .orderBy(desc(kegiatan.createdAt));

  return rows.map((r) => ({ ...r, totalPeserta: Number(r.totalPeserta), jumlahLulus: Number(r.jumlahLulus) }));
}

export async function getKegiatanById(
  id: number
): Promise<(Kegiatan & { totalPeserta: number; jumlahLulus: number; jumlahTidakLulus: number }) | null> {
  const [row] = await db.select().from(kegiatan).where(eq(kegiatan.id, id));
  if (!row) return null;

  const [counts] = await db
    .select({
      totalPeserta: count(),
      jumlahLulus: sql<number>`count(*) filter (where ${sertifikat.status} = 'siap')`,
    })
    .from(sertifikat)
    .where(eq(sertifikat.kegiatanId, id));

  const totalPeserta = Number(counts.totalPeserta);
  const jumlahLulus = Number(counts.jumlahLulus);
  return { ...row, totalPeserta, jumlahLulus, jumlahTidakLulus: totalPeserta - jumlahLulus };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/integration/kegiatan.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add src/lib/kegiatan.ts tests/integration/kegiatan.test.ts
git commit -m "$(cat <<'EOF'
feat: add kegiatan create/list/get-by-id lib with derived peserta counts

Lulus/tidak-lulus counts are computed via COUNT ... FILTER over
sertifikat.status rather than stored, per the kegiatan-wizard design.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `POST /api/admin/kegiatan` route

**Files:**
- Create: `src/app/api/admin/kegiatan/route.ts`
- Create: `tests/integration/create-kegiatan-route.test.ts`

**Interfaces:**
- Consumes: `createKegiatan` from `src/lib/kegiatan.ts` (Task 4).
- Produces: `POST /api/admin/kegiatan` — body is the raw form JSON; 200 `{ id: number }` on success, 400 `{ errors: string[] }` on validation failure. Consumed by Task 11's `KegiatanForm`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/create-kegiatan-route.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan } from '@/db/schema';
import { POST } from '@/app/api/admin/kegiatan/route';

const VALID_PAYLOAD = {
  nama: 'Uji Route Kegiatan',
  jumlahJp: 16,
  tahun: 2026,
  segmen: 'Aparatur Negara',
  tanggalMulai: '2026-03-01',
  tanggalSelesai: '2026-03-05',
  provinsi: 'Jawa Tengah',
  kabupatenKota: 'KOTA SEMARANG',
};

describe('POST /api/admin/kegiatan', () => {
  let createdId: number | undefined;

  afterEach(async () => {
    if (createdId) {
      await db.delete(kegiatan).where(eq(kegiatan.id, createdId));
      createdId = undefined;
    }
  });

  it('creates a kegiatan from a valid payload', async () => {
    const request = new Request('http://localhost/api/admin/kegiatan', { method: 'POST', body: JSON.stringify(VALID_PAYLOAD) });
    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(200);
    createdId = body.id;

    const [row] = await db.select().from(kegiatan).where(eq(kegiatan.id, body.id));
    expect(row.nama).toBe('Uji Route Kegiatan');
  });

  it('rejects a payload missing required fields', async () => {
    const request = new Request('http://localhost/api/admin/kegiatan', { method: 'POST', body: JSON.stringify({ nama: '' }) });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.errors.length).toBeGreaterThan(0);
  });

  it('rejects tanggal berakhir before tanggal mulai', async () => {
    const request = new Request('http://localhost/api/admin/kegiatan', {
      method: 'POST',
      body: JSON.stringify({ ...VALID_PAYLOAD, tanggalMulai: '2026-03-05', tanggalSelesai: '2026-03-01' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects an invalid segmen value', async () => {
    const request = new Request('http://localhost/api/admin/kegiatan', {
      method: 'POST',
      body: JSON.stringify({ ...VALID_PAYLOAD, segmen: 'Tidak Ada' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/create-kegiatan-route.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/admin/kegiatan/route'`

- [ ] **Step 3: Write the implementation**

```ts
// src/app/api/admin/kegiatan/route.ts
import { NextResponse } from 'next/server';
import { createKegiatan, type CreateKegiatanInput } from '@/lib/kegiatan';

const SEGMEN_VALUES = ['Aparatur Negara', 'Orsospol', 'KML', 'Purnapaskibraka'] as const;
const MODE_VALUES = ['Luring', 'Daring', 'Hybrid'] as const;

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const errors: string[] = [];

  const nama = typeof body.nama === 'string' ? body.nama.trim() : '';
  if (!nama) errors.push('Nama kegiatan wajib diisi');

  const jumlahJp = Number(body.jumlahJp);
  if (!Number.isFinite(jumlahJp) || jumlahJp <= 0) errors.push('Jam pelajaran harus berupa angka positif');

  const tahun = Number(body.tahun);
  if (!Number.isInteger(tahun)) errors.push('Tahun wajib dipilih');

  const segmen = body.segmen as string;
  if (!SEGMEN_VALUES.includes(segmen as (typeof SEGMEN_VALUES)[number])) errors.push('Segmen kegiatan wajib dipilih');

  const tanggalMulai = typeof body.tanggalMulai === 'string' ? body.tanggalMulai : '';
  const tanggalSelesai = typeof body.tanggalSelesai === 'string' ? body.tanggalSelesai : '';
  if (!tanggalMulai) errors.push('Tanggal mulai wajib diisi');
  if (!tanggalSelesai) errors.push('Tanggal berakhir wajib diisi');
  if (tanggalMulai && tanggalSelesai && tanggalSelesai < tanggalMulai) errors.push('Tanggal berakhir harus setelah tanggal mulai');

  const provinsi = typeof body.provinsi === 'string' ? body.provinsi.trim() : '';
  if (!provinsi) errors.push('Provinsi kegiatan wajib diisi');

  const kabupatenKota = typeof body.kabupatenKota === 'string' ? body.kabupatenKota.trim() : '';
  if (!kabupatenKota) errors.push('Kab/kota kegiatan wajib diisi');

  const modePenyelenggaraanRaw = body.modePenyelenggaraan;
  const modePenyelenggaraan = MODE_VALUES.includes(modePenyelenggaraanRaw as (typeof MODE_VALUES)[number])
    ? (modePenyelenggaraanRaw as (typeof MODE_VALUES)[number])
    : undefined;

  const logoUrl = typeof body.logoUrl === 'string' ? body.logoUrl : undefined;

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const input: CreateKegiatanInput = {
    nama,
    jumlahJp,
    tahun,
    segmen: segmen as CreateKegiatanInput['segmen'],
    tanggalMulai,
    tanggalSelesai,
    provinsi,
    kabupatenKota,
    modePenyelenggaraan,
    logoUrl,
  };

  const { id } = await createKegiatan(input);
  return NextResponse.json({ id });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/integration/create-kegiatan-route.test.ts`
Expected: PASS (4/4)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/kegiatan/route.ts tests/integration/create-kegiatan-route.test.ts
git commit -m "$(cat <<'EOF'
feat: add POST /api/admin/kegiatan route for step-1 kegiatan creation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Kegiatan-scoped CSV import route

**Files:**
- Create: `src/app/api/admin/kegiatan/[id]/import/csv/route.ts`
- Create: `tests/integration/kegiatan-import-csv.test.ts`

**Interfaces:**
- Consumes: `parseParticipantCsv` from `src/lib/csv.ts` (Task 3).
- Produces: `POST /api/admin/kegiatan/[id]/import/csv` with body `{ csv: string }` → `{ imported: number; errors: CsvRowError[] }`. Upserts by `(kegiatanId, nik)`. Consumed by Task 13's `KegiatanCsvUploadCard`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/kegiatan-import-csv.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { POST } from '@/app/api/admin/kegiatan/[id]/import/csv/route';

const CSV = `nama_peserta;Username;Email;Provinsi;Kabupaten / kota;Asal instansi
Peserta CSV Satu;4444444444444444;peserta.csv.satu@example.com;Jawa Tengah;KOTA SEMARANG;Universitas Diponegoro`;

describe('POST /api/admin/kegiatan/[id]/import/csv', () => {
  let kegiatanId: number;

  beforeAll(async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji Import CSV Scoped', jumlahJp: 16 }).returning();
    kegiatanId = k.id;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('creates a sertifikat row scoped to this kegiatan', async () => {
    const request = new Request(`http://localhost/api/admin/kegiatan/${kegiatanId}/import/csv`, {
      method: 'POST',
      body: JSON.stringify({ csv: CSV }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: String(kegiatanId) }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.imported).toBe(1);
    expect(body.errors).toHaveLength(0);

    const rows = await db
      .select()
      .from(sertifikat)
      .where(and(eq(sertifikat.kegiatanId, kegiatanId), eq(sertifikat.nik, '4444444444444444')));
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe('peserta.csv.satu@example.com');
    expect(rows[0].asalInstansi).toBe('Universitas Diponegoro');
  });

  it('does not clobber an already-siap row on re-import', async () => {
    await db
      .update(sertifikat)
      .set({ status: 'siap', fileUrl: 'https://example.com/already-uploaded.pdf' })
      .where(and(eq(sertifikat.kegiatanId, kegiatanId), eq(sertifikat.nik, '4444444444444444')));

    const request = new Request(`http://localhost/api/admin/kegiatan/${kegiatanId}/import/csv`, {
      method: 'POST',
      body: JSON.stringify({ csv: CSV }),
    });
    await POST(request, { params: Promise.resolve({ id: String(kegiatanId) }) });

    const [row] = await db
      .select()
      .from(sertifikat)
      .where(and(eq(sertifikat.kegiatanId, kegiatanId), eq(sertifikat.nik, '4444444444444444')));
    expect(row.status).toBe('siap');
    expect(row.fileUrl).toBe('https://example.com/already-uploaded.pdf');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/kegiatan-import-csv.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/admin/kegiatan/[id]/import/csv/route'`

- [ ] **Step 3: Write the implementation**

```ts
// src/app/api/admin/kegiatan/[id]/import/csv/route.ts
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat } from '@/db/schema';
import { parseParticipantCsv } from '@/lib/csv';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kegiatanId = Number(id);
  const { csv } = (await request.json()) as { csv: string };
  const { rows, errors } = parseParticipantCsv(csv);

  let imported = 0;
  for (const row of rows) {
    const [existing] = await db
      .select()
      .from(sertifikat)
      .where(and(eq(sertifikat.kegiatanId, kegiatanId), eq(sertifikat.nik, row.nik)));

    if (existing) {
      await db
        .update(sertifikat)
        .set({
          nama: row.nama,
          email: row.email,
          provinsi: row.provinsi,
          kabupatenKota: row.kabupatenKota,
          asalInstansi: row.asalInstansi,
          updatedAt: new Date(),
        })
        .where(eq(sertifikat.id, existing.id));
    } else {
      await db.insert(sertifikat).values({
        kegiatanId,
        nama: row.nama,
        nik: row.nik,
        email: row.email,
        provinsi: row.provinsi,
        kabupatenKota: row.kabupatenKota,
        asalInstansi: row.asalInstansi,
        status: 'belum',
      });
    }
    imported += 1;
  }

  return NextResponse.json({ imported, errors });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/integration/kegiatan-import-csv.test.ts`
Expected: PASS (2/2)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/kegiatan/[id]/import/csv/route.ts tests/integration/kegiatan-import-csv.test.ts
git commit -m "$(cat <<'EOF'
feat: add kegiatan-scoped CSV peserta import route

Upserts by (kegiatanId, nik) instead of the removed nomor column;
kegiatan/tanggal/jam are no longer CSV columns since they come from
the URL scope.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Kegiatan-scoped ZIP import route

**Files:**
- Create: `src/app/api/admin/kegiatan/[id]/import/zip/route.ts`
- Create: `tests/integration/kegiatan-import-zip.test.ts`

**Interfaces:**
- Consumes: `parseManifestCsv`, `matchEmailToCandidate`, `pickFirstFileAlphabetically`, `type MatchCandidate` from `src/lib/zip-match.ts` (unchanged, already exists).
- Produces: `POST /api/admin/kegiatan/[id]/import/zip` with body `{ blobUrl: string }` → `{ matched: number; unmatched: { folder, email, blobUrl, fileSize }[]; errors: string[] }`. Consumed by Task 13's `KegiatanZipUploadCard`.
- Reuses fixture: `tests/fixtures/sertifikat-test.zip` (folders `peserta-cocok`/`e2e.unique@example.com` and `peserta-tidak-cocok`/`tidak-ada@example.com` — already built by `scripts/make-fixture-zip.mjs`, no changes needed).

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/kegiatan-import-zip.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { put } from '@vercel/blob';
import { POST } from '@/app/api/admin/kegiatan/[id]/import/zip/route';

describe('POST /api/admin/kegiatan/[id]/import/zip', () => {
  let kegiatanId: number;
  let otherKegiatanId: number;
  let certId: number;
  let archiveBlobUrl: string;

  beforeAll(async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji ZIP Scoped', jumlahJp: 8 }).returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({ kegiatanId, nama: 'Peserta ZIP Scoped', nik: '5555555555555555', email: 'e2e.unique@example.com', status: 'belum' })
      .returning();
    certId = s.id;

    // Same email under a DIFFERENT kegiatan -- must NOT be matched when
    // importing into `kegiatanId`, proving matching is kegiatan-scoped.
    const [k2] = await db.insert(kegiatan).values({ nama: 'Uji ZIP Scoped Lain', jumlahJp: 8 }).returning();
    otherKegiatanId = k2.id;
    await db
      .insert(sertifikat)
      .values({ kegiatanId: otherKegiatanId, nama: 'Peserta Lain', nik: '5555555555555556', email: 'e2e.unique@example.com', status: 'belum' });

    const zipBuffer = readFileSync('tests/fixtures/sertifikat-test.zip');
    const blob = await put('test-uploads/sertifikat-test-scoped.zip', zipBuffer, { access: 'public', addRandomSuffix: true });
    archiveBlobUrl = blob.url;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
    await db.delete(kegiatan).where(eq(kegiatan.id, otherKegiatanId));
  });

  it('matches by email only within this kegiatan and marks it siap', async () => {
    const request = new Request(`http://localhost/api/admin/kegiatan/${kegiatanId}/import/zip`, {
      method: 'POST',
      body: JSON.stringify({ blobUrl: archiveBlobUrl }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: String(kegiatanId) }) });
    const body = await response.json();

    expect(body.matched).toBe(1);
    expect(body.unmatched).toHaveLength(1);
    expect(body.unmatched[0].folder).toBe('peserta-tidak-cocok');

    const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, certId));
    expect(row.status).toBe('siap');

    const [otherRow] = await db.select().from(sertifikat).where(eq(sertifikat.kegiatanId, otherKegiatanId));
    expect(otherRow.status).toBe('belum');
  }, 30000);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/kegiatan-import-zip.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/admin/kegiatan/[id]/import/zip/route'`

- [ ] **Step 3: Write the implementation**

```ts
// src/app/api/admin/kegiatan/[id]/import/zip/route.ts
import { NextResponse } from 'next/server';
import { Readable, PassThrough } from 'node:stream';
import path from 'node:path';
import unzipper from 'unzipper';
import { put } from '@vercel/blob';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat } from '@/db/schema';
import { parseManifestCsv, matchEmailToCandidate, pickFirstFileAlphabetically, type MatchCandidate } from '@/lib/zip-match';

export const maxDuration = 300;

function blobRangeSource(url: string) {
  return {
    stream(offset: number, length?: number) {
      const end = length ? offset + length - 1 : '';
      const pass = new PassThrough();
      fetch(url, { headers: { Range: `bytes=${offset}-${end}` } })
        .then((response) => {
          if (!response.body) throw new Error('Respons range archive kosong');
          Readable.fromWeb(response.body as never).pipe(pass);
        })
        .catch((error) => pass.destroy(error));
      return pass;
    },
    async size() {
      const response = await fetch(url, { method: 'HEAD' });
      return Number(response.headers.get('content-length'));
    },
  };
}

function directChildFilesOfFolder(files: { path: string; type: string }[], folder: string): string[] {
  const prefix = `${folder}/`;
  return files
    .filter((f) => f.type === 'File' && f.path.startsWith(prefix) && !f.path.slice(prefix.length).includes('/'))
    .map((f) => f.path);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kegiatanId = Number(id);
  const { blobUrl } = (await request.json()) as { blobUrl: string };

  const directory = await unzipper.Open.custom(blobRangeSource(blobUrl)).catch(() => null);
  if (!directory) {
    return NextResponse.json({ error: 'Arsip tidak dapat dibaca' }, { status: 400 });
  }

  const manifestEntry = directory.files.find((f) => path.basename(f.path).toLowerCase() === 'manifest.csv');
  if (!manifestEntry) {
    return NextResponse.json({ error: 'manifest.csv tidak ditemukan di akar arsip' }, { status: 400 });
  }
  const manifest = parseManifestCsv((await manifestEntry.buffer()).toString('utf-8'));

  const candidates: MatchCandidate[] = await db
    .select({ id: sertifikat.id, email: sertifikat.email })
    .from(sertifikat)
    .where(eq(sertifikat.kegiatanId, kegiatanId));

  const unmatched: { folder: string; email: string; blobUrl: string; fileSize: number }[] = [];
  const errors: string[] = [];
  let matched = 0;

  for (const row of manifest) {
    const candidateFiles = directChildFilesOfFolder(directory.files, row.folder);
    const filePath = pickFirstFileAlphabetically(candidateFiles);

    if (!filePath) {
      errors.push(`Folder "${row.folder}" tidak ditemukan atau kosong di dalam arsip.`);
      continue;
    }

    const entry = directory.files.find((f) => f.path === filePath)!;
    const filename = path.basename(filePath);
    const targetId = matchEmailToCandidate(row.email, candidates);

    const key = targetId === null ? `unmatched/${kegiatanId}-${row.folder}-${filename}` : `sertifikat/${targetId}-${filename}`;
    const blob = await put(key, entry.stream(), {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/pdf',
    });
    const fileSize = entry.uncompressedSize;

    if (targetId === null) {
      unmatched.push({ folder: row.folder, email: row.email, blobUrl: blob.url, fileSize });
      continue;
    }

    await db
      .update(sertifikat)
      .set({ fileUrl: blob.url, fileSize, status: 'siap', updatedAt: new Date() })
      .where(and(eq(sertifikat.id, targetId), eq(sertifikat.kegiatanId, kegiatanId)));

    matched += 1;
  }

  return NextResponse.json({ matched, unmatched, errors });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/integration/kegiatan-import-zip.test.ts`
Expected: PASS (1/1)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/kegiatan/[id]/import/zip/route.ts tests/integration/kegiatan-import-zip.test.ts
git commit -m "$(cat <<'EOF'
feat: add kegiatan-scoped ZIP sertifikat import route

Same folder+manifest.csv+email matching as before, but the candidate
pool is now filtered to this kegiatan's own peserta, so the same email
in two different kegiatan can never cross-match.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Kegiatan-scoped manual match route

**Files:**
- Create: `src/app/api/admin/kegiatan/[id]/import/match/route.ts`
- Create: `tests/integration/kegiatan-import-match.test.ts`

**Interfaces:**
- Produces: `POST /api/admin/kegiatan/[id]/import/match` with body `{ pesertaId: number; blobUrl: string; fileSize: number }` → 200 `{ ok: true }` or 404 if `pesertaId` doesn't belong to this kegiatan. Replaces the old nomor-based manual match. Consumed by Task 13's peserta-picker UI.

- [ ] **Step 1: Write the failing test**

```ts
// tests/integration/kegiatan-import-match.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { POST } from '@/app/api/admin/kegiatan/[id]/import/match/route';

describe('POST /api/admin/kegiatan/[id]/import/match', () => {
  let kegiatanId: number;
  let otherKegiatanId: number;
  let certId: number;

  beforeAll(async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji Match Scoped', jumlahJp: 8 }).returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({ kegiatanId, nama: 'Peserta Match Scoped', nik: '6666666666666666', status: 'belum' })
      .returning();
    certId = s.id;

    const [k2] = await db.insert(kegiatan).values({ nama: 'Uji Match Scoped Lain', jumlahJp: 8 }).returning();
    otherKegiatanId = k2.id;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
    await db.delete(kegiatan).where(eq(kegiatan.id, otherKegiatanId));
  });

  it('assigns a blob URL to the given peserta and marks it siap', async () => {
    const request = new Request(`http://localhost/api/admin/kegiatan/${kegiatanId}/import/match`, {
      method: 'POST',
      body: JSON.stringify({ pesertaId: certId, blobUrl: 'https://example.com/manual.pdf', fileSize: 1024 }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: String(kegiatanId) }) });
    expect(response.status).toBe(200);

    const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, certId));
    expect(row.status).toBe('siap');
    expect(row.fileUrl).toBe('https://example.com/manual.pdf');
  });

  it('returns 404 when the peserta belongs to a different kegiatan', async () => {
    const request = new Request(`http://localhost/api/admin/kegiatan/${otherKegiatanId}/import/match`, {
      method: 'POST',
      body: JSON.stringify({ pesertaId: certId, blobUrl: 'https://example.com/manual.pdf', fileSize: 1024 }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: String(otherKegiatanId) }) });
    expect(response.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/kegiatan-import-match.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/admin/kegiatan/[id]/import/match/route'`

- [ ] **Step 3: Write the implementation**

```ts
// src/app/api/admin/kegiatan/[id]/import/match/route.ts
import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat } from '@/db/schema';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kegiatanId = Number(id);
  const { pesertaId, blobUrl, fileSize } = (await request.json()) as {
    pesertaId: number;
    blobUrl: string;
    fileSize: number;
  };

  const [existing] = await db
    .select()
    .from(sertifikat)
    .where(and(eq(sertifikat.id, pesertaId), eq(sertifikat.kegiatanId, kegiatanId)));
  if (!existing) {
    return NextResponse.json({ error: `Peserta ${pesertaId} tidak ditemukan pada kegiatan ini` }, { status: 404 });
  }

  await db
    .update(sertifikat)
    .set({ fileUrl: blobUrl, fileSize, status: 'siap', updatedAt: new Date() })
    .where(eq(sertifikat.id, existing.id));

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/integration/kegiatan-import-match.test.ts`
Expected: PASS (2/2)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/kegiatan/[id]/import/match/route.ts tests/integration/kegiatan-import-match.test.ts
git commit -m "$(cat <<'EOF'
feat: add kegiatan-scoped manual match route by pesertaId

Replaces the removed nomor-based manual match; a pesertaId that
belongs to a different kegiatan than the URL 404s, so a crafted
request can't assign a file to the wrong kegiatan's peserta.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Remove `nomor`/`tanggalTerbit` from remaining consumers; delete superseded global routes

**Files:**
- Modify: `src/lib/search.ts` (full rewrite)
- Modify: `src/components/search/CertificateCard.tsx`
- Modify: `src/components/admin/PenerimaTable.tsx`
- Modify: `tests/integration/search.test.ts`, `tests/integration/get-all-sertifikat.test.ts`, `tests/integration/download.test.ts`, `tests/integration/sertifikat-delete.test.ts`, `tests/integration/sertifikat-replace.test.ts`
- Modify: `tests/e2e/auth-boundary.spec.ts`
- Delete: `src/app/api/admin/import/csv/route.ts`, `src/app/api/admin/import/zip/route.ts`, `src/app/api/admin/import/match/route.ts`
- Delete: `tests/integration/import-csv.test.ts`, `tests/integration/import-zip.test.ts`, `tests/integration/import-match.test.ts`

**Interfaces:**
- Produces: `CertificateSummary`/`AdminSertifikatRow` lose `nomor`; their date field is renamed `tanggalTerbit` → `tanggalSelesai` and now reads `kegiatan.tanggalSelesai`.

- [ ] **Step 1: Replace `src/lib/search.ts`'s full content**

```ts
import { eq, ilike, or, and, asc, desc, count } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat, kegiatan, unduhanLog } from '@/db/schema';

export interface CertificateSummary {
  id: number;
  kegiatanNama: string;
  tanggalSelesai: string | null;
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
      kegiatanNama: r.kegiatan.nama,
      tanggalSelesai: r.kegiatan.tanggalSelesai,
      jumlahJp: r.kegiatan.jumlahJp,
      status: r.sertifikat.status,
    })),
  };
}

export async function searchByNik(nik: string, kegiatanId?: number): Promise<PersonResult | null> {
  const conditions = [eq(sertifikat.nik, nik)];
  if (kegiatanId) {
    conditions.push(eq(sertifikat.kegiatanId, kegiatanId));
  }

  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(and(...conditions));
  return groupToPerson(nik, rows);
}

function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export interface KegiatanOption {
  id: number;
  nama: string;
}

export async function searchKegiatanByName(name: string): Promise<KegiatanOption[]> {
  const trimmed = name.trim();
  if (trimmed.length < 4) return [];

  return db
    .select({ id: kegiatan.id, nama: kegiatan.nama })
    .from(kegiatan)
    .where(ilike(kegiatan.nama, `%${escapeIlikePattern(trimmed)}%`))
    .orderBy(kegiatan.nama)
    .limit(10);
}

export async function searchByName(name: string): Promise<PersonResult[]> {
  const trimmed = name.trim();
  if (trimmed.length < 3) return [];

  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(ilike(sertifikat.nama, `%${escapeIlikePattern(trimmed)}%`))
    .orderBy(sertifikat.nik, sertifikat.id);

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
  return people.slice(0, 20);
}

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
    kegiatanNama: k.nama,
    tanggalSelesai: k.tanggalSelesai,
    jumlahJp: k.jumlahJp,
    status: s.status,
    nama: s.nama,
    nik: s.nik,
    fileUrl: s.fileUrl,
    fileSize: s.fileSize,
  };
}

import { del } from '@vercel/blob';

export async function deleteSertifikat(id: number): Promise<void> {
  const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, id));
  if (row?.fileUrl) {
    await del(row.fileUrl).catch(() => undefined);
  }
  await db.delete(sertifikat).where(eq(sertifikat.id, id));
}

export async function replaceSertifikatFile(id: number, blobUrl: string, fileSize: number): Promise<void> {
  const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, id));
  if (row?.fileUrl) {
    await del(row.fileUrl).catch(() => undefined);
  }
  await db
    .update(sertifikat)
    .set({ fileUrl: blobUrl, fileSize, status: 'siap', updatedAt: new Date() })
    .where(eq(sertifikat.id, id));
}

export interface AdminSertifikatRow {
  id: number;
  nama: string;
  nik: string;
  kegiatanNama: string;
  tanggalSelesai: string | null;
  status: 'siap' | 'belum';
  unduhCount: number;
}

export interface GetAllSertifikatFilter {
  q?: string;
  status?: 'siap' | 'belum';
  sort?: 'nama' | 'nik' | 'tanggal';
  dir?: 'asc' | 'desc';
}

const SORT_COLUMNS = {
  nama: sertifikat.nama,
  nik: sertifikat.nik,
  tanggal: kegiatan.tanggalSelesai,
} as const;

export async function getAllSertifikat(filter: GetAllSertifikatFilter = {}): Promise<AdminSertifikatRow[]> {
  const conditions = [];
  if (filter.q) {
    const pattern = `%${escapeIlikePattern(filter.q)}%`;
    conditions.push(or(ilike(sertifikat.nama, pattern), ilike(sertifikat.nik, pattern)));
  }
  if (filter.status) {
    conditions.push(eq(sertifikat.status, filter.status));
  }

  const sortColumn = SORT_COLUMNS[filter.sort ?? 'tanggal'] ?? sertifikat.createdAt;
  const orderExpr = filter.sort ? (filter.dir === 'desc' ? desc(sortColumn) : asc(sortColumn)) : desc(sertifikat.createdAt);

  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderExpr);

  return rows.map((r) => ({
    id: r.sertifikat.id,
    nama: r.sertifikat.nama,
    nik: r.sertifikat.nik,
    kegiatanNama: r.kegiatan.nama,
    tanggalSelesai: r.kegiatan.tanggalSelesai,
    status: r.sertifikat.status,
    unduhCount: r.sertifikat.unduhCount,
  }));
}

export interface UnduhanLogRow {
  waktu: Date;
  nama: string;
  ip: string;
}

export async function getUnduhanLog(options: { limit?: number } = {}): Promise<UnduhanLogRow[]> {
  const query = db
    .select({ waktu: unduhanLog.waktu, nama: sertifikat.nama, ip: unduhanLog.ip })
    .from(unduhanLog)
    .innerJoin(sertifikat, eq(unduhanLog.sertifikatId, sertifikat.id))
    .orderBy(desc(unduhanLog.waktu));

  return options.limit ? query.limit(options.limit) : query;
}

export async function countAllSertifikat(): Promise<number> {
  const [row] = await db.select({ value: count() }).from(sertifikat);
  return row.value;
}
```

- [ ] **Step 2: Fix `CertificateCard.tsx`**

In `src/components/search/CertificateCard.tsx`, replace:

```tsx
        <div style={{ display: 'flex', gap: 14, marginTop: 5, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{certificate.nomor}</span>
          <span>Terbit {certificate.tanggalTerbit}</span>
          <span>{certificate.jumlahJp} JP</span>
        </div>
```

with:

```tsx
        <div style={{ display: 'flex', gap: 14, marginTop: 5, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
          <span>Terbit {certificate.tanggalSelesai}</span>
          <span>{certificate.jumlahJp} JP</span>
        </div>
```

- [ ] **Step 3: Fix `PenerimaTable.tsx`**

In `src/components/admin/PenerimaTable.tsx`, replace:

```tsx
            placeholder="Cari nama, NIK, atau nomor"
```

with:

```tsx
            placeholder="Cari nama atau NIK"
```

and replace:

```tsx
              <td style={{ padding: 11, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{r.tanggalTerbit}</td>
```

with:

```tsx
              <td style={{ padding: 11, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{r.tanggalSelesai}</td>
```

- [ ] **Step 4: Fix the existing integration test fixtures**

In each of `tests/integration/search.test.ts`, `tests/integration/get-all-sertifikat.test.ts`, `tests/integration/download.test.ts`, `tests/integration/sertifikat-delete.test.ts`, `tests/integration/sertifikat-replace.test.ts`:
- Remove every `nomor: '...',` line from `.values()` calls on `sertifikat`.
- Rename `tanggalTerbit:` to `tanggalSelesai:` in every `.values()` call on `kegiatan`.

For example in `tests/integration/search.test.ts`, `.values({ nama: 'Uji Coba Diklat', tanggalTerbit: '2026-01-01', jumlahJp: 16 })` becomes `.values({ nama: 'Uji Coba Diklat', tanggalSelesai: '2026-01-01', jumlahJp: 16 })`, and `nomor: 'TEST-0001/UJI/2026',` is deleted from the `sertifikat.insert` call. Apply the same two mechanical edits everywhere else these keys appear in the five files listed above.

- [ ] **Step 5: Fix `tests/e2e/auth-boundary.spec.ts`**

Replace:

```ts
  const apiResponse = await request.post('/api/admin/import/csv', { data: {} });
```

with:

```ts
  const apiResponse = await request.post('/api/admin/kegiatan', { data: {} });
```

(The route being deleted this task no longer exists; any `/api/admin/*` route works to prove the auth boundary, and `/api/admin/kegiatan` is the one that survives.)

- [ ] **Step 6: Delete the superseded global import routes and their tests**

```bash
git rm src/app/api/admin/import/csv/route.ts src/app/api/admin/import/zip/route.ts src/app/api/admin/import/match/route.ts
git rm tests/integration/import-csv.test.ts tests/integration/import-zip.test.ts tests/integration/import-match.test.ts
```

- [ ] **Step 7: Run the affected tests to verify they pass**

Run: `npx vitest run tests/integration/search.test.ts tests/integration/get-all-sertifikat.test.ts tests/integration/download.test.ts tests/integration/sertifikat-delete.test.ts tests/integration/sertifikat-replace.test.ts`
Expected: PASS, all suites

Run: `npx tsc --noEmit`
Expected: no errors referencing `search.ts`, `CertificateCard.tsx`, or `PenerimaTable.tsx` (some errors from files not yet touched by Tasks 11–13 are fine at this point — only fix errors that trace back to `nomor`/`tanggalTerbit` removal).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
refactor: remove nomor/tanggalTerbit from remaining consumers

Drops nomor from search.ts/CertificateCard/PenerimaTable and renames
tanggalTerbit -> tanggalSelesai throughout; deletes the global
/api/admin/import/* routes now superseded by the kegiatan-scoped
versions.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Allow logo image uploads on the Blob upload route

**Files:**
- Modify: `src/app/api/admin/blob/upload/route.ts`

**Interfaces:**
- No signature change — only the allowed content types.

- [ ] **Step 1: Update allowed content types**

In `src/app/api/admin/blob/upload/route.ts`, replace:

```ts
        allowedContentTypes: ['application/zip', 'application/pdf'],
```

with:

```ts
        allowedContentTypes: ['application/zip', 'application/pdf', 'image/jpeg', 'image/png'],
```

- [ ] **Step 2: Verify**

This route has no dedicated test in the current suite (it's exercised end-to-end by real uploads). Run `npx tsc --noEmit` to confirm the file still compiles; the logo upload path itself is exercised manually in Task 11 and end-to-end in Task 15.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/blob/upload/route.ts
git commit -m "$(cat <<'EOF'
feat: allow jpg/png uploads on the admin blob upload route

Needed for the step-1 kegiatan form's Logo Penyelenggara upload.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: `KegiatanForm` + `/admin/kegiatan/baru` page (Step 1)

**Files:**
- Create: `src/components/admin/KegiatanForm.tsx`
- Create: `src/app/admin/kegiatan/baru/page.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/kegiatan` (Task 5), `/api/admin/blob/upload` (Task 10), `src/data/wilayah-indonesia.json` (Task 2).
- No dedicated unit test — this codebase doesn't unit-test feature components (see `UploadTab.tsx`, `PenerimaTable.tsx`); it's exercised by the Task 15 e2e test and manual verification below.

- [ ] **Step 1: Write `KegiatanForm.tsx`**

```tsx
// src/components/admin/KegiatanForm.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const SEGMEN_OPTIONS = ['Aparatur Negara', 'Orsospol', 'KML', 'Purnapaskibraka'] as const;
const MODE_OPTIONS = ['Luring', 'Daring', 'Hybrid'] as const;
const MAX_LOGO_BYTES = 1024 * 1024;

const FIELD_STYLE: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'rgba(255,255,255,0.7)',
  fontSize: 'var(--text-sm)',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 5,
};

function yearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + 1; y >= current - 3; y--) years.push(y);
  return years;
}

export function KegiatanForm({ wilayah }: { wilayah: Record<string, string[]> }) {
  const router = useRouter();
  const provinsiList = useMemo(() => Object.keys(wilayah), [wilayah]);

  const [nama, setNama] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [segmen, setSegmen] = useState<(typeof SEGMEN_OPTIONS)[number] | ''>('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [jumlahJp, setJumlahJp] = useState('');
  const [provinsi, setProvinsi] = useState('');
  const [kabupatenKota, setKabupatenKota] = useState('');
  const [modePenyelenggaraan, setModePenyelenggaraan] = useState<(typeof MODE_OPTIONS)[number] | ''>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const kabupatenOptions = provinsi ? (wilayah[provinsi] ?? []) : [];

  function handleLogoChange(file: File) {
    setLogoError(null);
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setLogoError('Logo harus berformat JPG atau PNG');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Ukuran logo maksimal 1MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const clientErrors: string[] = [];
    if (!nama.trim()) clientErrors.push('Nama kegiatan wajib diisi');
    if (!segmen) clientErrors.push('Segmen kegiatan wajib dipilih');
    if (!tanggalMulai) clientErrors.push('Tanggal mulai wajib diisi');
    if (!tanggalSelesai) clientErrors.push('Tanggal berakhir wajib diisi');
    if (tanggalMulai && tanggalSelesai && tanggalSelesai < tanggalMulai) clientErrors.push('Tanggal berakhir harus setelah tanggal mulai');
    if (!jumlahJp || Number(jumlahJp) <= 0) clientErrors.push('Jam pelajaran harus berupa angka positif');
    if (!provinsi) clientErrors.push('Provinsi kegiatan wajib dipilih');
    if (!kabupatenKota) clientErrors.push('Kab/kota kegiatan wajib dipilih');
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      let logoUrl: string | undefined;
      if (logoFile) {
        const blob = await upload(logoFile.name, logoFile, {
          access: 'public',
          handleUploadUrl: '/api/admin/blob/upload',
        });
        logoUrl = blob.url;
      }

      const response = await fetch('/api/admin/kegiatan', {
        method: 'POST',
        body: JSON.stringify({
          nama,
          tahun,
          segmen,
          tanggalMulai,
          tanggalSelesai,
          jumlahJp: Number(jumlahJp),
          provinsi,
          kabupatenKota,
          modePenyelenggaraan: modePenyelenggaraan || undefined,
          logoUrl,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setErrors(body.errors ?? ['Gagal membuat kegiatan']);
        return;
      }
      router.push(`/admin/kegiatan/${body.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {errors.length > 0 && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(220,38,38,0.08)', color: '#b91c1c', fontSize: 'var(--text-sm)' }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label style={LABEL_STYLE} htmlFor="tahun">Tahun</label>
        <select id="tahun" style={FIELD_STYLE} value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
          {yearOptions().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="segmen">Segmen Kegiatan</label>
        <select id="segmen" style={FIELD_STYLE} value={segmen} onChange={(e) => setSegmen(e.target.value as typeof segmen)}>
          <option value="">Pilih salah satu</option>
          {SEGMEN_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="nama">Nama Kegiatan</label>
        <input id="nama" style={FIELD_STYLE} value={nama} onChange={(e) => setNama(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={LABEL_STYLE} htmlFor="tanggalMulai">Tanggal Mulai</label>
          <input id="tanggalMulai" type="date" style={FIELD_STYLE} value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} />
        </div>
        <div>
          <label style={LABEL_STYLE} htmlFor="tanggalSelesai">Tanggal Berakhir</label>
          <input id="tanggalSelesai" type="date" style={FIELD_STYLE} value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} />
        </div>
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="jumlahJp">Jam Pelajaran</label>
        <input id="jumlahJp" type="number" min={1} style={FIELD_STYLE} value={jumlahJp} onChange={(e) => setJumlahJp(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={LABEL_STYLE} htmlFor="provinsi">Provinsi Kegiatan</label>
          <select
            id="provinsi"
            style={FIELD_STYLE}
            value={provinsi}
            onChange={(e) => {
              setProvinsi(e.target.value);
              setKabupatenKota('');
            }}
          >
            <option value="">Pilih provinsi</option>
            {provinsiList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={LABEL_STYLE} htmlFor="kabupatenKota">Kab/Kota Kegiatan</label>
          <select id="kabupatenKota" style={FIELD_STYLE} value={kabupatenKota} onChange={(e) => setKabupatenKota(e.target.value)} disabled={!provinsi}>
            <option value="">Pilih kab/kota</option>
            {kabupatenOptions.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="mode">Mode Penyelenggaraan</label>
        <select id="mode" style={FIELD_STYLE} value={modePenyelenggaraan} onChange={(e) => setModePenyelenggaraan(e.target.value as typeof modePenyelenggaraan)}>
          <option value="">Pilih salah satu (opsional)</option>
          {MODE_OPTIONS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={LABEL_STYLE}>Logo Penyelenggara</label>
        {logoPreview ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoPreview} alt="Pratinjau logo" style={{ width: 66, height: 66, objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }} />
            <Button type="button" variant="ghost" size="sm" onClick={removeLogo}>Hapus</Button>
          </div>
        ) : (
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              border: '2px dashed rgba(0,74,147,0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
            }}
          >
            <Icon name="upload-cloud" size={24} />
            <span style={{ fontSize: 'var(--text-xs)' }}>Drop file di sini atau klik untuk upload</span>
            <span style={{ fontSize: 11 }}>Format jpg/png · ukuran 132 x 132 px · Maksimal 1MB</span>
            <input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleLogoChange(e.target.files[0])} />
          </label>
        )}
        {logoError && <div style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: '#b91c1c' }}>{logoError}</div>}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Buat Kegiatan'}</Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin')}>Batal</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Write the page**

```tsx
// src/app/admin/kegiatan/baru/page.tsx
import wilayahData from '@/data/wilayah-indonesia.json';
import { KegiatanForm } from '@/components/admin/KegiatanForm';

export default function KegiatanBaruPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', margin: '0 0 18px' }}>Kegiatan Baru</h2>
        <KegiatanForm wilayah={wilayahData as Record<string, string[]>} />
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify manually**

Run `npx tsc --noEmit` (should show no new errors from these two files). Then start `npm run dev`, log in as admin, navigate to `http://localhost:3000/admin/kegiatan/baru`, fill every field, upload a small jpg/png as logo, submit, and confirm you land on `/admin/kegiatan/<new id>` (a 404 page is expected here until Task 13 builds the detail page — that's fine, it confirms the redirect and the row was created).

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/KegiatanForm.tsx src/app/admin/kegiatan/baru/page.tsx
git commit -m "$(cat <<'EOF'
feat: add the step-1 Buat Kegiatan form and page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: `KegiatanList` component + admin tab wiring

**Files:**
- Create: `src/components/admin/KegiatanList.tsx`
- Modify: `src/components/admin/AdminTabs.tsx`
- Modify: `src/app/admin/page.tsx`
- Rename: `src/components/admin/PenerimaTable.tsx` → `src/components/admin/PesertaTable.tsx`

**Interfaces:**
- Consumes: `listKegiatan` (Task 4).
- Produces: default admin tab becomes `kegiatan`.

- [ ] **Step 1: Rename `PenerimaTable.tsx` to `PesertaTable.tsx`**

```bash
git mv src/components/admin/PenerimaTable.tsx src/components/admin/PesertaTable.tsx
```

In the renamed file, rename the exported function `PenerimaTable` → `PesertaTable`, the props interface `PenerimaTableProps` → `PesertaTableProps` (all usages), and change every `tab: 'penerima'` string (in `buildHref`'s `URLSearchParams({ tab: 'penerima' })` and the hidden `<input type="hidden" name="tab" value="penerima" />`) to `'peserta'`.

- [ ] **Step 2: Write `KegiatanList.tsx`**

```tsx
// src/components/admin/KegiatanList.tsx
import Link from 'next/link';
import { listKegiatan } from '@/lib/kegiatan';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export async function KegiatanList() {
  const items = await listKegiatan();

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Link href="/admin/kegiatan/baru">
          <Button variant="primary">Kegiatan Baru</Button>
        </Link>
      </div>
      <div style={{ borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 11 }}>Nama Kegiatan</th>
              <th style={{ textAlign: 'left', padding: 11 }}>Tahun</th>
              <th style={{ textAlign: 'left', padding: 11 }}>Segmen</th>
              <th style={{ textAlign: 'left', padding: 11 }}>Tanggal</th>
              <th style={{ textAlign: 'right', padding: 11 }}>Peserta</th>
              <th style={{ textAlign: 'right', padding: 11 }}>Lulus</th>
              <th style={{ textAlign: 'right', padding: 11 }}>Tidak Lulus</th>
            </tr>
          </thead>
          <tbody>
            {items.map((k) => (
              <tr key={k.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 11 }}>
                  <Link href={`/admin/kegiatan/${k.id}`} style={{ color: 'inherit', fontWeight: 600, textDecoration: 'none' }}>
                    {k.nama}
                  </Link>
                </td>
                <td style={{ padding: 11 }}>{k.tahun ?? '-'}</td>
                <td style={{ padding: 11 }}>{k.segmen ?? '-'}</td>
                <td style={{ padding: 11, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                  {k.tanggalMulai && k.tanggalSelesai ? `${k.tanggalMulai} – ${k.tanggalSelesai}` : '-'}
                </td>
                <td style={{ padding: 11, textAlign: 'right' }}>{k.totalPeserta}</td>
                <td style={{ padding: 11, textAlign: 'right' }}>
                  <Badge variant="success">{k.jumlahLulus}</Badge>
                </td>
                <td style={{ padding: 11, textAlign: 'right' }}>
                  <Badge variant="warning">{k.totalPeserta - k.jumlahLulus}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div style={{ padding: 38, textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            Belum ada kegiatan. Klik &quot;Kegiatan Baru&quot; untuk memulai.
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `AdminTabs.tsx`**

Replace the full content of `src/components/admin/AdminTabs.tsx` with:

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/ui/Tabs';

export function AdminTabs({ current, pesertaCount }: { current: string; pesertaCount: number }) {
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
        { key: 'kegiatan', label: 'Kegiatan' },
        { key: 'peserta', label: 'Data Peserta', badge: pesertaCount },
        { key: 'log', label: 'Log Unduhan' },
      ]}
      value={current}
      onChange={setTab}
    />
  );
}
```

- [ ] **Step 4: Update `src/app/admin/page.tsx`**

Replace its full content with:

```tsx
import { StatsCards } from '@/components/admin/StatsCards';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { KegiatanList } from '@/components/admin/KegiatanList';
import { PesertaTable } from '@/components/admin/PesertaTable';
import { LogTab } from '@/components/admin/LogTab';
import { Button } from '@/components/ui/Button';
import { logoutAction } from '@/app/admin/actions';
import { countAllSertifikat } from '@/lib/search';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; status?: 'siap' | 'belum'; sort?: 'nama' | 'nik' | 'tanggal'; dir?: 'asc' | 'desc' }>;
}) {
  const { tab = 'kegiatan', q, status, sort, dir } = await searchParams;
  const pesertaCount = await countAllSertifikat();

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Kelola Sertifikat</h2>
            <p style={{ margin: '3px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Diklat BPIP RI · Sekretariat Diklat</p>
          </div>
          <form action={logoutAction}>
            <Button variant="glass" type="submit">Keluar</Button>
          </form>
        </div>
        <StatsCards />
        <AdminTabs current={tab} pesertaCount={pesertaCount} />
        {tab === 'kegiatan' && <KegiatanList />}
        {tab === 'peserta' && <PesertaTable q={q} status={status} sort={sort} dir={dir} />}
        {tab === 'log' && <LogTab />}
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Remove the now-unused `UploadTab.tsx`**

It's fully superseded by `KegiatanForm` (Task 11) and the upload cards (Task 13):

```bash
git rm src/components/admin/UploadTab.tsx
```

- [ ] **Step 6: Verify**

Run `npx tsc --noEmit` — should show no errors from any of the files touched in this task. Run `npm run dev`, log in, confirm `/admin` now defaults to the Kegiatan tab and lists any kegiatan created in Task 11's manual test.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: wire the Kegiatan tab into the admin dashboard

Admin now lands on a Kegiatan list by default; renames Data Penerima
to Data Peserta (PenerimaTable -> PesertaTable) and removes the
superseded UploadTab.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Kegiatan detail page — staged CSV/ZIP upload cards (Step 2 & 3)

**Files:**
- Modify: `src/lib/kegiatan.ts` (add `listPesertaByKegiatan`)
- Create: `src/components/admin/KegiatanCsvUploadCard.tsx`
- Create: `src/components/admin/KegiatanZipUploadCard.tsx`
- Create: `src/app/admin/kegiatan/[id]/page.tsx`
- Create: `tests/integration/list-peserta-by-kegiatan.test.ts`

**Interfaces:**
- Consumes: `getKegiatanById` (Task 4), `/api/admin/kegiatan/[id]/import/csv` (Task 6), `/api/admin/kegiatan/[id]/import/zip` (Task 7), `/api/admin/kegiatan/[id]/import/match` (Task 8).
- Produces: `listPesertaByKegiatan(kegiatanId: number): Promise<{ id: number; nama: string; nik: string }[]>`.

- [ ] **Step 1: Write the failing test for `listPesertaByKegiatan`**

```ts
// tests/integration/list-peserta-by-kegiatan.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { createKegiatan, listPesertaByKegiatan } from '@/lib/kegiatan';

describe('listPesertaByKegiatan', () => {
  let kegiatanId: number | undefined;

  afterEach(async () => {
    if (kegiatanId) {
      await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
      kegiatanId = undefined;
    }
  });

  it('lists peserta scoped to the given kegiatan, ordered by nama', async () => {
    const { id } = await createKegiatan({
      nama: 'Uji List Peserta',
      jumlahJp: 8,
      tahun: 2026,
      segmen: 'KML',
      tanggalMulai: '2026-06-01',
      tanggalSelesai: '2026-06-02',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
    });
    kegiatanId = id;

    await db.insert(sertifikat).values([
      { kegiatanId: id, nama: 'Zeta Peserta', nik: '8888888888888801', status: 'belum' },
      { kegiatanId: id, nama: 'Alpha Peserta', nik: '8888888888888802', status: 'belum' },
    ]);

    const list = await listPesertaByKegiatan(id);
    expect(list.map((p) => p.nama)).toEqual(['Alpha Peserta', 'Zeta Peserta']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/list-peserta-by-kegiatan.test.ts`
Expected: FAIL — `listPesertaByKegiatan` is not exported.

- [ ] **Step 3: Add `listPesertaByKegiatan` to `src/lib/kegiatan.ts`**

Add this import to the top (alongside the existing `kegiatan` import) and this export at the bottom of `src/lib/kegiatan.ts`:

```ts
import { eq, desc, count, sql, asc } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat, type Kegiatan } from '@/db/schema';
```

(`asc` is newly added to the existing `drizzle-orm` import line.)

```ts
export interface KegiatanPesertaOption {
  id: number;
  nama: string;
  nik: string;
}

export async function listPesertaByKegiatan(kegiatanId: number): Promise<KegiatanPesertaOption[]> {
  return db
    .select({ id: sertifikat.id, nama: sertifikat.nama, nik: sertifikat.nik })
    .from(sertifikat)
    .where(eq(sertifikat.kegiatanId, kegiatanId))
    .orderBy(asc(sertifikat.nama));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/integration/list-peserta-by-kegiatan.test.ts`
Expected: PASS (1/1)

- [ ] **Step 5: Write `KegiatanCsvUploadCard.tsx`**

```tsx
// src/components/admin/KegiatanCsvUploadCard.tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export function KegiatanCsvUploadCard({ kegiatanId }: { kegiatanId: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);

  async function stageFile(file: File) {
    const text = await file.text();
    const lines = text.trim().split('\n').filter(Boolean);
    setStagedFile(file);
    setRowCount(Math.max(lines.length - 1, 0));
    setResult(null);
  }

  function cancelStaged() {
    setStagedFile(null);
    setRowCount(0);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function kirim() {
    if (!stagedFile) return;
    setSending(true);
    try {
      const csv = await stagedFile.text();
      const response = await fetch(`/api/admin/kegiatan/${kegiatanId}/import/csv`, {
        method: 'POST',
        body: JSON.stringify({ csv }),
      });
      const body = await response.json();
      setResult({ imported: body.imported, errors: body.errors.length });
      setStagedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)', padding: 22 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600 }}>Langkah 2 · Unggah CSV Peserta</div>
      <p style={{ margin: '4px 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        Kolom: <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>nama_peserta;Username;Email;Provinsi;Kabupaten / kota;Asal instansi</span>
      </p>

      <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && stageFile(e.target.files[0])} />

      {!stagedFile ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{ border: '2px dashed rgba(0,74,147,0.3)', borderRadius: 'var(--radius-lg)', padding: '26px 20px', textAlign: 'center', cursor: 'pointer' }}
        >
          <Icon name="upload-cloud" size={26} />
          <div style={{ marginTop: 8, fontWeight: 600 }}>Tarik berkas CSV ke sini</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>atau klik untuk memilih</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 'var(--text-sm)' }}>
            <strong>{stagedFile.name}</strong> — {rowCount} baris terdeteksi
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Button variant="primary" onClick={kirim} disabled={sending}>{sending ? 'Mengirim...' : 'Kirim'}</Button>
            <Button variant="ghost" onClick={cancelStaged} disabled={sending}>Batal</Button>
          </div>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 14, fontSize: 'var(--text-sm)', color: 'var(--ut-green)', fontWeight: 600 }}>
          {result.imported} baris berhasil diimpor, {result.errors} error.
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Write `KegiatanZipUploadCard.tsx`**

```tsx
// src/components/admin/KegiatanZipUploadCard.tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface UnmatchedFile {
  folder: string;
  email: string;
  blobUrl: string;
  fileSize: number;
}

interface PesertaOption {
  id: number;
  nama: string;
  nik: string;
}

export function KegiatanZipUploadCard({ kegiatanId, pesertaOptions }: { kegiatanId: number; pesertaOptions: PesertaOption[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [matched, setMatched] = useState<number | null>(null);
  const [unmatched, setUnmatched] = useState<UnmatchedFile[]>([]);
  const [pickerFor, setPickerFor] = useState<UnmatchedFile | null>(null);

  function stageFile(file: File) {
    setStagedFile(file);
    setMatched(null);
    setUnmatched([]);
  }

  function cancelStaged() {
    setStagedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function kirim() {
    if (!stagedFile) return;
    setSending(true);
    try {
      const blob = await upload(stagedFile.name, stagedFile, {
        access: 'public',
        handleUploadUrl: '/api/admin/blob/upload',
      });
      const response = await fetch(`/api/admin/kegiatan/${kegiatanId}/import/zip`, {
        method: 'POST',
        body: JSON.stringify({ blobUrl: blob.url }),
      });
      const body = await response.json();
      setMatched(body.matched);
      setUnmatched(body.unmatched);
      setStagedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function cocokkan(file: UnmatchedFile, pesertaId: number) {
    const response = await fetch(`/api/admin/kegiatan/${kegiatanId}/import/match`, {
      method: 'POST',
      body: JSON.stringify({ pesertaId, blobUrl: file.blobUrl, fileSize: file.fileSize }),
    });
    if (!response.ok) return;
    setUnmatched((prev) => prev.filter((u) => u.folder !== file.folder));
    setMatched((prev) => (prev ?? 0) + 1);
    setPickerFor(null);
    router.refresh();
  }

  return (
    <div style={{ borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)', padding: 22 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600 }}>Langkah 3 · Unggah ZIP Sertifikat</div>
      <p style={{ margin: '4px 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        Wajib <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>manifest.csv</span> (folder;email) di akar arsip.
      </p>

      <input ref={inputRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && stageFile(e.target.files[0])} />

      {!stagedFile ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{ border: '2px dashed rgba(0,74,147,0.3)', borderRadius: 'var(--radius-lg)', padding: '26px 20px', textAlign: 'center', cursor: 'pointer' }}
        >
          <Icon name="upload-cloud" size={26} />
          <div style={{ marginTop: 8, fontWeight: 600 }}>Tarik berkas ZIP ke sini</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>atau klik untuk memilih</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 'var(--text-sm)' }}>
            <strong>{stagedFile.name}</strong> — {(stagedFile.size / 1024).toFixed(0)} KB
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Button variant="primary" onClick={kirim} disabled={sending}>{sending ? 'Mengirim...' : 'Kirim'}</Button>
            <Button variant="ghost" onClick={cancelStaged} disabled={sending}>Batal</Button>
          </div>
        </div>
      )}

      {matched !== null && (
        <div style={{ marginTop: 16, fontSize: 'var(--text-sm)' }}>
          <div>{matched} berkas cocok otomatis</div>
          <div>{unmatched.length} berkas perlu ditinjau manual</div>
          {unmatched.map((u) => (
            <div key={u.folder} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                {u.folder} ({u.email})
              </span>
              {pickerFor?.folder === u.folder ? (
                <select
                  autoFocus
                  style={{ height: 34, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}
                  onChange={(e) => e.target.value && cocokkan(u, Number(e.target.value))}
                  defaultValue=""
                >
                  <option value="" disabled>Pilih peserta</option>
                  {pesertaOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama} ({p.nik})</option>
                  ))}
                </select>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setPickerFor(u)}>Cocokkan</Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Write the detail page**

```tsx
// src/app/admin/kegiatan/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getKegiatanById, listPesertaByKegiatan } from '@/lib/kegiatan';
import { KegiatanCsvUploadCard } from '@/components/admin/KegiatanCsvUploadCard';
import { KegiatanZipUploadCard } from '@/components/admin/KegiatanZipUploadCard';
import { Badge } from '@/components/ui/Badge';

export default async function KegiatanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kegiatanId = Number(id);
  const kegiatan = await getKegiatanById(kegiatanId);
  if (!kegiatan) notFound();

  const pesertaOptions = await listPesertaByKegiatan(kegiatanId);

  return (
    <main style={{ minHeight: '100vh', padding: '20px 32px 56px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          {kegiatan.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kegiatan.logoUrl} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          )}
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>{kegiatan.nama}</h2>
            <p style={{ margin: '3px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {kegiatan.tahun} · {kegiatan.segmen} · {kegiatan.totalPeserta} peserta ·{' '}
              <Badge variant="success">{kegiatan.jumlahLulus} lulus</Badge> <Badge variant="warning">{kegiatan.jumlahTidakLulus} belum</Badge>
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <KegiatanCsvUploadCard kegiatanId={kegiatanId} />
          <KegiatanZipUploadCard kegiatanId={kegiatanId} pesertaOptions={pesertaOptions} />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Verify**

Run `npx tsc --noEmit`. Then `npm run dev`, open the kegiatan created earlier from `/admin` (Kegiatan tab), confirm the detail page renders with both upload cards, and that staging a CSV file shows a row count + Kirim/Batal instead of uploading immediately.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: add kegiatan detail page with staged CSV/ZIP upload cards

Step 2 and 3 uploads now stage a file locally and require an explicit
Kirim to submit (Batal discards it), and the ZIP step's manual-match
picker selects from this kegiatan's own peserta instead of typing a
certificate number.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Update templates and the e2e peserta CSV fixture

**Files:**
- Modify: `public/templates/peserta_template.csv`
- Modify: `tests/fixtures/sertifikat-test.csv`

**Interfaces:** none (static files).

- [ ] **Step 1: Update the downloadable peserta template**

Replace the content of `public/templates/peserta_template.csv` with:

```
nama_peserta;Username;Email;Provinsi;Kabupaten / kota;Asal instansi
Sri Wahyuni;3204012509870007;sri.wahyuni@example.com;Jawa Tengah;KOTA SEMARANG;Universitas Diponegoro
```

- [ ] **Step 2: Update the e2e peserta fixture**

Replace the content of `tests/fixtures/sertifikat-test.csv` with:

```
nama_peserta;Username;Email;Provinsi;Kabupaten / kota;Asal instansi
Peserta ZIP E2E;5555555555555555;e2e.unique@example.com;Jawa Tengah;KOTA SEMARANG;Universitas Diponegoro
```

(This NIK/email pair matches the `peserta-cocok` folder already baked into `tests/fixtures/sertifikat-test.zip` by `scripts/make-fixture-zip.mjs` — no changes needed to the ZIP fixture itself.)

`public/templates/manifest_template.csv` is unaffected by this task — its `folder;email` format didn't change.

- [ ] **Step 3: Verify**

Run `npx vitest run tests/integration/kegiatan-import-csv.test.ts` (unaffected — it uses an inline CSV constant, not this fixture) to confirm nothing else broke, then visually diff the two files above against the format documented in `docs/superpowers/specs/2026-09-05-kegiatan-wizard-design.md`.

- [ ] **Step 4: Commit**

```bash
git add public/templates/peserta_template.csv tests/fixtures/sertifikat-test.csv
git commit -m "$(cat <<'EOF'
chore: update peserta CSV template and e2e fixture to the new format

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Rewrite the admin e2e flow for the wizard

**Files:**
- Modify: `tests/e2e/admin-flow.spec.ts`

**Interfaces:** none — this is the end-to-end proof the whole wizard works together.

- [ ] **Step 1: Replace the full content of `tests/e2e/admin-flow.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import path from 'node:path';

test('admin logs in, creates a kegiatan, imports CSV then ZIP, and sees a siap row', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email Institusi').fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel('Kata Sandi').fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL('/admin', { timeout: 15000 });

  await page.getByText('Kegiatan Baru').click();
  await expect(page).toHaveURL('/admin/kegiatan/baru');

  await page.getByLabel('Segmen Kegiatan').selectOption('Aparatur Negara');
  await page.getByLabel('Nama Kegiatan').fill('Diklat E2E Wizard');
  await page.getByLabel('Tanggal Mulai').fill('2026-03-01');
  await page.getByLabel('Tanggal Berakhir').fill('2026-03-05');
  await page.getByLabel('Jam Pelajaran').fill('16');
  await page.getByLabel('Provinsi Kegiatan').selectOption('Jawa Tengah');
  await page.getByLabel('Kab/Kota Kegiatan').selectOption('KOTA SEMARANG');
  await page.getByRole('button', { name: 'Buat Kegiatan' }).click();

  await expect(page).toHaveURL(/\/admin\/kegiatan\/\d+/, { timeout: 15000 });

  await page.setInputFiles('input[accept=".csv"]', path.join(__dirname, '../fixtures/sertifikat-test.csv'));
  await page.getByRole('button', { name: 'Kirim' }).first().click();
  await expect(page.getByText(/baris berhasil diimpor/)).toBeVisible();

  await page.setInputFiles('input[accept=".zip"]', path.join(__dirname, '../fixtures/sertifikat-test.zip'));
  await page.getByRole('button', { name: 'Kirim' }).first().click();
  await expect(page.getByText(/berkas cocok otomatis/)).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(/^1 berkas cocok otomatis/)).toBeVisible();

  await page.goto('/admin?tab=peserta');
  const row = page.locator('tr', { hasText: 'Peserta ZIP E2E' });
  await expect(row).toBeVisible();
  await expect(row.getByText('Siap')).toBeVisible();
});
```

- [ ] **Step 2: Run the e2e test**

Run: `npx playwright test tests/e2e/admin-flow.spec.ts`
Expected: PASS. (Playwright auto-starts `npm run dev` per `playwright.config.ts` if a server isn't already running on port 3000.) If a step fails, check the exact label text/copy against what Tasks 11–13 actually rendered (`getByLabel` requires the `<label htmlFor>`/`<input id>` pairing used in those tasks) rather than editing the spec to paper over a mismatch.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/admin-flow.spec.ts
git commit -m "$(cat <<'EOF'
test: rewrite the admin e2e flow for the kegiatan wizard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Full verification pass

**Files:** none (verification only; fix whatever the checks below surface).

- [ ] **Step 1: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors. Fix any stragglers (most likely leftover `nomor`/`tanggalTerbit`/`PenerimaTable` references this plan's tasks missed).

- [ ] **Step 2: Run the full Vitest suite**

Run: `npx vitest run`
Expected: all test files pass. If any fail on a unique-constraint collision from leftover dev-DB rows (a known pre-existing flake pattern in this project — see Task 1's note about this being a shared dev database), query for and delete the orphaned rows by their test-specific `nama`/`nik` values, then re-run.

- [ ] **Step 3: Run the full Playwright e2e suite**

Run: `npx playwright test`
Expected: `admin-flow.spec.ts`, `auth-boundary.spec.ts`, and `public-flow.spec.ts` all pass.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: builds successfully with no type or lint errors.

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: fix remaining type/test breakage from the kegiatan wizard rollout

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

(Skip this commit if Steps 1–4 were already all green with no changes needed.)
