import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { IdleLogout } from '@/components/layout/IdleLogout';
import { auth } from '@/lib/auth';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Portal Sertifikat Diklat',
  description: 'Cari dan unduh sertifikat diklat BPIP',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user?.email
    ? { name: session.user.name ?? null, email: session.user.email }
    : null;

  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Header user={user} />
        <IdleLogout enabled={Boolean(user)} />
        {children}
      </body>
    </html>
  );
}
