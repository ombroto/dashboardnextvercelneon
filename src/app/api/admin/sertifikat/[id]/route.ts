import { NextResponse } from 'next/server';
import { deleteSertifikat } from '@/lib/search';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteSertifikat(Number(id));
  return NextResponse.json({ ok: true });
}
