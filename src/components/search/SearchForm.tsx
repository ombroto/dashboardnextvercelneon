'use client';

import { useRef, useState, useTransition } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { searchAction } from '@/app/actions/search';

interface KegiatanOption {
  id: number;
  nama: string;
}

export function SearchForm({ error }: { error?: string }) {
  const [kegiatanQuery, setKegiatanQuery] = useState('');
  const [suggestions, setSuggestions] = useState<KegiatanOption[]>([]);
  const [selected, setSelected] = useState<KegiatanOption | null>(null);
  const [nik, setNik] = useState('');
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleKegiatanChange(value: string) {
    setKegiatanQuery(value);
    setSelected(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 4) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const response = await fetch(`/api/kegiatan/search?q=${encodeURIComponent(value.trim())}`);
      const data = (await response.json()) as KegiatanOption[];
      setSuggestions(data);
    }, 300);
  }

  function selectKegiatan(option: KegiatanOption) {
    setSelected(option);
    setKegiatanQuery(option.nama);
    setSuggestions([]);
  }

  function submit() {
    if (!selected) return;
    startTransition(() => {
      searchAction(selected.id, nik);
    });
  }

  return (
    <div
      style={{
        maxWidth: 660,
        margin: '26px auto 0',
        padding: 22,
        borderRadius: 'var(--radius-xl)',
        background: 'var(--glass-regular)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-lg), var(--glass-edge-top)',
        backdropFilter: 'blur(24px) saturate(180%)',
      }}
    >
      <div style={{ position: 'relative' }}>
        <Input
          label="Nama Kegiatan Diklat"
          icon="search"
          size="lg"
          placeholder="Ketik minimal 4 huruf, mis. Pembudayaan Nilai Pancasila"
          value={kegiatanQuery}
          onChange={handleKegiatanChange}
        />
        {suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 10,
              marginTop: 4,
              borderRadius: 'var(--radius-md)',
              background: '#fff',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}
          >
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectKegiatan(s)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontFamily: 'inherit',
                }}
              >
                {s.nama}
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginTop: 14 }}>
          <div style={{ flex: 1 }}>
            <Input
              label="NIK"
              icon="id-card"
              size="lg"
              placeholder="16 digit NIK"
              value={nik}
              onChange={setNik}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>
          <Button variant="primary" size="lg" onClick={submit}>
            {isPending ? 'Mencari...' : 'Cari'}
          </Button>
        </div>
      )}

      {error && <div style={{ marginTop: 12, color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</div>}
    </div>
  );
}
