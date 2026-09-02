import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders its children with the success variant color', () => {
    render(<Badge variant="success">Siap</Badge>);
    const el = screen.getByText('Siap');
    expect(el.style.color).toContain('var(--ut-green)');
  });
});
