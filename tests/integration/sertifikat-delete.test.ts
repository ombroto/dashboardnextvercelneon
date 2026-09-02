import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { DELETE } from '@/app/api/admin/sertifikat/[id]/route';

describe('DELETE /api/admin/sertifikat/[id]', () => {
  let kegiatanId: number;
  let certId: number;

  beforeAll(async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji Hapus', tanggalTerbit: '2026-02-01', jumlahJp: 8 }).returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({ kegiatanId, nama: 'Peserta Hapus', nik: '7777777777777777', nomor: 'SK-TEST-3/UJI/2026', status: 'belum' })
      .returning();
    certId = s.id;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('deletes the sertifikat row', async () => {
    const request = new Request(`http://localhost/api/admin/sertifikat/${certId}`, { method: 'DELETE' });
    const response = await DELETE(request, { params: Promise.resolve({ id: String(certId) }) });
    expect(response.status).toBe(200);

    const rows = await db.select().from(sertifikat).where(eq(sertifikat.id, certId));
    expect(rows).toHaveLength(0);
  });
});
