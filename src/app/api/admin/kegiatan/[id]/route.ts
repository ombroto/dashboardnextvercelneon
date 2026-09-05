import { NextResponse } from 'next/server';
import { deleteKegiatan, parseKegiatanInput, updateKegiatan } from '@/lib/kegiatan';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const { input, errors } = parseKegiatanInput(body);
  if (!input) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  await updateKegiatan(Number(id), input);
  return NextResponse.json({ id: Number(id) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteKegiatan(Number(id));
  return NextResponse.json({ ok: true });
}
