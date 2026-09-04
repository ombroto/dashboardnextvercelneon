// tests/integration/schema-kegiatan-peserta.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';

describe('kegiatan/sertifikat schema', () => {
  let kegiatanId: number | undefined;

  afterEach(async () => {
    if (kegiatanId) {
      await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
      kegiatanId = undefined;
    }
  });

  it('stores the new kegiatan step-1 fields', async () => {
    const [row] = await db
      .insert(kegiatan)
      .values({
        nama: 'Uji Schema Kegiatan',
        jumlahJp: 16,
        tahun: 2026,
        segmen: 'Aparatur Negara',
        tanggalMulai: '2026-03-01',
        tanggalSelesai: '2026-03-05',
        provinsi: 'Jawa Tengah',
        kabupatenKota: 'KOTA SEMARANG',
        modePenyelenggaraan: 'Luring',
        logoUrl: 'https://example.com/logo.png',
      })
      .returning();
    kegiatanId = row.id;

    expect(row.tahun).toBe(2026);
    expect(row.segmen).toBe('Aparatur Negara');
    expect(row.tanggalMulai).toBe('2026-03-01');
    expect(row.tanggalSelesai).toBe('2026-03-05');
    expect(row.modePenyelenggaraan).toBe('Luring');
    expect(row.logoUrl).toBe('https://example.com/logo.png');
  });

  it('allows a kegiatan with only the pre-existing required fields (no backfill needed)', async () => {
    const [row] = await db.insert(kegiatan).values({ nama: 'Uji Schema Minimal', jumlahJp: 8 }).returning();
    kegiatanId = row.id;
    expect(row.tahun).toBeNull();
    expect(row.logoUrl).toBeNull();
  });

  it('stores the new sertifikat peserta-domicile fields and has no nomor column', async () => {
    const [k] = await db.insert(kegiatan).values({ nama: 'Uji Schema Peserta', jumlahJp: 8 }).returning();
    kegiatanId = k.id;

    const [row] = await db
      .insert(sertifikat)
      .values({
        kegiatanId: k.id,
        nama: 'Peserta Schema',
        nik: '1010101010101010',
        email: 'peserta.schema@example.com',
        provinsi: 'Jawa Tengah',
        kabupatenKota: 'KOTA SEMARANG',
        asalInstansi: 'Universitas Diponegoro',
        status: 'belum',
      })
      .returning();

    expect(row.provinsi).toBe('Jawa Tengah');
    expect(row.kabupatenKota).toBe('KOTA SEMARANG');
    expect(row.asalInstansi).toBe('Universitas Diponegoro');
    expect((row as Record<string, unknown>).nomor).toBeUndefined();

    await db.delete(sertifikat).where(eq(sertifikat.id, row.id));
  });
});
