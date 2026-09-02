import { test, expect } from '@playwright/test';

test('search by NIK, view results, download a ready certificate', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('NIK atau Nama Lengkap').fill('8888888888888888');
  await page.getByRole('button', { name: 'Cari' }).click();

  await expect(page).toHaveURL(/\/hasil\/8888888888888888/);
  await expect(page.getByText('Siap')).toBeVisible();

  await page.getByText('Lihat').click();
  await expect(page).toHaveURL(/\/pratinjau\//);
  await expect(page.getByText('Unduh PDF')).toBeVisible();
});
