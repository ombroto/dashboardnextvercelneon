'use server';

import { redirect } from 'next/navigation';
import { searchByName } from '@/lib/search';

export async function selectPersonAction(formData: FormData): Promise<void> {
  const nama = formData.get('nama') as string;
  const index = Number(formData.get('index'));

  const people = await searchByName(nama);
  const person = people[index];
  if (!person) {
    redirect('/?error=' + encodeURIComponent('Pilihan tidak valid, silakan cari ulang.'));
  }

  redirect(`/hasil/${person.nik}`);
}
