'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const SEGMEN_OPTIONS = ['Aparatur Negara', 'Orsospol', 'KML', 'Purnapaskibraka'] as const;
const MODE_OPTIONS = ['Luring', 'Daring', 'Hybrid'] as const;
const MAX_LOGO_BYTES = 1024 * 1024;

const FIELD_STYLE: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'rgba(255,255,255,0.7)',
  fontSize: 'var(--text-sm)',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 5,
};

function yearOptions(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + 1; y >= current - 3; y--) years.push(y);
  return years;
}

export function KegiatanForm({ wilayah }: { wilayah: Record<string, string[]> }) {
  const router = useRouter();
  const provinsiList = useMemo(() => Object.keys(wilayah), [wilayah]);

  const [nama, setNama] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [segmen, setSegmen] = useState<(typeof SEGMEN_OPTIONS)[number] | ''>('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [jumlahJp, setJumlahJp] = useState('');
  const [provinsi, setProvinsi] = useState('');
  const [kabupatenKota, setKabupatenKota] = useState('');
  const [modePenyelenggaraan, setModePenyelenggaraan] = useState<(typeof MODE_OPTIONS)[number] | ''>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const kabupatenOptions = provinsi ? (wilayah[provinsi] ?? []) : [];

  function handleLogoChange(file: File) {
    setLogoError(null);
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setLogoError('Logo harus berformat JPG atau PNG');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Ukuran logo maksimal 1MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);

    const clientErrors: string[] = [];
    if (!nama.trim()) clientErrors.push('Nama kegiatan wajib diisi');
    if (!segmen) clientErrors.push('Segmen kegiatan wajib dipilih');
    if (!tanggalMulai) clientErrors.push('Tanggal mulai wajib diisi');
    if (!tanggalSelesai) clientErrors.push('Tanggal berakhir wajib diisi');
    if (tanggalMulai && tanggalSelesai && tanggalSelesai < tanggalMulai) clientErrors.push('Tanggal berakhir harus setelah tanggal mulai');
    if (!jumlahJp || Number(jumlahJp) <= 0) clientErrors.push('Jam pelajaran harus berupa angka positif');
    if (!provinsi) clientErrors.push('Provinsi kegiatan wajib dipilih');
    if (!kabupatenKota) clientErrors.push('Kab/kota kegiatan wajib dipilih');
    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      let logoUrl: string | undefined;
      if (logoFile) {
        const blob = await upload(logoFile.name, logoFile, {
          access: 'public',
          handleUploadUrl: '/api/admin/blob/upload',
        });
        logoUrl = blob.url;
      }

      const response = await fetch('/api/admin/kegiatan', {
        method: 'POST',
        body: JSON.stringify({
          nama,
          tahun,
          segmen,
          tanggalMulai,
          tanggalSelesai,
          jumlahJp: Number(jumlahJp),
          provinsi,
          kabupatenKota,
          modePenyelenggaraan: modePenyelenggaraan || undefined,
          logoUrl,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setErrors(body.errors ?? ['Gagal membuat kegiatan']);
        return;
      }
      router.push(`/admin/kegiatan/${body.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {errors.length > 0 && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(220,38,38,0.08)', color: '#b91c1c', fontSize: 'var(--text-sm)' }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label style={LABEL_STYLE} htmlFor="tahun">Tahun</label>
        <select id="tahun" style={FIELD_STYLE} value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
          {yearOptions().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="segmen">Segmen Kegiatan</label>
        <select id="segmen" style={FIELD_STYLE} value={segmen} onChange={(e) => setSegmen(e.target.value as typeof segmen)}>
          <option value="">Pilih salah satu</option>
          {SEGMEN_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="nama">Nama Kegiatan</label>
        <input id="nama" style={FIELD_STYLE} value={nama} onChange={(e) => setNama(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={LABEL_STYLE} htmlFor="tanggalMulai">Tanggal Mulai</label>
          <input id="tanggalMulai" type="date" style={FIELD_STYLE} value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} />
        </div>
        <div>
          <label style={LABEL_STYLE} htmlFor="tanggalSelesai">Tanggal Berakhir</label>
          <input id="tanggalSelesai" type="date" style={FIELD_STYLE} value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} />
        </div>
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="jumlahJp">Jam Pelajaran</label>
        <input id="jumlahJp" type="number" min={1} style={FIELD_STYLE} value={jumlahJp} onChange={(e) => setJumlahJp(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={LABEL_STYLE} htmlFor="provinsi">Provinsi Kegiatan</label>
          <select
            id="provinsi"
            style={FIELD_STYLE}
            value={provinsi}
            onChange={(e) => {
              setProvinsi(e.target.value);
              setKabupatenKota('');
            }}
          >
            <option value="">Pilih provinsi</option>
            {provinsiList.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={LABEL_STYLE} htmlFor="kabupatenKota">Kab/Kota Kegiatan</label>
          <select id="kabupatenKota" style={FIELD_STYLE} value={kabupatenKota} onChange={(e) => setKabupatenKota(e.target.value)} disabled={!provinsi}>
            <option value="">Pilih kab/kota</option>
            {kabupatenOptions.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={LABEL_STYLE} htmlFor="mode">Mode Penyelenggaraan</label>
        <select id="mode" style={FIELD_STYLE} value={modePenyelenggaraan} onChange={(e) => setModePenyelenggaraan(e.target.value as typeof modePenyelenggaraan)}>
          <option value="">Pilih salah satu (opsional)</option>
          {MODE_OPTIONS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={LABEL_STYLE}>Logo Penyelenggara</label>
        {logoPreview ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoPreview} alt="Pratinjau logo" style={{ width: 66, height: 66, objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }} />
            <Button type="button" variant="ghost" size="sm" onClick={removeLogo}>Hapus</Button>
          </div>
        ) : (
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              border: '2px dashed rgba(0,74,147,0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
            }}
          >
            <Icon name="upload-cloud" size={24} />
            <span style={{ fontSize: 'var(--text-xs)' }}>Drop file di sini atau klik untuk upload</span>
            <span style={{ fontSize: 11 }}>Format jpg/png · ukuran 132 x 132 px · Maksimal 1MB</span>
            <input type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleLogoChange(e.target.files[0])} />
          </label>
        )}
        {logoError && <div style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: '#b91c1c' }}>{logoError}</div>}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Buat Kegiatan'}</Button>
        <Button type="button" variant="ghost" onClick={() => router.push('/admin')}>Batal</Button>
      </div>
    </form>
  );
}
