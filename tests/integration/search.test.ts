import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { searchByNik, searchByName, getCertificateById, searchKegiatanByName } from '@/lib/search';
import { eq } from 'drizzle-orm';

describe('search', () => {
  let kegiatanId: number;
  let secondKegiatanId: number;

  beforeAll(async () => {
    const [k] = await db
      .insert(kegiatan)
      .values({ nama: 'Uji Coba Diklat', tanggalSelesai: '2026-01-01', jumlahJp: 16 })
      .returning();
    kegiatanId = k.id;
    await db.insert(sertifikat).values({
      kegiatanId,
      nama: 'Nama Uji Coba',
      nik: '1111111111111111',
      status: 'belum',
    });

    // A second kegiatan the same person also has a certificate for, so
    // kegiatan-scoped search has something real to disambiguate between.
    const [k2] = await db
      .insert(kegiatan)
      .values({ nama: 'Uji Coba Diklat Lanjutan', tanggalSelesai: '2026-02-01', jumlahJp: 24 })
      .returning();
    secondKegiatanId = k2.id;
    await db.insert(sertifikat).values({
      kegiatanId: secondKegiatanId,
      nama: 'Nama Uji Coba',
      nik: '1111111111111111',
      status: 'belum',
    });
  });

  afterAll(async () => {
    await db.delete(kegiatan).where(eq(kegiatan.id, kegiatanId));
    await db.delete(kegiatan).where(eq(kegiatan.id, secondKegiatanId));
  });

  it('finds a person by exact NIK, across all their kegiatan', async () => {
    const result = await searchByNik('1111111111111111');
    expect(result?.nama).toBe('Nama Uji Coba');
    expect(result?.certificates).toHaveLength(2);
  });

  it('scopes to one kegiatan when a kegiatanId is given', async () => {
    const result = await searchByNik('1111111111111111', kegiatanId);
    expect(result?.certificates).toHaveLength(1);
    expect(result?.certificates[0].kegiatanNama).toBe('Uji Coba Diklat');
  });

  it('returns null when the NIK has no certificate for the given kegiatanId', async () => {
    const otherKegiatan = await db.insert(kegiatan).values({ nama: 'Uji Tidak Terkait', tanggalSelesai: '2026-01-01', jumlahJp: 8 }).returning();
    const result = await searchByNik('1111111111111111', otherKegiatan[0].id);
    expect(result).toBeNull();
    await db.delete(kegiatan).where(eq(kegiatan.id, otherKegiatan[0].id));
  });

  it('finds a person by partial name', async () => {
    const results = await searchByName('Uji Coba');
    expect(results.some((p) => p.nik === '1111111111111111')).toBe(true);
  });

  it('returns null for an unknown NIK', async () => {
    expect(await searchByNik('0000000000000000')).toBeNull();
  });

  it('fetches a single certificate by id with file info', async () => {
    const person = await searchByNik('1111111111111111');
    const certId = person!.certificates[0].id;
    const detail = await getCertificateById(certId);
    expect(detail?.nama).toBe('Nama Uji Coba');
    expect(detail?.fileUrl).toBeNull();
  });

  it('finds kegiatan by partial name once at least 4 characters are given', async () => {
    const results = await searchKegiatanByName('Uji Coba Diklat');
    expect(results.some((k) => k.id === kegiatanId)).toBe(true);
    expect(results.some((k) => k.id === secondKegiatanId)).toBe(true);
  });

  it('does not search kegiatan by name under 4 characters', async () => {
    expect(await searchKegiatanByName('Uji')).toEqual([]);
  });
});
