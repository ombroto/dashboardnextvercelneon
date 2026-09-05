'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/admin/actions';

const NAV_BUTTON_BASE: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 'var(--radius-pill)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-semibold)',
  textDecoration: 'none',
  border: 'none',
};

export interface HeaderUser {
  name: string | null;
  email: string;
}

export function Header({ user = null }: { user?: HeaderUser | null }) {
  const pathname = usePathname();
  const isAdminSection = pathname.startsWith('/admin');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header
      style={{
        position: 'relative',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        maxWidth: 1180,
        margin: '20px auto 26px',
        padding: '12px 14px 12px 20px',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--glass-chrome)',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-sm), var(--glass-edge-top)',
        backdropFilter: 'blur(20px) saturate(180%)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-bpip.png"
        alt="Logo BPIP"
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          objectFit: 'contain',
          boxShadow: 'var(--shadow-xs)',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-tight)', lineHeight: 1.2 }}>
          KEDEPUTIAN BIDANG PENDIDIKAN DAN PELATIHAN
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>Diklat BPIP RI</div>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 'var(--radius-pill)', background: 'rgba(11,22,38,0.05)' }}>
        <Link
          href="/"
          style={{
            ...NAV_BUTTON_BASE,
            background: !isAdminSection ? '#fff' : 'transparent',
            color: !isAdminSection ? 'var(--ut-blue-700)' : 'var(--ink-500)',
            boxShadow: !isAdminSection ? 'var(--shadow-xs)' : 'none',
          }}
        >
          Cari Sertifikat
        </Link>
        {user ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              style={{
                ...NAV_BUTTON_BASE,
                background: isAdminSection ? '#fff' : 'transparent',
                color: isAdminSection ? 'var(--ut-blue-700)' : 'var(--ink-500)',
                boxShadow: isAdminSection ? 'var(--shadow-xs)' : 'none',
                cursor: 'pointer',
              }}
            >
              {user.name ?? user.email}
            </button>
            {menuOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  minWidth: 160,
                  padding: 6,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--glass-regular)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: 'var(--shadow-sm), var(--glass-edge-top)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  zIndex: 20,
                }}
              >
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--ink-500)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-semibold)',
                    textDecoration: 'none',
                  }}
                >
                  Kelola Sertifikat
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--ink-500)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--weight-semibold)',
                      cursor: 'pointer',
                    }}
                  >
                    Keluar
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/admin"
            style={{
              ...NAV_BUTTON_BASE,
              background: isAdminSection ? '#fff' : 'transparent',
              color: isAdminSection ? 'var(--ut-blue-700)' : 'var(--ink-500)',
              boxShadow: isAdminSection ? 'var(--shadow-xs)' : 'none',
            }}
          >
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
}
