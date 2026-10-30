import './globals.css';
import ThemeSync from '@/components/ThemeSync';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata = {
  title: 'MindGuard - SMK Budi Bakti Ciwidey',
  description: 'Sistem Informasi Bimbingan Konseling',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-theme="light">
      <body className="antialiased">
        <ThemeSync />
        {children}
        <ThemeToggle compact />
      </body>
    </html>
  );
}