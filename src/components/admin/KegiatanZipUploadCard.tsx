'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface UnmatchedFile {
  folder: string;
  email: string;
  blobUrl: string;
  fileSize: number;
}

interface PesertaOption {
  id: number;
  nama: string;
  nik: string;
}

export function KegiatanZipUploadCard({ kegiatanId, pesertaOptions }: { kegiatanId: number; pesertaOptions: PesertaOption[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [matched, setMatched] = useState<number | null>(null);
  const [unmatched, setUnmatched] = useState<UnmatchedFile[]>([]);
  const [pickerFor, setPickerFor] = useState<UnmatchedFile | null>(null);

  function stageFile(file: File) {
    setStagedFile(file);
    setMatched(null);
    setUnmatched([]);
  }

  function cancelStaged() {
    setStagedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function kirim() {
    if (!stagedFile) return;
    setSending(true);
    try {
      const blob = await upload(stagedFile.name, stagedFile, {
        access: 'public',
        handleUploadUrl: '/api/admin/blob/upload',
      });
      const response = await fetch(`/api/admin/kegiatan/${kegiatanId}/import/zip`, {
        method: 'POST',
        body: JSON.stringify({ blobUrl: blob.url }),
      });
      const body = await response.json();
      setMatched(body.matched);
      setUnmatched(body.unmatched);
      setStagedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function cocokkan(file: UnmatchedFile, pesertaId: number) {
    const response = await fetch(`/api/admin/kegiatan/${kegiatanId}/import/match`, {
      method: 'POST',
      body: JSON.stringify({ pesertaId, blobUrl: file.blobUrl, fileSize: file.fileSize }),
    });
    if (!response.ok) return;
    setUnmatched((prev) => prev.filter((u) => u.folder !== file.folder));
    setMatched((prev) => (prev ?? 0) + 1);
    setPickerFor(null);
    router.refresh();
  }

  return (
    <div style={{ borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)', padding: 22 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 600 }}>Langkah 3 · Unggah ZIP Sertifikat</div>
      <p style={{ margin: '4px 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        Wajib <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>manifest.csv</span> (folder;email) di akar arsip.
      </p>

      <input ref={inputRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && stageFile(e.target.files[0])} />

      {!stagedFile ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{ border: '2px dashed rgba(0,74,147,0.3)', borderRadius: 'var(--radius-lg)', padding: '26px 20px', textAlign: 'center', cursor: 'pointer' }}
        >
          <Icon name="upload-cloud" size={26} />
          <div style={{ marginTop: 8, fontWeight: 600 }}>Tarik berkas ZIP ke sini</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>atau klik untuk memilih</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 'var(--text-sm)' }}>
            <strong>{stagedFile.name}</strong> — {(stagedFile.size / 1024).toFixed(0)} KB
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Button variant="primary" onClick={kirim} disabled={sending}>{sending ? 'Mengirim...' : 'Kirim'}</Button>
            <Button variant="ghost" onClick={cancelStaged} disabled={sending}>Batal</Button>
          </div>
        </div>
      )}

      {matched !== null && (
        <div style={{ marginTop: 16, fontSize: 'var(--text-sm)' }}>
          <div>{matched} berkas cocok otomatis</div>
          <div>{unmatched.length} berkas perlu ditinjau manual</div>
          {unmatched.map((u) => (
            <div key={u.folder} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                {u.folder} ({u.email})
              </span>
              {pickerFor?.folder === u.folder ? (
                <select
                  autoFocus
                  style={{ height: 34, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}
                  onChange={(e) => e.target.value && cocokkan(u, Number(e.target.value))}
                  defaultValue=""
                >
                  <option value="" disabled>Pilih peserta</option>
                  {pesertaOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama} ({p.nik})</option>
                  ))}
                </select>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setPickerFor(u)}>Cocokkan</Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
