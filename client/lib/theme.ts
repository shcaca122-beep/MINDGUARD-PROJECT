'use client';

export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'student-dashboard-theme';
const THEME_CHANGE_EVENT = 'mindguard-theme-change';

export function getThemeSnapshot(): AppTheme {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function getServerThemeSnapshot(): AppTheme {
  return 'light';
}

export function subscribeToTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function saveTheme(theme: AppTheme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
