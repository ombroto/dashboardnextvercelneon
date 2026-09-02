import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders the label and calls onChange with the new value', () => {
    const onChange = vi.fn();
    render(<Input label="NIK atau Nama Lengkap" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('NIK atau Nama Lengkap'), { target: { value: 'Sri' } });
    expect(onChange).toHaveBeenCalledWith('Sri');
  });
});
