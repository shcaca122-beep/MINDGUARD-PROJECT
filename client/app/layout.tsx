import './globals.css';

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
    <html lang="id">
      <body className="antialiased bg-[#07241B]">
        {children}
      </body>
    </html>
  );
}