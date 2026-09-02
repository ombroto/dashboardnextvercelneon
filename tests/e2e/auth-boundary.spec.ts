import { test, expect } from '@playwright/test';

test('unauthenticated requests are rejected at the admin boundary', async ({ page, request }) => {
  const pageResponse = await page.goto('/admin');
  expect(pageResponse?.url()).toContain('/admin/login');

  const apiResponse = await request.post('/api/admin/import/csv', { data: {} });
  expect(apiResponse.status()).toBe(401);
});
