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
    // Defensive cleanup: tests/e2e/admin-flow.spec.ts imports this exact nomor
    // (via tests/fixtures/sertifikat-test.csv, upserted, never deleted afterward)
    // to match this same shared tests/fixtures/sertifikat-test.zip fixture. If that
    // e2e test already ran against this database, a row with this nomor exists and
    // would collide with the direct insert below (nomor is unique) -- so remove it
    // first rather than let this test flake on run order.
    await db.delete(sertifikat).where(eq(sertifikat.nomor, 'SK-E2E-UNIQUE-9001/UJI/2026'));

    const [k] = await db.insert(kegiatan).values({ nama: 'Uji ZIP', tanggalTerbit: '2026-02-01', jumlahJp: 8 }).returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({ kegiatanId, nama: 'Peserta ZIP', nik: '5555555555555555', nomor: 'SK-E2E-UNIQUE-9001/UJI/2026', status: 'belum' })
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
  }, 30000);
});
