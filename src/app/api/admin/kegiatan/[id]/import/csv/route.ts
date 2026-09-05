import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sertifikat } from '@/db/schema';
import { parseParticipantCsv } from '@/lib/csv';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kegiatanId = Number(id);
  const { csv } = (await request.json()) as { csv: string };
  const { rows, errors } = parseParticipantCsv(csv);

  let imported = 0;
  for (const row of rows) {
    await db
      .insert(sertifikat)
      .values({
        kegiatanId,
        nama: row.nama,
        nik: row.nik,
        email: row.email,
        provinsi: row.provinsi,
        kabupatenKota: row.kabupatenKota,
        asalInstansi: row.asalInstansi,
        status: 'belum',
      })
      .onConflictDoUpdate({
        target: [sertifikat.kegiatanId, sertifikat.nik],
        set: {
          nama: row.nama,
          email: row.email,
          provinsi: row.provinsi,
          kabupatenKota: row.kabupatenKota,
          asalInstansi: row.asalInstansi,
          updatedAt: new Date(),
        },
      });
    imported += 1;
  }

  return NextResponse.json({ imported, errors });
}
