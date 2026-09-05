'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/ui/Tabs';

export function AdminTabs({ current, pesertaCount }: { current: string; pesertaCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setTab(key: string) {
    const params = new URLSearchParams(searchParams);
    params.set('tab', key);
    router.push(`/admin?${params.toString()}`);
  }

  return (
    <Tabs
      items={[
        { key: 'kegiatan', label: 'Kegiatan' },
        { key: 'peserta', label: 'Data Peserta', badge: pesertaCount },
        { key: 'log', label: 'Log Unduhan' },
      ]}
      value={current}
      onChange={setTab}
    />
  );
}
