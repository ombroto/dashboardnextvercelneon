import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { put, head } from '@vercel/blob';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { createKegiatan, listKegiatan, getKegiatanById, updateKegiatan, deleteKegiatan } from '@/lib/kegiatan';

describe('kegiatan lib', () => {
  let createdId: number | undefined;

  afterEach(async () => {
    if (createdId) {
      await db.delete(kegiatan).where(eq(kegiatan.id, createdId));
      createdId = undefined;
    }
  });

  it('creates a kegiatan with all step-1 fields', async () => {
    const { id } = await createKegiatan({
      nama: 'Uji Lib Kegiatan',
      jumlahJp: 16,
      tahun: 2026,
      segmen: 'Aparatur Negara',
      tanggalMulai: '2026-03-01',
      tanggalSelesai: '2026-03-05',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
      modePenyelenggaraan: 'Luring',
    });
    createdId = id;

    const [row] = await db.select().from(kegiatan).where(eq(kegiatan.id, id));
    expect(row.nama).toBe('Uji Lib Kegiatan');
    expect(row.segmen).toBe('Aparatur Negara');
    expect(row.tanggalMulai).toBe('2026-03-01');
  });

  it('lists kegiatan with derived total/lulus peserta counts', async () => {
    const { id } = await createKegiatan({
      nama: 'Uji Lib Kegiatan List',
      jumlahJp: 8,
      tahun: 2026,
      segmen: 'Orsospol',
      tanggalMulai: '2026-04-01',
      tanggalSelesai: '2026-04-02',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
    });
    createdId = id;

    await db.insert(sertifikat).values([
      { kegiatanId: id, nama: 'Peserta Lulus', nik: '9999999999999901', status: 'siap' },
      { kegiatanId: id, nama: 'Peserta Belum', nik: '9999999999999902', status: 'belum' },
    ]);

    const list = await listKegiatan();
    const found = list.find((k) => k.id === id);
    expect(found?.totalPeserta).toBe(2);
    expect(found?.jumlahLulus).toBe(1);
  });

  it('gets a kegiatan by id with counts, or null if missing', async () => {
    const { id } = await createKegiatan({
      nama: 'Uji Lib Kegiatan Detail',
      jumlahJp: 8,
      tahun: 2026,
      segmen: 'KML',
      tanggalMulai: '2026-05-01',
      tanggalSelesai: '2026-05-02',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
    });
    createdId = id;

    const detail = await getKegiatanById(id);
    expect(detail?.nama).toBe('Uji Lib Kegiatan Detail');
    expect(detail?.totalPeserta).toBe(0);
    expect(detail?.jumlahLulus).toBe(0);

    expect(await getKegiatanById(-1)).toBeNull();
  });

  it('updates an existing kegiatan', async () => {
    const { id } = await createKegiatan({
      nama: 'Uji Lib Kegiatan Update',
      jumlahJp: 8,
      tahun: 2026,
      segmen: 'KML',
      tanggalMulai: '2026-06-01',
      tanggalSelesai: '2026-06-02',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
    });
    createdId = id;

    await updateKegiatan(id, {
      nama: 'Uji Lib Kegiatan Update (diubah)',
      jumlahJp: 16,
      tahun: 2027,
      segmen: 'Orsospol',
      tanggalMulai: '2027-01-01',
      tanggalSelesai: '2027-01-05',
      provinsi: 'DKI Jakarta',
      kabupatenKota: 'JAKARTA PUSAT',
      modePenyelenggaraan: 'Daring',
    });

    const [row] = await db.select().from(kegiatan).where(eq(kegiatan.id, id));
    expect(row.nama).toBe('Uji Lib Kegiatan Update (diubah)');
    expect(row.tahun).toBe(2027);
    expect(row.segmen).toBe('Orsospol');
    expect(row.modePenyelenggaraan).toBe('Daring');
  });

  it('keeps the existing logo when logoUrl is omitted from the update', async () => {
    const { id } = await createKegiatan({
      nama: 'Uji Lib Kegiatan Logo Tetap',
      jumlahJp: 8,
      tahun: 2026,
      segmen: 'KML',
      tanggalMulai: '2026-06-01',
      tanggalSelesai: '2026-06-02',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
      logoUrl: 'https://example.com/logo.png',
    });
    createdId = id;

    await updateKegiatan(id, {
      nama: 'Uji Lib Kegiatan Logo Tetap',
      jumlahJp: 8,
      tahun: 2026,
      segmen: 'KML',
      tanggalMulai: '2026-06-01',
      tanggalSelesai: '2026-06-02',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
    });

    const [row] = await db.select().from(kegiatan).where(eq(kegiatan.id, id));
    expect(row.logoUrl).toBe('https://example.com/logo.png');
  });

  it('clears the logo when logoUrl is explicitly null', async () => {
    const { id } = await createKegiatan({
      nama: 'Uji Lib Kegiatan Logo Hapus',
      jumlahJp: 8,
      tahun: 2026,
      segmen: 'KML',
      tanggalMulai: '2026-06-01',
      tanggalSelesai: '2026-06-02',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
      logoUrl: 'https://example.com/logo2.png',
    });
    createdId = id;

    await updateKegiatan(id, {
      nama: 'Uji Lib Kegiatan Logo Hapus',
      jumlahJp: 8,
      tahun: 2026,
      segmen: 'KML',
      tanggalMulai: '2026-06-01',
      tanggalSelesai: '2026-06-02',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
      logoUrl: null,
    });

    const [row] = await db.select().from(kegiatan).where(eq(kegiatan.id, id));
    expect(row.logoUrl).toBeNull();
  });

  it('deletes the kegiatan row, cascades to its sertifikat, and cleans up blobs', async () => {
    const logoBlob = await put('test-uploads/kegiatan-logo-test.png', Buffer.from('logo'), { access: 'public', addRandomSuffix: true });
    const { id } = await createKegiatan({
      nama: 'Uji Lib Kegiatan Hapus',
      jumlahJp: 8,
      tahun: 2026,
      segmen: 'KML',
      tanggalMulai: '2026-07-01',
      tanggalSelesai: '2026-07-02',
      provinsi: 'Jawa Tengah',
      kabupatenKota: 'KOTA SEMARANG',
      logoUrl: logoBlob.url,
    });

    const fileBlob = await put('test-uploads/kegiatan-sertifikat-test.pdf', Buffer.from('sertifikat'), { access: 'public', addRandomSuffix: true });
    const [s] = await db
      .insert(sertifikat)
      .values({ kegiatanId: id, nama: 'Peserta Hapus Kegiatan', nik: '8888888888888888', status: 'siap', fileUrl: fileBlob.url })
      .returning();

    await deleteKegiatan(id);

    expect(await db.select().from(kegiatan).where(eq(kegiatan.id, id))).toHaveLength(0);
    expect(await db.select().from(sertifikat).where(eq(sertifikat.id, s.id))).toHaveLength(0);
    await expect(head(logoBlob.url)).rejects.toThrow();
    await expect(head(fileBlob.url)).rejects.toThrow();
  }, 30000);
});
