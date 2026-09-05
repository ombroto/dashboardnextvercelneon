# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

DiklatDash (branded "DIKLAT BPIP" in the UI) is a Laravel 12 dashboard for managing *diklat* (training) activities: creating/editing training events, importing or manually entering participant pass/fail results, and visualizing totals on an interactive Indonesia map and charts. The UI, validation messages, and most identifiers/columns are in Indonesian.

## Commands

- Install deps: `composer install` && `npm install`
- Run everything for local dev (server + queue listener + vite, concurrently): `composer run dev`
- Or individually: `php artisan serve`, `npm run dev` (Vite), `php artisan queue:listen --tries=1`
- Build frontend assets: `npm run build`
- Run all tests: `composer test` (clears config cache, then `php artisan test`) or `vendor/bin/pest`
- Run a single test file: `vendor/bin/pest tests/Feature/DashboardChartTest.php`
- Run tests matching a name: `vendor/bin/pest --filter="partial name"`
- Format PHP: `vendor/bin/pint`
- Migrate DB: `php artisan migrate` (dev DB is MySQL per `.env`; the test suite instead uses an in-memory SQLite DB configured in `phpunit.xml`, independent of the dev database)

## Architecture

### Core domain tables are not Eloquent models

Only `User`, `Role`, and `Permission` exist as Eloquent models (`app/Models`). The core business tables — `diklat_kegiatan`, `peserta_diklat`, `upload_log` — have no models; they are queried directly with the `DB` facade inside `DiklatKegiatanController` and `DashboardController`. When extending features on these tables, follow the existing raw query-builder style already used there rather than introducing new Eloquent models, unless a refactor is explicitly requested.

### RBAC / permissions

- `Role` \<-\> `Permission` is many-to-many through the `role_permission` pivot.
- `User::hasPermission($key)` checks `$user->role->permissions`.
- `AppServiceProvider::boot()` registers `Gate::before()` to authorize *any* ability check via `hasPermission()`. This means every `->middleware('can:<key>')` route and `@can('<key>')` Blade directive is really checking permission keys, not Laravel policies.
- Permission keys/groups are seeded in `database/migrations/2026_08_23_150000_create_roles_and_permissions_tables.php` (e.g. `kegiatan.lihat`, `kegiatan.tambah`, `kegiatan.edit`, `kegiatan.hapus`, `user.lihat`, `user.kelola`, `role.lihat`, `role.kelola`).
- Three seeded roles: `super_admin` (all permissions), `admin`, `user`. `super_admin` has `is_protected = true`; protected roles can't be edited/deleted (`RoleController`), and the last remaining `super_admin` user can't be reassigned or deleted (`UserController`).

### Auth

- Users authenticate against a custom column `password_hash`, not Laravel's default `password` — wired via `User::getAuthPasswordName()`.
- `AuthController::login()` falls back to a manual `Hash::check()` / raw `hash_equals()` comparison if `Auth::attempt()` fails, to support a legacy password format that predates hashing migration.

### Views: full page + AJAX partial pattern

Views under `resources/views/diklat/` and `resources/views/users/` pair a full page with a `*.partials.*` counterpart (e.g. `diklat/edit.blade.php` + `diklat/partials/edit-form.blade.php`, `diklat/show.blade.php` + `diklat/partials/detail.blade.php`). Controllers check `$request->ajax()` and return the partial for modal/panel rendering instead of the full page. Follow this pattern for new create/edit/detail flows in that area.

### No JS build pipeline for app logic

`resources/js/app.js` only imports `bootstrap.js` (axios setup) — it is not where feature logic lives. Page interactivity (filters, modals, AJAX loads, chart rendering) is written as inline `<script>` blocks directly inside the relevant Blade view (e.g. `dashboard.blade.php`). Chart.js is loaded from a CDN `<script>` tag in the view, not via npm. Follow this convention when adding interactive dashboard/diklat behavior rather than introducing a bundled JS module.

### Location data

`resources/data/wilayah-indonesia.json` (Provinsi → [Kabupaten/Kota]) is the single source of truth used both for form dropdown options and server-side `in:` validation in `DiklatKegiatanController`. `DashboardController::provinceMapIds()` separately maps the Indonesia SVG map's element IDs (`ID-AC`, `ID-SU`, ...) to province names for `resources/views/partials/indonesia-map.blade.php`. Keep both in sync if province/region data changes.

### CSV participant import

`DiklatKegiatanController::parseCsvParticipants()` expects a `;`-delimited CSV with Indonesian headers (`Nama Peserta`, `NIK`, `Email`, `Kelulusan`, `Kode Sertifikat`, `Provinsi`, `Kabupaten/Kota`, `Asal Instansi` — see the `requiredColumns` map; only nama/nik/kelulusan are strictly required). `Kelulusan` accepts several Indonesian/English truthy/falsy tokens (see `normalizeBoolean()`). Provinsi/Kabupaten-Kota values are validated per-row against `wilayah-indonesia.json`.

### Dashboard aggregation

`DashboardController::__invoke()` (single-action controller) builds several independent aggregates per request: the filtered card list, top-line totals, a yearly chart, a segment donut, a monthly chart (for the selected or most recent year), and two Indonesia-map datasets (`kegiatan` = event location counts, `peserta` = participant domicile counts), each further broken down by kabupaten/kota for map drill-down. The `filters` (search, segmen, tahun, provinsi, kabupaten_kota, bulan_selesai, mode_penyelenggaraan) apply to the card list and CSV download; `metrics_year` applies separately to totals/charts/map.

### Security headers

`app/Http/Middleware/SecurityHeaders.php` is globally appended in `bootstrap/app.php` and applies headers from `config/security-headers.php` (plus conditional HSTS) to every response.

## Testing

- Tests use Pest with `RefreshDatabase` (configured in `tests/Pest.php`) against SQLite in-memory, independent of the MySQL dev database.
- Existing Feature tests double as living specs — RBAC/gating: `KegiatanRouteGatingTest`, `KegiatanViewGatingTest`, `RoleManagementTest`, `RolesPermissionsSchemaTest`, `RbacModelsTest`, `UserManagementTest`, `UserSeedingTest`; dashboard/diklat: `DashboardChartTest`, `DashboardFilterAndDownloadTest`, `DashboardMapTest`, `DiklatKegiatanLocationTest`, `DiklatKegiatanScheduleTest`, `PesertaDiklatDomisiliTest`, `SettingsTest`.

## Prior planning docs

`docs/superpowers/specs/` and `docs/superpowers/plans/` contain the design/plan for the already-implemented RBAC (roles & permissions) feature — useful background before extending user/role management further.
