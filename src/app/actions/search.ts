'use server';

import { redirect } from 'next/navigation';
import { normalizeNik } from '@/lib/nik';

export async function searchAction(rawQuery: string): Promise<void> {
  const query = rawQuery.trim();
  if (!query) {
    redirect('/?error=' + encodeURIComponent('Masukkan NIK atau nama terlebih dahulu.'));
  }

  const digits = normalizeNik(query);
  if (digits.length >= 10) {
    redirect(`/hasil/${digits}`);
  }

  redirect(`/hasil?nama=${encodeURIComponent(query)}`);
}
