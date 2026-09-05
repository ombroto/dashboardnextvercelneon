import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KegiatanDeleteButton } from '@/components/admin/KegiatanDeleteButton';
import { deleteKegiatanAction } from '@/app/admin/actions';

vi.mock('@/app/admin/actions', () => ({
  deleteKegiatanAction: vi.fn(),
}));

describe('KegiatanDeleteButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(deleteKegiatanAction).mockClear();
  });

  it('asks for confirmation naming the kegiatan before deleting', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<KegiatanDeleteButton id={1} nama="Diklat Uji" />);
    fireEvent.submit(screen.getByLabelText('Hapus kegiatan').closest('form')!);
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Diklat Uji'));
  });

  it('does not submit the delete action when the confirmation dialog is declined', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<KegiatanDeleteButton id={2} nama="Diklat Batal" />);
    fireEvent.submit(screen.getByLabelText('Hapus kegiatan').closest('form')!);
    expect(deleteKegiatanAction).not.toHaveBeenCalled();
  });
});
