'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/ui/Tabs';

export function AdminTabs({ current, penerimaCount }: { current: string; penerimaCount: number }) {
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
        { key: 'unggah', label: 'Unggah Berkas', icon: 'upload' },
        { key: 'penerima', label: 'Data Penerima', badge: penerimaCount },
        { key: 'log', label: 'Log Unduhan' },
      ]}
      value={current}
      onChange={setTab}
    />
  );
}
