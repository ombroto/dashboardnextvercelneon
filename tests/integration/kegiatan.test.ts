import { describe, it, expect, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { kegiatan, sertifikat } from '@/db/schema';
import { createKegiatan, listKegiatan, getKegiatanById } from '@/lib/kegiatan';

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
});
