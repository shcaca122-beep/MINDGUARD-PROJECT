import "./globals.css";

export const metadata = {
  title: "Ruang Tenang",
  description: "Z-Solution",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}