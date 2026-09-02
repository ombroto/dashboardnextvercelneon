import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '@/components/ui/Tabs';

describe('Tabs', () => {
  it('calls onChange with the clicked tab key', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        items={[
          { key: 'unggah', label: 'Unggah' },
          { key: 'penerima', label: 'Penerima' },
        ]}
        value="unggah"
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('Penerima'));
    expect(onChange).toHaveBeenCalledWith('penerima');
  });
});
