'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { searchAction } from '@/app/actions/search';

export function SearchForm({ error }: { error?: string }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(() => {
      searchAction(query);
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <Input
            label="NIK atau Nama Lengkap"
            icon="search"
            size="lg"
            placeholder="mis. 3204012509870007 atau Sri Wahyuni"
            value={query}
            onChange={setQuery}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        <Button variant="primary" size="lg" onClick={submit}>
          {isPending ? 'Mencari...' : 'Cari'}
        </Button>
      </div>
      {error && (
        <div style={{ marginTop: 12, color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</div>
      )}
    </div>
  );
}
