import ErrorScreen from '@/components/ErrorScreen';

export default function NotFound() {
  return (
    <ErrorScreen
      eyebrow="HALAMAN TIDAK DITEMUKAN"
      title="Halaman ini tidak tersedia"
      description="Alamat yang Anda buka mungkin salah atau halaman sudah dipindahkan. Silakan kembali ke beranda."
    />
  );
}
