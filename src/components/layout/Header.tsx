'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_BUTTON_BASE: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 'var(--radius-pill)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-semibold)',
  textDecoration: 'none',
  border: 'none',
};

export function Header() {
  const pathname = usePathname();
  const isAdminSection = pathname.startsWith('/admin');

  return (
    <header
      style={{
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
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: 'linear-gradient(150deg, var(--ut-blue-500), var(--ut-blue-800))',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '-0.02em',
          boxShadow: 'var(--shadow-xs)',
          flexShrink: 0,
        }}
      >
        BP
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-tight)', lineHeight: 1.2 }}>
          Portal Sertifikat Diklat
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
      </div>
    </header>
  );
}
