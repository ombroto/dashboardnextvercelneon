import { NextResponse } from 'next/server';
import { createKegiatan, parseKegiatanInput } from '@/lib/kegiatan';

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const { input, errors } = parseKegiatanInput(body);
  if (!input) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const { id } = await createKegiatan(input);
  return NextResponse.json({ id });
}
