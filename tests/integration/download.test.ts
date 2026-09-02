import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import { kegiatan, sertifikat, unduhanLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { GET } from '@/app/sertifikat/[id]/download/route';

describe('download route', () => {
  let kegiatanId: number;
  let certId: number;

  beforeAll(async () => {
    const [k] = await db
      .insert(kegiatan)
      .values({ nama: 'Uji Unduh', tanggalTerbit: '2026-01-01', jumlahJp: 8 })
      .returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({
        kegiatanId,
        nama: 'Penerima Uji',
        nik: '2222222222222222',
        nomor: 'TEST-0002/UJI/2026',
        status: 'siap',
        fileUrl: 'https://example.com/fake.pdf',
      })
      .returning();
    certId = s.id;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('redirects to the file URL and logs the download', async () => {
    const request = new Request(`http://localhost/sertifikat/${certId}/download`, {
      headers: { 'x-forwarded-for': '203.0.113.9' },
    });
    const response = await GET(request, { params: Promise.resolve({ id: String(certId) }) });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com/fake.pdf');

    const logs = await db.select().from(unduhanLog).where(eq(unduhanLog.sertifikatId, certId));
    expect(logs).toHaveLength(1);
    expect(logs[0].ip).toBe('203.0.113.9');
  });

  it('returns 404 for a certificate that is not siap', async () => {
    const [k2] = await db
      .insert(kegiatan)
      .values({ nama: 'Uji Belum', tanggalTerbit: '2026-01-01', jumlahJp: 8 })
      .returning();
    const [notReady] = await db
      .insert(sertifikat)
      .values({ kegiatanId: k2.id, nama: 'X', nik: '3333333333333333', nomor: 'TEST-0003/UJI/2026', status: 'belum' })
      .returning();

    const request = new Request(`http://localhost/sertifikat/${notReady.id}/download`);
    const response = await GET(request, { params: Promise.resolve({ id: String(notReady.id) }) });
    expect(response.status).toBe(404);

    await db.delete(kegiatan).where(eq(kegiatan.id, k2.id));
  });
});
