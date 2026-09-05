import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { IdleLogout, IDLE_TIMEOUT_MS } from '@/components/layout/IdleLogout';
import { logoutAction } from '@/app/admin/actions';

vi.mock('@/app/admin/actions', () => ({
  logoutAction: vi.fn(),
}));

describe('IdleLogout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(logoutAction).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when disabled', () => {
    render(<IdleLogout enabled={false} />);
    vi.advanceTimersByTime(IDLE_TIMEOUT_MS + 1000);
    expect(logoutAction).not.toHaveBeenCalled();
  });

  it('logs out after the idle timeout elapses with no activity', () => {
    render(<IdleLogout enabled />);
    vi.advanceTimersByTime(IDLE_TIMEOUT_MS);
    expect(logoutAction).toHaveBeenCalledOnce();
  });

  it('resets the timer on activity, delaying logout', () => {
    render(<IdleLogout enabled />);
    vi.advanceTimersByTime(IDLE_TIMEOUT_MS - 1000);
    window.dispatchEvent(new Event('mousemove'));
    vi.advanceTimersByTime(1000);
    expect(logoutAction).not.toHaveBeenCalled();

    vi.advanceTimersByTime(IDLE_TIMEOUT_MS - 1000);
    expect(logoutAction).toHaveBeenCalledOnce();
  });
});
