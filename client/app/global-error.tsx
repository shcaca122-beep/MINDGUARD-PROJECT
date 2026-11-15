'use client';

import { useEffect } from 'react';
import ErrorScreen from '@/components/ErrorScreen';
import './globals.css';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled root application error:', error);
  }, [error]);

  return (
    <html lang="id">
      <body>
        <ErrorScreen
          title="Aplikasi mengalami kendala"
          description="Maaf, MindGuard mengalami gangguan saat memuat halaman. Data akun Anda tetap aman. Silakan coba lagi, atau kembali ke beranda."
          reference={error.digest}
          onRetry={reset}
        />
      </body>
    </html>
  );
}
