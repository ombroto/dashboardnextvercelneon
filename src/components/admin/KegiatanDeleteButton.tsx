'use client';

import { IconButton } from '@/components/ui/IconButton';
import { deleteKegiatanAction } from '@/app/admin/actions';

export function KegiatanDeleteButton({ id, nama }: { id: number; nama: string }) {
  return (
    <form
      action={deleteKegiatanAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Hapus kegiatan "${nama}"? Semua data peserta dan sertifikat pada kegiatan ini akan ikut terhapus dan tidak dapat dikembalikan.`
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <IconButton icon="trash-2" label="Hapus kegiatan" type="submit" />
    </form>
  );
}
