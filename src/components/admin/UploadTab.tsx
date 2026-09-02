'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/Button';

interface UnmatchedFile {
  filename: string;
  blobUrl: string;
  fileSize: number;
}

export function UploadTab() {
  const [csvNote, setCsvNote] = useState<string | null>(null);
  const [zipStatus, setZipStatus] = useState<string | null>(null);
  const [unmatched, setUnmatched] = useState<UnmatchedFile[]>([]);

  async function handleCsvFile(file: File) {
    const csv = await file.text();
    const response = await fetch('/api/admin/import/csv', {
      method: 'POST',
      body: JSON.stringify({ csv }),
    });
    const body = await response.json();
    setCsvNote(`${body.imported} baris berhasil diimpor, ${body.errors.length} error.`);
  }

  async function handleZipFile(file: File) {
    setZipStatus('Mengunggah arsip...');
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/admin/blob/upload',
    });

    setZipStatus('Memproses arsip...');
    const response = await fetch('/api/admin/import/zip', {
      method: 'POST',
      body: JSON.stringify({ blobUrl: blob.url }),
    });
    const body = await response.json();
    setZipStatus(`${body.matched} berkas cocok otomatis, ${body.unmatched.length} perlu ditinjau.`);
    setUnmatched(body.unmatched);
  }

  async function handleCocokkan(file: UnmatchedFile) {
    const nomor = window.prompt(`Masukkan nomor sertifikat untuk berkas "${file.filename}":`);
    if (!nomor) return;

    const response = await fetch('/api/admin/import/match', {
      method: 'POST',
      body: JSON.stringify({ nomor, blobUrl: file.blobUrl, fileSize: file.fileSize }),
    });

    if (!response.ok) {
      window.alert(`Nomor "${nomor}" tidak ditemukan.`);
      return;
    }

    setUnmatched((prev) => prev.filter((u) => u.filename !== file.filename));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
      <div style={{ padding: '20px 24px', borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)' }}>
        <div style={{ fontWeight: 'var(--weight-semibold)' }}>Langkah 1 — Unggah CSV Penerima</div>
        <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])} />
        {csvNote && <div style={{ marginTop: 8, color: 'var(--ut-green)', fontSize: 'var(--text-xs)' }}>{csvNote}</div>}
      </div>

      <div style={{ padding: '20px 24px', borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)' }}>
        <div style={{ fontWeight: 'var(--weight-semibold)' }}>Langkah 2 — Unggah ZIP Sertifikat</div>
        <input type="file" accept=".zip" onChange={(e) => e.target.files?.[0] && handleZipFile(e.target.files[0])} />
        {zipStatus && <div style={{ marginTop: 8, fontSize: 'var(--text-xs)' }}>{zipStatus}</div>}
        {unmatched.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {unmatched.map((u) => (
              <div key={u.filename} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{u.filename}</span>
                <Button variant="ghost" size="sm" onClick={() => handleCocokkan(u)}>Cocokkan</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
