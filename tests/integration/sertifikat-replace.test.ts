import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { PUT } from '@/app/api/admin/sertifikat/[id]/route';

describe('PUT /api/admin/sertifikat/[id]/replace', () => {
  let kegiatanId: number;
  let certId: number;

  beforeAll(async () => {
    const [k] = await db
      .insert(kegiatan)
      .values({ nama: 'Uji Ganti Berkas', tanggalSelesai: '2026-02-01', jumlahJp: 8 })
      .returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({
        kegiatanId,
        nama: 'Peserta Ganti',
        nik: '6666666666660001',
        status: 'belum',
      })
      .returning();
    certId = s.id;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
  });

  it('replaces the file and marks the row siap', async () => {
    const request = new Request(`http://localhost/api/admin/sertifikat/${certId}`, {
      method: 'PUT',
      body: JSON.stringify({ blobUrl: 'https://example.com/replaced.pdf', fileSize: 2048 }),
    });
    const response = await PUT(request, { params: Promise.resolve({ id: String(certId) }) });
    expect(response.status).toBe(200);

    const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, certId));
    expect(row.status).toBe('siap');
    expect(row.fileUrl).toBe('https://example.com/replaced.pdf');
    expect(row.fileSize).toBe(2048);
  });
});
