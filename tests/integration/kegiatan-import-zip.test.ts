import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { put } from '@vercel/blob';
import { POST } from '@/app/api/admin/kegiatan/[id]/import/zip/route';

describe('POST /api/admin/kegiatan/[id]/import/zip', () => {
  let kegiatanId: number;
  let otherKegiatanId: number;
  let certId: number;
  let archiveBlobUrl: string;

  beforeAll(async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji ZIP Scoped', jumlahJp: 8 }).returning();
    kegiatanId = k.id;
    const [s] = await db
      .insert(sertifikat)
      .values({ kegiatanId, nama: 'Peserta ZIP Scoped', nik: '5555555555555555', email: 'e2e.unique@example.com', status: 'belum' })
      .returning();
    certId = s.id;

    // Same email under a DIFFERENT kegiatan -- must NOT be matched when
    // importing into `kegiatanId`, proving matching is kegiatan-scoped.
    const [k2] = await db.insert(kegiatan).values({ nama: 'Uji ZIP Scoped Lain', jumlahJp: 8 }).returning();
    otherKegiatanId = k2.id;
    await db
      .insert(sertifikat)
      .values({ kegiatanId: otherKegiatanId, nama: 'Peserta Lain', nik: '5555555555555556', email: 'e2e.unique@example.com', status: 'belum' });

    const zipBuffer = readFileSync('tests/fixtures/sertifikat-test.zip');
    const blob = await put('test-uploads/sertifikat-test-scoped.zip', zipBuffer, { access: 'public', addRandomSuffix: true });
    archiveBlobUrl = blob.url;
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
    await db.delete(kegiatan).where(eq(kegiatan.id, otherKegiatanId));
  });

  it('matches by email only within this kegiatan and marks it siap', async () => {
    const request = new Request(`http://localhost/api/admin/kegiatan/${kegiatanId}/import/zip`, {
      method: 'POST',
      body: JSON.stringify({ blobUrl: archiveBlobUrl }),
    });
    const response = await POST(request, { params: Promise.resolve({ id: String(kegiatanId) }) });
    const body = await response.json();

    expect(body.matched).toBe(1);
    expect(body.unmatched).toHaveLength(1);
    expect(body.unmatched[0].folder).toBe('peserta-tidak-cocok');

    const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, certId));
    expect(row.status).toBe('siap');

    const [otherRow] = await db.select().from(sertifikat).where(eq(sertifikat.kegiatanId, otherKegiatanId));
    expect(otherRow.status).toBe('belum');
  }, 30000);
});
