import './globals.css';
import './glassy-theme.css';
import ConnectionStatus from '@/components/ConnectionStatus';

export const metadata = {
  title: 'MindGuard - SMK Budi Bakti Ciwidey',
  description: 'Sistem Informasi Bimbingan Konseling',
  icons: {
    icon: '/logo-mindguard.jpeg',
    apple: '/logo-mindguard.jpeg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" data-theme="dark">
      <body className="antialiased">
        <ConnectionStatus />
        {children}
      </body>
    </html>
  );
}