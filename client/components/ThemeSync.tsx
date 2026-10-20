'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { getServerThemeSnapshot, getThemeSnapshot, subscribeToTheme } from '@/lib/theme';

export default function ThemeSync() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return null;
}
