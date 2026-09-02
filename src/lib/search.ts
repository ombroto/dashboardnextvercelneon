import { eq, ilike, or, desc } from 'drizzle-orm';
import { db } from '@/db';
import { sertifikat, kegiatan } from '@/db/schema';

export interface CertificateSummary {
  id: number;
  nomor: string;
  kegiatanNama: string;
  tanggalTerbit: string;
  jumlahJp: number;
  status: 'siap' | 'belum';
}

export interface PersonResult {
  nik: string;
  nama: string;
  certificates: CertificateSummary[];
}

type JoinedRow = { sertifikat: typeof sertifikat.$inferSelect; kegiatan: typeof kegiatan.$inferSelect };

function groupToPerson(nik: string, rows: JoinedRow[]): PersonResult | null {
  if (rows.length === 0) return null;
  return {
    nik,
    nama: rows[0].sertifikat.nama,
    certificates: rows.map((r) => ({
      id: r.sertifikat.id,
      nomor: r.sertifikat.nomor,
      kegiatanNama: r.kegiatan.nama,
      tanggalTerbit: r.kegiatan.tanggalTerbit,
      jumlahJp: r.kegiatan.jumlahJp,
      status: r.sertifikat.status,
    })),
  };
}

export async function searchByNik(nik: string): Promise<PersonResult | null> {
  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(eq(sertifikat.nik, nik));
  return groupToPerson(nik, rows);
}

function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export async function searchByName(name: string): Promise<PersonResult[]> {
  const trimmed = name.trim();
  if (trimmed.length < 3) return [];

  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(ilike(sertifikat.nama, `%${escapeIlikePattern(trimmed)}%`))
    .limit(20);

  const byNik = new Map<string, JoinedRow[]>();
  for (const row of rows) {
    const list = byNik.get(row.sertifikat.nik) ?? [];
    list.push(row);
    byNik.set(row.sertifikat.nik, list);
  }

  const people: PersonResult[] = [];
  for (const [nik, personRows] of byNik) {
    const person = groupToPerson(nik, personRows);
    if (person) people.push(person);
  }
  return people;
}

export interface CertificateDetail extends CertificateSummary {
  nama: string;
  nik: string;
  fileUrl: string | null;
  fileSize: number | null;
}

export async function getCertificateById(id: number): Promise<CertificateDetail | null> {
  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(eq(sertifikat.id, id));

  if (rows.length === 0) return null;
  const { sertifikat: s, kegiatan: k } = rows[0];
  return {
    id: s.id,
    nomor: s.nomor,
    kegiatanNama: k.nama,
    tanggalTerbit: k.tanggalTerbit,
    jumlahJp: k.jumlahJp,
    status: s.status,
    nama: s.nama,
    nik: s.nik,
    fileUrl: s.fileUrl,
    fileSize: s.fileSize,
  };
}

import { del } from '@vercel/blob';

export async function deleteSertifikat(id: number): Promise<void> {
  const [row] = await db.select().from(sertifikat).where(eq(sertifikat.id, id));
  if (row?.fileUrl) {
    await del(row.fileUrl).catch(() => undefined);
  }
  await db.delete(sertifikat).where(eq(sertifikat.id, id));
}

export interface AdminSertifikatRow {
  id: number;
  nama: string;
  nik: string;
  nomor: string;
  kegiatanNama: string;
  tanggalTerbit: string;
  status: 'siap' | 'belum';
  unduhCount: number;
}

export async function getAllSertifikat(filter: { q?: string } = {}): Promise<AdminSertifikatRow[]> {
  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(filter.q ? or(ilike(sertifikat.nama, `%${filter.q}%`), ilike(sertifikat.nik, `%${filter.q}%`), ilike(sertifikat.nomor, `%${filter.q}%`)) : undefined)
    .orderBy(desc(sertifikat.createdAt));

  return rows.map((r) => ({
    id: r.sertifikat.id,
    nama: r.sertifikat.nama,
    nik: r.sertifikat.nik,
    nomor: r.sertifikat.nomor,
    kegiatanNama: r.kegiatan.nama,
    tanggalTerbit: r.kegiatan.tanggalTerbit,
    status: r.sertifikat.status,
    unduhCount: r.sertifikat.unduhCount,
  }));
}
