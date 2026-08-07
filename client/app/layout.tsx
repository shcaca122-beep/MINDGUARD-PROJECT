import './globals.css';
import AppLayout from '@/components/AppLayout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}