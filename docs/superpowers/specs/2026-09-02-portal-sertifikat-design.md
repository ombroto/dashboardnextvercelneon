# Portal Sertifikat — Design

Date: 2026-09-02
Status: Approved by user, ready for implementation planning.

## Goal

Build a standalone public certificate portal for BPIP's Diklat (training)
program: participants self-serve search and download their official PDF
certificates, and admin staff import participant data and certificate
files. Source: a Claude Design mockup ("Portal Sertifikat", UT Glass
Design System — glassmorphism, UT/BPIP blue+gold palette) imported via
the Claude Design MCP. This is a fresh, standalone project — not a
migration of the existing Laravel `diklatdash` app, and not (yet) merged
into any larger conversion of it. It is deployed to **Vercel** with
**Neon Postgres** as the database.

## Decisions (confirmed with user)

- Standalone project now; a larger diklatdash conversion (RBAC, map
  dashboard, Kegiatan CRUD) is a separate, later effort — not this scope.
- Auth.js (NextAuth) Credentials provider for admin login; JWT session.
- Drizzle ORM against Neon Postgres (`drizzle-orm/neon-http`).
- File storage: Vercel Blob (client-side direct upload, bypassing the
  ~4.5MB serverless function body limit).
- Admin accounts: a real `admin_users` table (multi-admin), not a single
  env-var credential — first admin created via a seed script.
- Certificate preview renders the **actual PDF** the admin uploaded (via
  `<iframe>`), not an HTML/CSS recreation of a certificate — what a
  visitor previews is exactly what they download.
- No e-signature / BSrE-BSSN integration. The mock's "ditandatangani
  secara elektronik oleh BSrE BSSN" line is decorative copy on the
  mock's placeholder certificate graphic, not a feature to build. This
  system only stores and serves PDFs the admin already has in hand.

## Data model

### `admin_users`
| column | type | notes |
|---|---|---|
| id | serial pk | |
| name | text | |
| email | text, unique | |
| password_hash | text | bcrypt |
| created_at | timestamptz default now() | |

No self-registration UI. First row(s) created by a seed script reading
`ADMIN_EMAIL` / `ADMIN_PASSWORD` from environment variables.

### `kegiatan`
| column | type | notes |
|---|---|---|
| id | serial pk | |
| nama | text | e.g. "Diklat Pembudayaan Nilai Pancasila Angkatan VII" |
| tanggal_terbit | date | |
| jumlah_jp | integer | jam pelajaran |
| created_at | timestamptz default now() | |

### `sertifikat`
| column | type | notes |
|---|---|---|
| id | serial pk | |
| kegiatan_id | FK → kegiatan, cascade delete | |
| nama | text | participant name (denormalized for search/display) |
| nik | varchar(16) | indexed |
| nomor | text, unique | certificate number, e.g. `SK-1182/DIK/2026` |
| file_url | text, nullable | Vercel Blob URL once matched |
| file_size | integer, nullable | bytes |
| status | enum('siap','belum') default 'belum' | 'siap' once file_url is set |
| unduh_count | integer default 0 | |
| created_at | timestamptz default now() | |
| updated_at | timestamptz default now() | |

Indexes: `nik` (exact-match lookup), `lower(nama)` (ILIKE search).

### `unduhan_log`
| column | type | notes |
|---|---|---|
| id | serial pk | |
| sertifikat_id | FK → sertifikat, cascade delete | |
| waktu | timestamptz default now() | |
| ip | text | from request headers |
| user_agent | text, nullable | |

## Admin data import

### Step 1 — CSV (participant data)
Columns: `nik,nama,kegiatan,tanggal_terbit,nomor,jam`.

Per row: find-or-create `kegiatan` by the `(nama, tanggal_terbit,
jumlah_jp)` tuple; upsert `sertifikat` by `nomor` (re-importing the same
CSV is idempotent) with `status='belum'` and `file_url=null` unless a
file was already matched previously (upsert must not clobber an existing
`file_url`/`status='siap'` row).

### Step 2 — ZIP (certificate PDFs)
Admin uploads one `.zip` archive (client → Vercel Blob directly, then a
server route processes the blob).

**Matching, in priority order:**
1. If a `manifest.csv` exists at the archive root, use it. **Format is
   `nik,nomor,file`** — this deviates from the mock's decorative code
   sample (`nik,nama,file`); `nama` alone cannot disambiguate a NIK with
   multiple certificates (the mock's own sample data has "Sri Wahyuni"
   with two certificates under the same NIK), so `nomor` is required for
   an unambiguous match.
2. Otherwise, fall back to filename convention: `{nik}_{nomorPrefix}.pdf`,
   where `nomorPrefix` is the `nomor` value up to (not including) its
   first `/` (e.g. `nomor` = `SK-1182/DIK/2026` → prefix `SK-1182`,
   filename `3204012509870007_SK-1182.pdf`).
3. Anything not matched by either method is listed under "Perlu
   ditinjau" (needs review) in the admin UI, with a manual "Cocokkan"
   action to assign it to a `sertifikat` row by hand.

On a successful match: upload the extracted PDF to Vercel Blob, set
`file_url`, `file_size`, `status='siap'` on the matched `sertifikat` row.

**Known risk — flagged, not silently promised:** the mock's UI copy says
"maksimal 500 MB per arsip". That figure is untested against Vercel's
serverless function memory/duration limits. Implementation will use
streaming ZIP extraction (never buffering the whole archive in memory)
and an extended `maxDuration`, but the actual safe ceiling must be
verified with a large test fixture during implementation. If 500MB
proves unsafe, the UI copy will be corrected to the verified limit
rather than shipped as a false promise.

## Public pages

- `/` — Search. Input accepts NIK (exact match, digits) or name
  (`ILIKE '%query%'`, case-insensitive). Sample "coba contoh" buttons
  from the mock, error state for zero results.
- `/hasil/[nik]` — Results for one person: header (name, masked NIK,
  count), list of their `sertifikat` rows (both `siap` and `belum`
  status shown — `belum` renders with a disabled download button and a
  "sedang diproses" note, so a participant can see their record exists
  even before the PDF is attached).
  - If a **name** search matches multiple distinct people (multiple
    NIKs), show an intermediate disambiguation list (name + masked NIK)
    before reaching a single person's results page — the mock only
    depicts the single-person case, so this is a necessary addition for
    correctness.
- `/pratinjau/[sertifikatId]` — Preview: left panel renders the actual
  uploaded PDF in an `<iframe>`; right sidebar shows metadata from the
  database (nama, NIK masked, kegiatan, tanggal, ukuran) plus "Unduh
  PDF" / "Cetak" actions.
- NIK is masked in all public-facing UI (`3204********07` — first 4 and
  last 2 digits visible) per the mock's `maskNik` default. The full NIK
  is used only server-side for search matching, never sent to the client
  in an unmasked form outside of what the visitor themselves typed in.
- Download endpoint: verifies `sertifikat.status === 'siap'`, inserts an
  `unduhan_log` row (IP from request headers, user agent), then redirects
  to the Blob file URL. Blob objects use Vercel's default unguessable
  random pathnames — acceptable protection for a self-service public
  document portal; not intended as strong access control.

## Admin pages

- `/admin/login` — Auth.js Credentials sign-in (email + password against
  `admin_users`).
- `/admin` — protected by Next.js middleware checking the Auth.js
  session; redirects to `/admin/login` if absent.
  - Stat cards: total kegiatan, total sertifikat siap, total belum,
    total unduhan — aggregate queries.
  - Tabs (`?tab=unggah|penerima|log`, default `unggah`):
    - **Unggah**: CSV upload form (Step 1) + ZIP upload via Vercel Blob
      client upload widget (Step 2), with the "Perlu ditinjau"
      unmatched-file review list and manual match action.
    - **Penerima**: server-rendered table of all `sertifikat` rows —
      search (nama/NIK/nomor), status filter, column sort (nama, NIK,
      tanggal) via URL search params. Row actions: replace file (opens
      a single-file upload dialog), delete (removes the `sertifikat` row
      and its Blob object).
    - **Log**: paginated `unduhan_log` table (waktu, nama, file, IP),
      with a CSV export action.

## Design system implementation

The UT Glass Design System's tokens (`colors.css`, `glass.css`,
`typography.css`, `spacing.css`) are ported near-verbatim as global CSS
custom properties — this is a token/CSS-variable-driven design (glass
blur, layered shadows, tight display tracking), and forcing it through
Tailwind's utility classes would fight the grain and risk visual drift.
Tailwind is used only for layout (flex/grid/spacing utilities); the
tokens and a small set of hand-built React components carry the actual
look:

- `Button`, `IconButton`, `Input`, `Badge`, `Card`, `Tabs` — implemented
  to match the prop shapes the mock already exercises (`variant`,
  `size`, `block`, `onClick`, etc.), styled directly with the CSS
  variables rather than reimplemented as Tailwind utilities.
- Icons via `lucide-react` (npm package), not the mock's `unpkg` UMD
  CDN script.
- Fonts via `next/font` (Geist, Geist Mono) — matches the design's
  intended fallback stack behind `-apple-system` on Apple devices.

## Out of scope

- Any larger diklatdash conversion (RBAC, Kegiatan CRUD, map dashboard).
- Real e-signature / BSrE-BSSN integration.
- PDF generation — admins supply finished PDFs; nothing in this system
  renders or signs a certificate.
- Historical data migration from the existing Laravel/MySQL `diklatdash`
  database — this project starts from an empty schema.

## Testing plan

- **Vitest** — unit tests for the highest-risk logic: CSV row parsing,
  the ZIP filename-matching regex/logic, manifest.csv parsing, and the
  NIK-masking function.
- **Playwright** — end-to-end smoke tests for the two critical flows:
  (1) public search → results → preview → download, and (2) admin
  login → CSV upload → ZIP upload → a file lands in "Penerima" as
  `siap`.
- Migrations run via Drizzle Kit, applied manually (not automatically on
  every Vercel deploy) to avoid unintended production schema changes.
