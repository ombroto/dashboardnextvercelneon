'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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
      <div style={{ maxWidth: 420, width: '100%', padding: 28, borderRadius: 'var(--radius-xl)', background: 'var(--glass-regular)', border: '1px solid var(--glass-border)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Masuk Admin</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Email Institusi" icon="mail" value={email} onChange={setEmail} />
          <Input label="Kata Sandi" icon="key-round" type="password" value={password} onChange={setPassword} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          <Button variant="primary" size="lg" block onClick={submit}>
            {pending ? 'Memproses...' : 'Masuk'}
          </Button>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</div>}
        </div>
      </div>
    </main>
  );
}
