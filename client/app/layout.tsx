import './globals.css';
import AppLayout from '@/components/AppLayout';
import ThemeSync from '@/components/ThemeSync';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <ThemeSync />
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}