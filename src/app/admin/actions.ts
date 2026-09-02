'use server';

import { revalidatePath } from 'next/cache';
import { deleteSertifikat } from '@/lib/search';
import { requireAdminSession, signOut } from '@/lib/auth';

export async function deleteSertifikatAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const id = Number(formData.get('id'));
  await deleteSertifikat(id);
  revalidatePath('/admin');
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/admin/login' });
}
