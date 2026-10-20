'use client';

import { useSyncExternalStore } from 'react';
import { getServerThemeSnapshot, getThemeSnapshot, saveTheme, subscribeToTheme } from '@/lib/theme';

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <button
      type="button"
      onClick={() => saveTheme(nextTheme)}
      aria-label={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
      style={{
        width: compact ? 'auto' : '100%',
        whiteSpace: 'nowrap',
        backgroundColor: 'rgba(255,255,255,0.08)',
        color: '#ffffff',
        border: '1px solid rgba(134,239,172,0.25)',
        padding: '9px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
      <span>Mode {theme === 'light' ? 'Gelap' : 'Terang'}</span>
    </button>
  );
}
