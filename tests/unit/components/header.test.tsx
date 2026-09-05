import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/components/layout/Header';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('@/app/admin/actions', () => ({
  logoutAction: vi.fn(),
}));

describe('Header', () => {
  it('shows a Masuk link when logged out', () => {
    render(<Header user={null} />);
    expect(screen.getByText('Masuk')).toBeInTheDocument();
    expect(screen.queryByText('Keluar')).not.toBeInTheDocument();
  });

  it('shows the user name instead of Masuk when logged in', () => {
    render(<Header user={{ name: 'Admin BPIP', email: 'admin@bpip.go.id' }} />);
    expect(screen.queryByText('Masuk')).not.toBeInTheDocument();
    expect(screen.getByText('Admin BPIP')).toBeInTheDocument();
  });

  it('falls back to email when name is null', () => {
    render(<Header user={{ name: null, email: 'admin@bpip.go.id' }} />);
    expect(screen.getByText('admin@bpip.go.id')).toBeInTheDocument();
  });

  it('opens a dropdown with Kelola Sertifikat and Keluar on click, and closes on outside click', () => {
    render(
      <div>
        <Header user={{ name: 'Admin BPIP', email: 'admin@bpip.go.id' }} />
        <div data-testid="outside">outside</div>
      </div>
    );
    expect(screen.queryByText('Keluar')).not.toBeInTheDocument();
    expect(screen.queryByText('Kelola Sertifikat')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Admin BPIP'));
    expect(screen.getByText('Keluar')).toBeInTheDocument();
    const kelolaLink = screen.getByText('Kelola Sertifikat');
    expect(kelolaLink).toBeInTheDocument();
    expect(kelolaLink.closest('a')).toHaveAttribute('href', '/admin');

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Keluar')).not.toBeInTheDocument();
    expect(screen.queryByText('Kelola Sertifikat')).not.toBeInTheDocument();
  });

  it('closes the dropdown when Kelola Sertifikat is clicked', () => {
    render(<Header user={{ name: 'Admin BPIP', email: 'admin@bpip.go.id' }} />);
    fireEvent.click(screen.getByText('Admin BPIP'));
    fireEvent.click(screen.getByText('Kelola Sertifikat'));
    expect(screen.queryByText('Kelola Sertifikat')).not.toBeInTheDocument();
    expect(screen.queryByText('Keluar')).not.toBeInTheDocument();
  });

  it('closes the dropdown on Escape', () => {
    render(<Header user={{ name: 'Admin BPIP', email: 'admin@bpip.go.id' }} />);
    fireEvent.click(screen.getByText('Admin BPIP'));
    expect(screen.getByText('Keluar')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Keluar')).not.toBeInTheDocument();
  });
});
