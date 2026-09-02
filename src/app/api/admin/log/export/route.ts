import { NextResponse } from 'next/server';
import { getUnduhanLog } from '@/lib/search';

export async function GET() {
  const rows = await getUnduhanLog();

  const header = 'waktu,nama,ip\n';
  const body = rows.map((r) => `${r.waktu.toISOString()},"${r.nama.replace(/"/g, '""')}",${r.ip}`).join('\n');

  return new NextResponse(header + body, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="log-unduhan.csv"',
    },
  });
}
