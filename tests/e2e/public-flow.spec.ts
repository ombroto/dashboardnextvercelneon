import { test, expect } from '@playwright/test';

test('search by kegiatan then NIK, view results, download a ready certificate', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Nama Kegiatan Diklat').fill('Diklat E2E Fixture');
  await page.getByText('Diklat E2E Fixture (jangan hapus)').click();
  await page.getByLabel('NIK').fill('8888888888888888');
  await page.getByRole('button', { name: 'Cari' }).click();

  await expect(page).toHaveURL(/\/hasil\/8888888888888888/);
  await expect(page.getByText('Siap')).toBeVisible();

  await page.getByText('Lihat').click();
  await expect(page).toHaveURL(/\/pratinjau\//);
  await expect(page.getByText('Unduh PDF')).toBeVisible();
});
