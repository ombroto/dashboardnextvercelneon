import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children and responds to click', () => {
    const onClick = vi.fn();
    render(<Button variant="primary" onClick={onClick}>Cari</Button>);
    fireEvent.click(screen.getByText('Cari'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies the primary variant background token', () => {
    render(<Button variant="primary">Cari</Button>);
    const el = screen.getByText('Cari');
    expect(el.style.background).toContain('var(--ut-blue-600)');
  });
});
