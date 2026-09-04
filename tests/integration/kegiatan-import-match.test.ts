import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { POST } from '@/app/api/admin/kegiatan/[id]/import/match/route';

describe('POST /api/admin/kegiatan/[id]/import/match', () => {
  let kegiatanId: number;
  let otherKegiatanId: number;
  let certId: number;

  beforeAll(async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji Match Scoped', jumlahJp: 8 }).returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({ kegiatanId, nama: 'Peserta Match Scoped', nik: '6666666666666666', status: 'belum' })
      .returning();
    certId = s.id;

    const [k2] = await db.insert(kegiatan).values({ nama: 'Uji Match Scoped Lain', jumlahJp: 8 }).returning();
    otherKegiatanId = k2.id;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
    await db.delete(kegiatan).where(eq(kegiatan.id, otherKegiatanId));
  });

  it('assigns a blob URL to the given peserta and marks it siap', async () => {
    const request = new Request(`http://localhost/api/admin/kegiatan/${kegiatanId}/import/match`, {
      method: 'POST',
      body: JSON.stringify({ pesertaId: certId, blobUrl: 'https://example.com/manual.pdf', fileSize: 1024 }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: String(kegiatanId) }) });
    expect(response.status).toBe(200);

    const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, certId));
    expect(row.status).toBe('siap');
    expect(row.fileUrl).toBe('https://example.com/manual.pdf');
  });

  it('returns 404 when the peserta belongs to a different kegiatan', async () => {
    const request = new Request(`http://localhost/api/admin/kegiatan/${otherKegiatanId}/import/match`, {
      method: 'POST',
      body: JSON.stringify({ pesertaId: certId, blobUrl: 'https://example.com/manual.pdf', fileSize: 1024 }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: String(otherKegiatanId) }) });
    expect(response.status).toBe(404);
  });
});
