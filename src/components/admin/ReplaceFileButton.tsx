'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { useRouter } from 'next/navigation';
import { IconButton } from '@/components/ui/IconButton';

export function ReplaceFileButton({ sertifikatId }: { sertifikatId: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/blob/upload',
      });

      await fetch(`/api/admin/sertifikat/${sertifikatId}`, {
        method: 'PUT',
        body: JSON.stringify({ blobUrl: blob.url, fileSize: file.size }),
      });

      router.refresh();
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <IconButton
        icon="refresh-cw"
        label={busy ? 'Mengunggah...' : 'Ganti berkas'}
        size="sm"
        variant="ghost"
        onClick={() => inputRef.current?.click()}
      />
    </>
  );
}
