import { eq, ilike } from 'drizzle-orm';
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

export async function searchByName(name: string): Promise<PersonResult[]> {
  const rows = await db
    .select({ sertifikat, kegiatan })
    .from(sertifikat)
    .innerJoin(kegiatan, eq(sertifikat.kegiatanId, kegiatan.id))
    .where(ilike(sertifikat.nama, `%${name}%`));

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
