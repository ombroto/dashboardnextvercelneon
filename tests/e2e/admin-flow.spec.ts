import { test, expect } from '@playwright/test';
import path from 'node:path';

test('admin logs in, imports CSV then ZIP, and sees a siap row', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email Institusi').fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel('Kata Sandi').fill(process.env.ADMIN_PASSWORD!);
  // Deviation from brief (documented): the brief used page.getByText('Masuk').click().
  // The login card's <h2>Masuk Admin</h2> heading also contains the substring "Masuk",
  // so getByText('Masuk') is a strict-mode violation (2 matches) -- the same class of
  // issue Task 26 hit with getByText('Cari') against "Cari sertifikat Anda". Fixed with
  // the more specific role locator, same fix pattern as Task 26.
  await page.getByRole('button', { name: 'Masuk' }).click();

  // Deviation from brief (documented): default 5s expect timeout was too short for the
  // real credentials round trip (DB lookup + bcrypt compare + NextAuth JWT/redirect) on
  // a cold dev-server route compile; bumped to 15s to avoid flaking on first-hit latency.
  await expect(page).toHaveURL('/admin', { timeout: 15000 });

  await page.setInputFiles('input[accept=".csv"]', path.join(__dirname, '../fixtures/sertifikat-test.csv'));
  await expect(page.getByText(/baris berhasil diimpor/)).toBeVisible();

  await page.setInputFiles('input[accept=".zip"]', path.join(__dirname, '../fixtures/sertifikat-test.zip'));
  // Deviation from brief (documented): default 5s expect timeout was too short for a
  // real ZIP upload to Vercel Blob + server-side download/unzip/match round trip over
  // the network; bumped to 30s so the assertion doesn't flake on real I/O latency.
  await expect(page.getByText(/berkas cocok otomatis/)).toBeVisible({ timeout: 30000 });

  // This fixture's email ('e2e.unique@example.com') is deliberately unique across the
  // dev database, so the automatic email match in matchEmailToCandidate
  // (src/lib/zip-match.ts) is unambiguous and this exercises the spec's actual
  // critical path: ZIP upload -> manifest.csv email match -> row becomes siap.
  await expect(page.getByText(/^1 berkas cocok otomatis/)).toBeVisible();

  await page.goto('/admin?tab=penerima');
  // Deviation from brief (documented): a bare page-wide getByText('Siap') is also a
  // strict-mode violation here -- Task 26's standing e2e fixture row is also status
  // 'siap' and always present in this same unfiltered table, so more than one "Siap"
  // badge is visible at once. Scoped to this fixture's own row instead, which both
  // avoids the strict-mode violation and actually verifies the intended row (rather
  // than passing vacuously off some other row's badge).
  const row = page.locator('tr', { hasText: 'Peserta ZIP E2E' });
  await expect(row).toBeVisible();
  await expect(row.getByText('Siap')).toBeVisible();
});
