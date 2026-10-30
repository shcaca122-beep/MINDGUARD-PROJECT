'use client';

import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { getServerThemeSnapshot, getThemeSnapshot, saveTheme, subscribeToTheme } from '@/lib/theme';

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  if (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/ganti-password' || pathname === '/lupa-password' || pathname === '/reset-password') {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => saveTheme(nextTheme)}
      aria-label={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
      title={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
      style={{
        position: compact ? 'fixed' : undefined,
        right: compact ? '20px' : undefined,
        bottom: compact ? '20px' : undefined,
        zIndex: compact ? 100 : undefined,
        width: compact ? 'auto' : '100%',
        minWidth: compact ? '48px' : undefined,
        minHeight: compact ? '48px' : undefined,
        whiteSpace: 'nowrap',
        backgroundColor: 'var(--theme-toggle-background, #14532d)',
        color: 'var(--theme-toggle-foreground, #ffffff)',
        border: '1px solid var(--theme-toggle-border, #4ade80)',
        padding: compact ? '12px' : '9px 12px',
        borderRadius: '999px',
        fontSize: compact ? '18px' : '12px',
        fontWeight: '600',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
      {!compact && <span>Mode {theme === 'light' ? 'Gelap' : 'Terang'}</span>}
    </button>
  );
}
