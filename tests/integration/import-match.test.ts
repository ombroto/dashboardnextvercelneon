import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { POST } from '@/app/api/admin/import/match/route';

describe('manual match route', () => {
  let kegiatanId: number;
  let certId: number;

  beforeAll(async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji Match', tanggalTerbit: '2026-02-01', jumlahJp: 8 }).returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({ kegiatanId, nama: 'Peserta Match', nik: '6666666666666666', nomor: 'SK-TEST-2/UJI/2026', status: 'belum' })
      .returning();
    certId = s.id;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('assigns a blob URL to the sertifikat matching the given nomor and marks it siap', async () => {
    const request = new Request('http://localhost/api/admin/import/match', {
      method: 'POST',
      body: JSON.stringify({ nomor: 'SK-TEST-2/UJI/2026', blobUrl: 'https://example.com/manual.pdf', fileSize: 1024 }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);

    const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, certId));
    expect(row.status).toBe('siap');
    expect(row.fileUrl).toBe('https://example.com/manual.pdf');
  });

  it('returns 404 when no sertifikat matches the given nomor', async () => {
    const request = new Request('http://localhost/api/admin/import/match', {
      method: 'POST',
      body: JSON.stringify({ nomor: 'NOMOR-TIDAK-ADA', blobUrl: 'https://example.com/manual.pdf', fileSize: 1024 }),
    });
    const response = await POST(request);
    expect(response.status).toBe(404);
  });
});
