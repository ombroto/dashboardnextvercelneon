'use server';

import { redirect } from 'next/navigation';
import { normalizeNik } from '@/lib/nik';

export async function searchAction(kegiatanId: number, rawNik: string): Promise<void> {
  const nik = normalizeNik(rawNik);

  if (!kegiatanId || nik.length < 10) {
    redirect('/?error=' + encodeURIComponent('Pilih kegiatan diklat dan masukkan NIK yang valid.'));
  }

  redirect(`/hasil/${nik}?kegiatanId=${kegiatanId}`);
}
