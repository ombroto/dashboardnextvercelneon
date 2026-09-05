import { test, expect } from '@playwright/test';
import path from 'node:path';

test('admin logs in, creates a kegiatan, imports CSV then ZIP, and sees a siap row', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Email Institusi').fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel('Kata Sandi').fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).toHaveURL('/admin', { timeout: 15000 });

  await expect(page.locator('header').getByText('Masuk')).toHaveCount(0);
  const userMenuButton = page.locator('header button[aria-haspopup="menu"]');
  await expect(userMenuButton).toBeVisible();

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

  await userMenuButton.click();
  await page.locator('[role="menu"]').getByText('Keluar').click();
  await expect(page).toHaveURL('/admin/login', { timeout: 15000 });
});
