'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface UnmatchedFile {
  filename: string;
  blobUrl: string;
  fileSize: number;
}

const STEP_LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: 'var(--ut-blue-600)',
  marginBottom: 5,
};

const CARD_STYLE: React.CSSProperties = {
  borderRadius: 'var(--radius-xl)',
  background: 'var(--glass-regular)',
  border: '1px solid var(--glass-border)',
  boxShadow: 'var(--shadow-sm), var(--glass-edge-top)',
  backdropFilter: 'blur(22px) saturate(180%)',
};

export function UploadTab() {
  const [csvNote, setCsvNote] = useState<string | null>(null);
  const [uploadingZip, setUploadingZip] = useState(false);
  const [zipStatus, setZipStatus] = useState<string | null>(null);
  const [matched, setMatched] = useState<number | null>(null);
  const [unmatched, setUnmatched] = useState<UnmatchedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

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
    setUploadingZip(true);
    setMatched(null);
    setUnmatched([]);
    setZipStatus('Mengunggah arsip...');
    try {
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
      setMatched(body.matched);
      setUnmatched(body.unmatched);
      setZipStatus(null);
    } finally {
      setUploadingZip(false);
    }
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
    setMatched((prev) => (prev ?? 0) + 1);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleZipFile(file);
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ ...CARD_STYLE, display: 'flex', alignItems: 'center', gap: 22, padding: '20px 24px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={STEP_LABEL_STYLE}>LANGKAH 1</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-tight)' }}>
            Unggah CSV Penerima
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 560 }}>
            Impor daftar penerima lebih dulu — kolom{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>nik,nama,kegiatan,tanggal_terbit,nomor,jam</span>. Data inilah yang
            dicari peserta dan menjadi acuan pencocokan PDF.
          </p>
          {csvNote && <div style={{ marginTop: 10, fontSize: 'var(--text-xs)', color: 'var(--ut-green)', fontWeight: 600 }}>{csvNote}</div>}
        </div>
        <div style={{ display: 'flex', gap: 9, flexShrink: 0 }}>
          <a href="/templates/peserta_template.csv" download>
            <Button variant="ghost">Unduh Templat</Button>
          </a>
          <input ref={csvInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])} />
          <Button variant="primary" onClick={() => csvInputRef.current?.click()}>Pilih CSV</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18, marginTop: 16, alignItems: 'start' }}>
        <div style={{ ...CARD_STYLE, padding: 22 }}>
          <div style={STEP_LABEL_STYLE}>LANGKAH 2</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-tight)' }}>
            Unggah ZIP Sertifikat
          </div>
          <p style={{ margin: '4px 0 16px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Satu arsip ZIP berisi banyak PDF. Sistem mencocokkan berkas ke penerima secara otomatis.
          </p>

          <input ref={zipInputRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleZipFile(e.target.files[0])} />
          <div
            onClick={() => zipInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? 'var(--ut-blue-500)' : 'rgba(0,74,147,0.3)'}`,
              borderRadius: 'var(--radius-lg)',
              background: dragOver ? '#fff' : 'rgba(255,255,255,0.45)',
              padding: '30px 22px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'background 160ms var(--ease-out), border-color 160ms var(--ease-out)',
            }}
          >
            <div style={{ color: 'var(--ut-blue-600)', display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <Icon name="upload-cloud" size={30} />
            </div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-base)' }}>
              {uploadingZip ? 'Mengunggah...' : 'Tarik berkas ZIP ke sini'}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>atau klik untuk memilih</div>
          </div>

          {zipStatus && <div style={{ marginTop: 16, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{zipStatus}</div>}

          {matched !== null && (
            <div style={{ marginTop: 16, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.6)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: unmatched.length > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ flex: 1, padding: '14px 18px', borderRight: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>Cocok otomatis</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--ut-green)' }}>{matched}</div>
                </div>
                <div style={{ flex: 1, padding: '14px 18px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600 }}>Perlu ditinjau</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--ut-orange)' }}>{unmatched.length}</div>
                </div>
              </div>
              {unmatched.length > 0 && (
                <div style={{ padding: '6px 18px 14px' }}>
                  {unmatched.map((u) => (
                    <div key={u.filename} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.filename}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleCocokkan(u)}>Cocokkan</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ ...CARD_STYLE, padding: '20px 22px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-tight)' }}>
            Aturan Penamaan Berkas
          </div>
          <p style={{ margin: '4px 0 12px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Rekomendasi: sertakan <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>manifest.csv</span> di akar ZIP. Bila tidak
            ada, sistem membaca NIK dari nama berkas.
          </p>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              lineHeight: 1.9,
              color: 'var(--ink-700)',
              background: 'rgba(11,22,38,0.05)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
            }}
          >
            diklat-2026.zip
            <br />
            ├── manifest.csv
            <br />
            ├── 3204012509870007_SK-1182.pdf
            <br />
            └── 3174052003910012_SK-1183.pdf
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10 }}>
            manifest.csv → nik,nomor,file
          </div>
        </div>
      </div>
    </div>
  );
}
