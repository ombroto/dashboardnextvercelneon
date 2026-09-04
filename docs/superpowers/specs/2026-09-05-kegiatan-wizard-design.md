# Kegiatan Wizard (Per-Kegiatan Upload Flow) — Design

Date: 2026-09-05
Status: Approved by user, ready for implementation planning.

## Goal

Replace the current kegiatan-agnostic upload flow (CSV import implicitly
find-or-creates a `kegiatan` row, ZIP matches certificates against every
`sertifikat` row in the database) with an explicit, per-kegiatan 3-step
wizard:

1. **Buat Kegiatan** — a form that creates the `kegiatan` row first, with
   fields ported from the original Laravel `diklatdash` app's
   `diklat_kegiatan` table (segmen, provinsi, mode penyelenggaraan, jadwal,
   logo).
2. **Unggah CSV Peserta** — import participants for that specific kegiatan,
   using the column set already in use for real BPIP data (`docs/peserta.csv`).
3. **Unggah ZIP Sertifikat** — upload certificate PDFs for that same
   kegiatan, matched to peserta by email (folder + `manifest.csv`, unchanged
   from the existing implementation), but now scoped to this kegiatan's
   peserta only.

This also introduces a persistent "Kegiatan" list in the admin UI so a
kegiatan can be reopened later to continue or redo steps 2–3 (certificates
are often produced in a separate PDF-design step after the roster is
finalized, so step 3 may happen in a different session than steps 1–2).

## Decisions (confirmed with user)

- **Kegiatan list is required.** Admin nav gets a "Kegiatan" tab (list +
  "Kegiatan Baru" button) replacing the current tab that jumps straight
  into upload. Clicking a kegiatan opens `/admin/kegiatan/[id]`, which
  hosts steps 2 and 3 scoped to that kegiatan, reopenable any time.
- **The "nomor" (certificate number) concept is removed entirely.**
  `sertifikat.nomor` and its unique constraint are dropped from the schema
  and from every consumer (public certificate card, admin table search/sort,
  CSV upsert key, manual match). `(kegiatanId, nik)` becomes the natural key
  for "is this the same participant" during CSV re-import; `sertifikat.id`
  remains the identifier for downloads, previews, and manual actions.
- **CSV column set matches `docs/peserta.csv` exactly**, semicolon-delimited:
  `nama_peserta;Username;Email;Provinsi;Kabupaten / kota;Asal instansi`.
  `Username` holds a NIK-shaped value and is stored as `nik`. Since the CSV
  is now scoped to one kegiatan via the URL, it no longer carries
  kegiatan/tanggal/jam/nomor columns at all.
- **Peserta domicile fields are separate from kegiatan location fields.**
  `Provinsi`/`Kabupaten / kota` in the CSV describe the participant's home
  region; `kegiatan.provinsi`/`kegiatan.kabupatenKota` (step 1) describe
  where the training itself took place. Both are stored, independently.
- **New kegiatan columns are nullable at the DB level**, to avoid a backfill
  migration for existing rows, but are required by the step-1 form's
  client/server validation for every new kegiatan going forward.
- **"Lulus" / "tidak lulus" counts are derived, not stored.** A peserta row
  with `status = 'siap'` (has a matched certificate file) counts as lulus;
  `'belum'` counts as tidak lulus. No `jml_lulus`/`jml_tidak_lulus` columns
  are added — the kegiatan detail page computes these with a `COUNT`.
- **Province/city dropdown data**: port
  `C:\laragon\www\diklatdash\resources\data\wilayah-indonesia.json` verbatim
  into this project (`src/data/wilayah-indonesia.json`), shape
  `{ "Provinsi": ["KAB/KOTA", ...] }`. Used only for the step-1 form's
  Provinsi → Kab/Kota dependent dropdowns — CSV peserta domicile values stay
  free text (no validation against this list).
- **Steps 2 and 3 are staged, not auto-submitted.** Selecting/dropping a
  file only stages it (client-side preview); an explicit **Kirim** button
  performs the upload/import, and **Batal** discards the staged file with
  no server call. This replaces the current "select file → immediately
  uploads" behavior in `UploadTab`.
- **Logo upload** (jpg/png, ≤1MB, 132×132px recommended) is validated for
  type and size (hard limits); the 132×132px dimension is advisory only
  (shown as a label, not enforced), since forcing pixel-perfect crops on
  arbitrary organization logos would be overly strict without a cropping
  tool. Uploaded via the existing Vercel Blob client-upload pattern.

## Data model

### `kegiatan` — new columns

| column | type | notes |
|---|---|---|
| tahun | integer, nullable | selected via dropdown in the form |
| segmen | enum('Aparatur Negara','Orsospol','KML','Purnapaskibraka'), nullable | |
| tanggal_mulai | date, nullable | replaces the old single `tanggal_terbit` concept |
| tanggal_selesai | date, nullable | public "Terbit" display now shows this date |
| provinsi | text, nullable | kegiatan's own location |
| kabupaten_kota | text, nullable | kegiatan's own location |
| mode_penyelenggaraan | enum('Luring','Daring','Hybrid'), nullable | optional field |
| logo_url | text, nullable | Vercel Blob URL |

`nama` and `jumlah_jp` already exist and are reused as-is (jumlah_jp = "Jam
Pelajaran" from the form). `tanggal_terbit` is dropped in favor of
`tanggal_mulai`/`tanggal_selesai`; every current reader of `tanggalTerbit`
(search results, `CertificateCard`, admin table sort) switches to
`tanggalSelesai`.

### `sertifikat` (kept as the peserta table; UI copy renames "Penerima" → "Peserta")

- **Drop**: `nomor` column and its unique constraint, entirely.
- **Add**: `provinsi` (text, nullable), `kabupatenKota` (text, nullable),
  `asalInstansi` (text, nullable) — participant domicile/institution from
  the CSV.
- `email` (added in the previous ZIP-matching change) stays, now also used
  to scope matching to the current kegiatan (`WHERE kegiatan_id = ? AND
  email = ?` instead of a global email lookup).
- Upsert key for CSV import becomes `(kegiatanId, nik)`.

### New static data

`src/data/wilayah-indonesia.json` — ported verbatim from the Laravel
project, used for the step-1 form's Provinsi/Kab-kota dropdowns.

## Admin navigation & UI flow

- `AdminTabs` changes from `{ Unggah Berkas, Data Penerima, Log Unduhan }`
  to `{ Kegiatan, Data Peserta, Log Unduhan }`.
- **Kegiatan tab**: list of kegiatan (nama, tahun, segmen, tanggal, jumlah
  peserta, lulus/tidak-lulus counts, status chip) with a "Kegiatan Baru"
  button. Each row links to `/admin/kegiatan/[id]`.
- **`/admin/kegiatan/[id]`**: detail page showing kegiatan info (with logo)
  plus the step-2 (CSV) and step-3 (ZIP) upload cards, both scoped to this
  `id`. This is where `UploadTab`'s current CSV/ZIP UI moves to, adapted for
  staging + Kirim/Batal and kegiatan-scoping.
- **`/admin/kegiatan/baru`** (or a modal from the Kegiatan tab): the step-1
  form. On successful submit, redirects to `/admin/kegiatan/[new id]`.
- **Data Peserta tab**: same table as today (`PenerimaTable` → renamed
  `PesertaTable`), search/sort/status filter unchanged in spirit; "nomor"
  removed from the searchable/sortable columns, "Kegiatan" column stays.

## Step 1 — Buat Kegiatan

Form fields, all client+server validated as required unless noted:

- Tahun — dropdown (reasonable year range, current year default)
- Segmen kegiatan — dropdown (Aparatur Negara / Orsospol / KML / Purnapaskibraka)
- Nama kegiatan — text
- Tanggal mulai / Tanggal berakhir — date pickers, berakhir ≥ mulai
- Jam pelajaran — number
- Provinsi kegiatan — dropdown (from `wilayah-indonesia.json` keys)
- Kab/kota kegiatan — dependent dropdown (options from the chosen provinsi)
- Mode Penyelenggaraan — dropdown, **optional** (Luring / Daring / Hybrid)
- Logo Penyelenggara — drop-zone/click upload, jpg/png, ≤1MB, preview +
  remove before submit; 132×132px shown as a recommendation

Buttons: **Buat Kegiatan** (submits the whole form; the `kegiatan` row is
only written on success — no partial writes) and **Batal** (returns to the
Kegiatan list, nothing saved). This form is a normal submit, not a staged
file upload, so it does not use the Kirim/Batal file-staging pattern below
(only the embedded logo field has its own local preview/remove control).

## Step 2 — Unggah CSV Peserta

- Endpoint scoped to the kegiatan: `POST /api/admin/kegiatan/[id]/import/csv`.
- Expected format, matching `docs/peserta.csv`:
  ```
  nama_peserta;Username;Email;Provinsi;Kabupaten / kota;Asal instansi
  ```
  Header matching is case-insensitive and whitespace-trimmed. Required:
  `nama_peserta`, `Username` (→ nik), `Email`. Optional (blank allowed):
  `Provinsi`, `Kabupaten / kota`, `Asal instansi`.
- Import upserts by `(kegiatanId, nik)` — re-uploading the same CSV for the
  same kegiatan updates existing rows rather than duplicating them, and (as
  today) never clobbers a row that's already `siap`.
- UI: selecting/dropping a `.csv` file stages it and shows a lightweight
  client-side preview (row count, obvious header problems) without writing
  anything. **Kirim** posts the raw CSV text to the endpoint above and shows
  the resulting imported/error counts (same summary style as today).
  **Batal** clears the staged file.
- Template download (`peserta_template.csv`) updated to the new columns.

## Step 3 — Unggah ZIP Sertifikat

- Endpoint scoped to the kegiatan: `POST /api/admin/kegiatan/[id]/import/zip`.
- Archive format is **unchanged** from the current implementation: required
  root `manifest.csv` (`folder;email`, `;`-delimited), one folder per
  participant, first file alphabetically if a folder has more than one.
- The only functional change: `matchEmailToCandidate`'s candidate pool is
  now `sertifikat` rows filtered to `kegiatanId = [id]`, not the whole
  table. Same for the manual-match fallback.
- Manual match for unmatched folders: since "nomor" no longer exists, the
  existing `window.prompt`-for-nomor flow is replaced by a searchable
  picker over this kegiatan's own peserta (by nama/nik). New endpoint
  shape: `POST /api/admin/kegiatan/[id]/import/match` with
  `{ pesertaId, blobUrl, fileSize }` instead of `{ nomor, ... }`.
- UI staging/Kirim/Batal mirrors step 2: drop/select stages the archive
  (filename + size shown), Kirim uploads to Blob and triggers processing,
  Batal discards the staged file before any upload happens.
- `manifest_template.csv` is unaffected by this change (format didn't
  change) but its download button moves into this scoped step-3 card.

## Migration & compatibility

- New `kegiatan` columns are nullable in the DB (no backfill needed for
  existing dev rows); required-ness is enforced only by the step-1 form.
- `sertifikat.nomor` and its unique index are dropped outright. This is
  pre-launch dev/test data only — no production data is affected.
- `tanggal_terbit` is dropped from `kegiatan` in favor of
  `tanggal_mulai`/`tanggal_selesai`; all current readers of `tanggalTerbit`
  (public search result cards, admin table default sort/column, PDF
  preview metadata if any) switch to `tanggalSelesai`.

## Testing impact

Nearly every existing integration test and fixture currently relies on
`nomor` as a globally-unique key to avoid collisions across concurrently
running test files (`tests/integration/*.test.ts`, `tests/fixtures/*`,
`tests/e2e/admin-flow.spec.ts`). All of these need rewriting to:

- Drop `nomor` from every fixture/insert.
- Use `(kegiatanId, nik)` — each test already creates its own fresh
  `kegiatan` row, so this remains collision-safe.
- Update `parseParticipantCsv`/CSV route tests for the new column set and
  per-kegiatan scoping (no more `kegiatan`/`tanggal_terbit`/`jam` columns in
  the CSV body).
- Update ZIP integration tests to scope candidate matching to a specific
  `kegiatanId` and to exercise the new peserta-picker manual-match shape.
- Rewrite `tests/e2e/admin-flow.spec.ts` to: log in → create a kegiatan via
  the step-1 form → land on its detail page → stage+Kirim the CSV → stage+
  Kirim the ZIP → verify a peserta row is `Siap` in the Data Peserta tab.
- New unit tests: step-1 form validation (required fields, tanggal
  ordering, logo type/size), CSV header parsing for the new column set,
  scoped email-matching logic.

## Out of scope (explicitly deferred)

- Hard pixel-dimension enforcement on the logo upload.
- Validating CSV Provinsi/Kabupaten values against `wilayah-indonesia.json`
  (kept free-text, as the source data already is).
- Any change to the public search/download flow beyond the
  `tanggalTerbit` → `tanggalSelesai` rename.
- Storing `jml_lulus`/`jml_tidak_lulus` as persisted columns.
