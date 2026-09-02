'use server';

import { redirect } from 'next/navigation';
import { searchByName } from '@/lib/search';
import { maskNik } from '@/lib/nik';

export async function selectPersonAction(formData: FormData): Promise<void> {
  const nama = formData.get('nama');
  const index = Number(formData.get('index'));
  const expectedMaskedNik = formData.get('expectedMaskedNik');

  if (typeof nama !== 'string' || typeof expectedMaskedNik !== 'string') {
    redirect('/?error=' + encodeURIComponent('Pilihan tidak valid, silakan cari ulang.'));
  }

  const people = await searchByName(nama);
  const person = people[index];

  if (!person || maskNik(person.nik) !== expectedMaskedNik) {
    redirect('/?error=' + encodeURIComponent('Data berubah, silakan cari ulang.'));
  }

  redirect(`/hasil/${person.nik}`);
}
