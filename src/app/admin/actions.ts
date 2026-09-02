'use server';

import { revalidatePath } from 'next/cache';
import { deleteSertifikat } from '@/lib/search';

export async function deleteSertifikatAction(formData: FormData): Promise<void> {
  const id = Number(formData.get('id'));
  await deleteSertifikat(id);
  revalidatePath('/admin');
}
