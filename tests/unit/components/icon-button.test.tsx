import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IconButton } from '@/components/ui/IconButton';

describe('IconButton', () => {
  it('renders a button and calls onClick', () => {
    const onClick = vi.fn();
    render(<IconButton icon="trash-2" label="Hapus" onClick={onClick} />);
    fireEvent.click(screen.getByLabelText('Hapus'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders as a link when href is provided', () => {
    render(<IconButton icon="pencil" label="Edit kegiatan" href="/admin/kegiatan/1/edit" />);
    const link = screen.getByLabelText('Edit kegiatan');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/admin/kegiatan/1/edit');
  });
});
