'use client';

import { useEffect } from 'react';
import ErrorScreen from '@/components/ErrorScreen';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <ErrorScreen
      title="Halaman belum bisa ditampilkan"
      description="Maaf, sepertinya ada kendala saat memuat halaman ini. Data akun Anda tetap aman. Silakan coba lagi, atau kembali ke beranda."
      reference={error.digest}
      onRetry={reset}
    />
  );
}
