'use server';

import { signIn } from '@/lib/auth';
import { AuthError } from 'next-auth';

export async function loginAction(email: string, password: string): Promise<{ error?: string }> {
  try {
    await signIn('credentials', { email, password, redirectTo: '/admin' });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Email atau kata sandi salah.' };
    }
    throw error;
  }
}
