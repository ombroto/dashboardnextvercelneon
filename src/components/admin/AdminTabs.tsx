'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@/components/ui/Tabs';

export function AdminTabs({ current }: { current: string }) {
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
        { key: 'unggah', label: 'Unggah' },
        { key: 'penerima', label: 'Penerima' },
        { key: 'log', label: 'Log' },
      ]}
      value={current}
      onChange={setTab}
    />
  );
}
