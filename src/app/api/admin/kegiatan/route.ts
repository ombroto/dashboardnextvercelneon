import { NextResponse } from 'next/server';
import { createKegiatan, type CreateKegiatanInput } from '@/lib/kegiatan';

const SEGMEN_VALUES = ['Aparatur Negara', 'Orsospol', 'KML', 'Purnapaskibraka'] as const;
const MODE_VALUES = ['Luring', 'Daring', 'Hybrid'] as const;

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const errors: string[] = [];

  const nama = typeof body.nama === 'string' ? body.nama.trim() : '';
  if (!nama) errors.push('Nama kegiatan wajib diisi');

  const jumlahJp = Number(body.jumlahJp);
  if (!Number.isFinite(jumlahJp) || jumlahJp <= 0) errors.push('Jam pelajaran harus berupa angka positif');

  const tahun = Number(body.tahun);
  if (!Number.isInteger(tahun)) errors.push('Tahun wajib dipilih');

  const segmen = body.segmen as string;
  if (!SEGMEN_VALUES.includes(segmen as (typeof SEGMEN_VALUES)[number])) errors.push('Segmen kegiatan wajib dipilih');

  const tanggalMulai = typeof body.tanggalMulai === 'string' ? body.tanggalMulai : '';
  const tanggalSelesai = typeof body.tanggalSelesai === 'string' ? body.tanggalSelesai : '';
  if (!tanggalMulai) errors.push('Tanggal mulai wajib diisi');
  if (!tanggalSelesai) errors.push('Tanggal berakhir wajib diisi');
  if (tanggalMulai && tanggalSelesai && tanggalSelesai < tanggalMulai) errors.push('Tanggal berakhir harus setelah tanggal mulai');

  const provinsi = typeof body.provinsi === 'string' ? body.provinsi.trim() : '';
  if (!provinsi) errors.push('Provinsi kegiatan wajib diisi');

  const kabupatenKota = typeof body.kabupatenKota === 'string' ? body.kabupatenKota.trim() : '';
  if (!kabupatenKota) errors.push('Kab/kota kegiatan wajib diisi');

  const modePenyelenggaraanRaw = body.modePenyelenggaraan;
  const modePenyelenggaraan = MODE_VALUES.includes(modePenyelenggaraanRaw as (typeof MODE_VALUES)[number])
    ? (modePenyelenggaraanRaw as (typeof MODE_VALUES)[number])
    : undefined;

  const logoUrl = typeof body.logoUrl === 'string' ? body.logoUrl : undefined;

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const input: CreateKegiatanInput = {
    nama,
    jumlahJp,
    tahun,
    segmen: segmen as CreateKegiatanInput['segmen'],
    tanggalMulai,
    tanggalSelesai,
    provinsi,
    kabupatenKota,
    modePenyelenggaraan,
    logoUrl,
  };

  const { id } = await createKegiatan(input);
  return NextResponse.json({ id });
}
