'use server';

import { revalidatePath } from 'next/cache';
import { deleteSertifikat } from '@/lib/search';
import { requireAdminSession } from '@/lib/auth';

export async function deleteSertifikatAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const id = Number(formData.get('id'));
  await deleteSertifikat(id);
  revalidatePath('/admin');
}
