'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export function KegiatanCsvUploadCard({ kegiatanId }: { kegiatanId: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null);

  async function stageFile(file: File) {
    const text = await file.text();
    const lines = text.trim().split('\n').filter(Boolean);
    setStagedFile(file);
    setRowCount(Math.max(lines.length - 1, 0));
    setResult(null);
  }

  function cancelStaged() {
    setStagedFile(null);
    setRowCount(0);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function kirim() {
    if (!stagedFile) return;
    setSending(true);
    try {
      const csv = await stagedFile.text();
      const response = await fetch(`/api/admin/kegiatan/${kegiatanId}/import/csv`, {
        method: 'POST',
        body: JSON.stringify({ csv }),
      });
      const body = await response.json();
      setResult({ imported: body.imported, errors: body.errors.length });
      setStagedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)', padding: 22 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600 }}>Langkah 2 · Unggah CSV Peserta</div>
      <p style={{ margin: '4px 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        Kolom: <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>nama_peserta;Username;Email;Provinsi;Kabupaten / kota;Asal instansi</span>
      </p>

      <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && stageFile(e.target.files[0])} />

      {!stagedFile ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{ border: '2px dashed rgba(0,74,147,0.3)', borderRadius: 'var(--radius-lg)', padding: '26px 20px', textAlign: 'center', cursor: 'pointer' }}
        >
          <Icon name="upload-cloud" size={26} />
          <div style={{ marginTop: 8, fontWeight: 600 }}>Tarik berkas CSV ke sini</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>atau klik untuk memilih</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 'var(--text-sm)' }}>
            <strong>{stagedFile.name}</strong> — {rowCount} baris terdeteksi
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Button variant="primary" onClick={kirim} disabled={sending}>{sending ? 'Mengirim...' : 'Kirim'}</Button>
            <Button variant="ghost" onClick={cancelStaged} disabled={sending}>Batal</Button>
          </div>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 14, fontSize: 'var(--text-sm)', color: 'var(--ut-green)', fontWeight: 600 }}>
          {result.imported} baris berhasil diimpor, {result.errors} error.
        </div>
      )}
    </div>
  );
}
