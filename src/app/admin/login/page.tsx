'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { loginAction } from './actions';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    const result = await loginAction(email, password);
    setPending(false);
    if (result.error) setError(result.error);
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          padding: 28,
          borderRadius: 'var(--radius-xl)',
          background: 'var(--glass-regular)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-xl), var(--glass-edge-top)',
          backdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(150deg, var(--ut-blue-500), var(--ut-blue-800))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Icon name="lock" size={20} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', letterSpacing: 'var(--tracking-tight)', margin: '0 0 6px' }}>Masuk</h2>
        <p style={{ margin: '0 0 20px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Khusus pengguna terdaftar di Sekretariat Diklat BPIP.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Email Institusi" icon="mail" placeholder="nama@bpip.go.id" value={email} onChange={setEmail} />
          <Input label="Kata Sandi" icon="key-round" type="password" placeholder="••••••••" value={password} onChange={setPassword} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          <Button variant="primary" size="lg" block onClick={submit}>
            {pending ? 'Memproses...' : 'Masuk'}
          </Button>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</div>}
        </div>
      </div>
    </main>
  );
}
