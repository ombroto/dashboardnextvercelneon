import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { unduhanLog, sertifikat } from '@/db/schema';

export async function GET() {
  const rows = await db
    .select({ waktu: unduhanLog.waktu, nama: sertifikat.nama, ip: unduhanLog.ip })
    .from(unduhanLog)
    .innerJoin(sertifikat, eq(unduhanLog.sertifikatId, sertifikat.id))
    .orderBy(desc(unduhanLog.waktu));

  const header = 'waktu,nama,ip\n';
  const body = rows.map((r) => `${r.waktu.toISOString()},"${r.nama}",${r.ip}`).join('\n');

  return new NextResponse(header + body, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="log-unduhan.csv"',
    },
  });
}
